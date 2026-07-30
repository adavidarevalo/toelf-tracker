"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  decryptJSON,
  deriveKey,
  encryptJSON,
  exportKeyToBase64,
  generateSalt,
  importKeyFromBase64,
  saltFromBase64,
  saltToBase64,
  type EncryptedBlob,
} from "@/lib/crypto";
import { toISODate } from "@/lib/date";
import { generateSyncCode, normalizeSyncCode } from "@/lib/syncCode";
import { createDefaultAppData, mergeWithDefaults, type AppData } from "@/lib/types";

const SALT_KEY = "toefl90:salt";
const BLOB_KEY = "toefl90:blob";
const SESSION_KEY = "toefl90:session";
const SYNC_CODE_KEY = "toefl90:syncCode";
const SAVE_DEBOUNCE_MS = 400;
const MIN_PASSWORD_LENGTH = 6;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // stay unlocked for one day without re-entering the password

export type AuthStatus = "checking" | "needs-signup" | "needs-login" | "unlocked";

interface SessionToken {
  key: string; // base64-encoded raw AES key
  expiresAt: number;
}

async function saveSession(key: CryptoKey) {
  const token: SessionToken = { key: await exportKeyToBase64(key), expiresAt: Date.now() + SESSION_TTL_MS };
  localStorage.setItem(SESSION_KEY, JSON.stringify(token));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * The salt + encrypted blob are also synced to a shared server-side store (see
 * src/app/api/account/route.ts) so the same account works from any device — otherwise
 * each browser's localStorage is its own island and a new device thinks no account exists.
 * All failures here are swallowed: without a reachable server, the app just keeps working
 * from the local copy, same as before this feature existed.
 *
 * The credential is a random per-account "sync code" generated in the browser at signup
 * (see lib/syncCode.ts) — never a value baked into the app's build, since anything with a
 * NEXT_PUBLIC_ prefix ends up readable in the shipped JS by any visitor. Knowing the code
 * is both proof of ownership and the account's address, the same trust model as an API key;
 * a second device is linked by typing the code in (see linkDevice below), not by trusting
 * the deployment itself.
 */
export type SyncStatus = "unknown" | "synced" | "local-only";

interface RemoteAccount {
  salt: string;
  blob: EncryptedBlob;
}

function getStoredSyncCode(): string | null {
  return localStorage.getItem(SYNC_CODE_KEY);
}

function setStoredSyncCode(code: string) {
  localStorage.setItem(SYNC_CODE_KEY, code);
}

/** Generates and persists a sync code for this account if one doesn't exist yet. */
function ensureSyncCode(): string {
  const existing = getStoredSyncCode();
  if (existing) return existing;
  const created = generateSyncCode();
  setStoredSyncCode(created);
  return created;
}

async function fetchRemoteAccount(code: string): Promise<RemoteAccount | null> {
  try {
    const res = await fetch("/api/account", { headers: { "x-sync-token": code }, cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as RemoteAccount | null;
    return data?.salt && data.blob ? data : null;
  } catch {
    return null;
  }
}

async function pushRemoteAccount(code: string, saltB64: string, blob: EncryptedBlob): Promise<boolean> {
  try {
    const res = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-sync-token": code },
      body: JSON.stringify({ salt: saltB64, blob }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deleteRemoteAccount(code: string): Promise<void> {
  try {
    await fetch("/api/account", { method: "DELETE", headers: { "x-sync-token": code } });
  } catch {
    // best effort — a local reset shouldn't be blocked by network issues
  }
}

interface PlanStoreValue {
  status: AuthStatus;
  syncStatus: SyncStatus;
  syncCode: string | null;
  linkError: string | null;
  appData: AppData | null;
  error: string | null;
  clearError: () => void;
  signUp: (password: string, confirmPassword: string) => Promise<void>;
  logIn: (password: string) => Promise<void>;
  logOut: () => void;
  forgotPassword: () => void;
  changePassword: (current: string, next: string, confirmNext: string) => Promise<void>;
  linkDevice: (code: string) => Promise<boolean>;
  clearLinkError: () => void;
  updateAppData: (updater: (draft: AppData) => void) => void;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<void>;
}

const PlanStoreContext = createContext<PlanStoreValue | null>(null);

export function usePlanStore(): PlanStoreValue {
  const ctx = useContext(PlanStoreContext);
  if (!ctx) throw new Error("usePlanStore must be used within a PlanStoreProvider");
  return ctx;
}

/**
 * Client-only by construction (mounted via next/dynamic with ssr:false — see PlanApp.tsx),
 * so it's safe to read localStorage directly in the initial state without risking a
 * server/client hydration mismatch.
 */
export function PlanStoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("unknown");
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const code = getStoredSyncCode();
      setSyncCode(code);

      // A device that already knows its account's sync code pulls the server copy down
      // first, so it sees "enter your password" instead of "create a new account" after,
      // say, reinstalling the browser.
      const remote = code ? await fetchRemoteAccount(code) : null;
      if (remote) {
        localStorage.setItem(SALT_KEY, remote.salt);
        localStorage.setItem(BLOB_KEY, JSON.stringify(remote.blob));
      }
      if (cancelled) return;
      setSyncStatus(remote ? "synced" : "local-only");

      const blobRaw = localStorage.getItem(BLOB_KEY);
      if (!blobRaw) {
        if (!cancelled) setStatus("needs-signup");
        return;
      }

      const sessionRaw = localStorage.getItem(SESSION_KEY);
      if (sessionRaw) {
        try {
          const session = JSON.parse(sessionRaw) as SessionToken;
          if (session.expiresAt > Date.now()) {
            const key = await importKeyFromBase64(session.key);
            const loaded = await decryptJSON<AppData>(key, JSON.parse(blobRaw) as EncryptedBlob);
            if (!cancelled) {
              cryptoKeyRef.current = key;
              setAppData(mergeWithDefaults(loaded, createDefaultAppData()));
              setStatus("unlocked");
            }
            if (!remote) {
              // This device has an account the server has never seen (e.g. it existed
              // before sync was added) — mint a code for it and seed the shared store.
              const activeCode = code ?? ensureSyncCode();
              if (!cancelled) setSyncCode(activeCode);
              const saltB64 = localStorage.getItem(SALT_KEY);
              if (saltB64) {
                const synced = await pushRemoteAccount(activeCode, saltB64, JSON.parse(blobRaw) as EncryptedBlob);
                if (!cancelled) setSyncStatus(synced ? "synced" : "local-only");
              }
            }
            return;
          }
        } catch {
          // Corrupted or stale token — fall through to a normal password prompt.
        }
        localStorage.removeItem(SESSION_KEY);
      }

      if (!cancelled) setStatus("needs-login");
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistNow = useCallback(async (data: AppData) => {
    if (!cryptoKeyRef.current) return;
    const blob = await encryptJSON(cryptoKeyRef.current, data);
    localStorage.setItem(BLOB_KEY, JSON.stringify(blob));
    const saltB64 = localStorage.getItem(SALT_KEY);
    if (saltB64) {
      const code = ensureSyncCode();
      setSyncCode(code);
      const synced = await pushRemoteAccount(code, saltB64, blob);
      setSyncStatus(synced ? "synced" : "local-only");
    }
  }, []);

  const scheduleSave = useCallback(
    (data: AppData) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void persistNow(data);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistNow]
  );

  const clearError = useCallback(() => setError(null), []);
  const clearLinkError = useCallback(() => setLinkError(null), []);

  const signUp = useCallback(async (password: string, confirmPassword: string) => {
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    const salt = generateSalt();
    localStorage.setItem(SALT_KEY, saltToBase64(salt));
    const key = await deriveKey(password, salt);
    cryptoKeyRef.current = key;
    const fresh = createDefaultAppData();
    await persistNow(fresh);
    await saveSession(key);
    setAppData(fresh);
    setStatus("unlocked");
  }, [persistNow]);

  const logIn = useCallback(async (password: string) => {
    setError(null);
    const code = getStoredSyncCode();
    // Pull the latest copy in case another device saved changes since this one last checked.
    const remote = code ? await fetchRemoteAccount(code) : null;
    if (remote) {
      localStorage.setItem(SALT_KEY, remote.salt);
      localStorage.setItem(BLOB_KEY, JSON.stringify(remote.blob));
    }
    setSyncStatus(remote ? "synced" : "local-only");

    const saltB64 = localStorage.getItem(SALT_KEY);
    const blobRaw = localStorage.getItem(BLOB_KEY);
    if (!saltB64 || !blobRaw) {
      setError("No hay datos guardados. Recarga la página.");
      return;
    }
    try {
      const key = await deriveKey(password, saltFromBase64(saltB64));
      const blob = JSON.parse(blobRaw) as EncryptedBlob;
      const loaded = await decryptJSON<AppData>(key, blob);
      cryptoKeyRef.current = key;
      await saveSession(key);
      setAppData(mergeWithDefaults(loaded, createDefaultAppData()));
      setStatus("unlocked");
      if (!remote) {
        // This device has an account the server has never seen — mint a code and seed it.
        const activeCode = code ?? ensureSyncCode();
        setSyncCode(activeCode);
        const synced = await pushRemoteAccount(activeCode, saltB64, blob);
        setSyncStatus(synced ? "synced" : "local-only");
      }
    } catch {
      setError("Contraseña incorrecta.");
    }
  }, []);

  const logOut = useCallback(() => {
    cryptoKeyRef.current = null;
    clearSession();
    setAppData(null);
    setStatus("needs-login");
  }, []);

  const forgotPassword = useCallback(() => {
    const code = getStoredSyncCode();
    if (code) void deleteRemoteAccount(code);
    localStorage.removeItem(SALT_KEY);
    localStorage.removeItem(BLOB_KEY);
    localStorage.removeItem(SYNC_CODE_KEY);
    clearSession();
    cryptoKeyRef.current = null;
    setAppData(null);
    setSyncStatus("unknown");
    setSyncCode(null);
    setStatus("needs-signup");
  }, []);

  const changePassword = useCallback(
    async (current: string, next: string, confirmNext: string) => {
      setError(null);
      const saltB64 = localStorage.getItem(SALT_KEY);
      const blobRaw = localStorage.getItem(BLOB_KEY);
      if (!saltB64 || !blobRaw || !appData) return;
      try {
        const currentKey = await deriveKey(current, saltFromBase64(saltB64));
        await decryptJSON<AppData>(currentKey, JSON.parse(blobRaw) as EncryptedBlob);
      } catch {
        setError("Contraseña actual incorrecta.");
        return;
      }
      if (next.length < MIN_PASSWORD_LENGTH) {
        setError(`La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
        return;
      }
      if (next !== confirmNext) {
        setError("Las nuevas contraseñas no coinciden.");
        return;
      }
      const newSalt = generateSalt();
      const newKey = await deriveKey(next, newSalt);
      localStorage.setItem(SALT_KEY, saltToBase64(newSalt));
      cryptoKeyRef.current = newKey;
      await persistNow(appData);
      await saveSession(newKey);
    },
    [appData, persistNow]
  );

  /** Pulls an existing account down onto a fresh device using a sync code typed in by the user. */
  const linkDevice = useCallback(async (rawCode: string): Promise<boolean> => {
    setLinkError(null);
    const code = normalizeSyncCode(rawCode);
    if (code.length < 8) {
      setLinkError("Ese código no parece válido.");
      return false;
    }
    const remote = await fetchRemoteAccount(code);
    if (!remote) {
      setLinkError("No encontramos ninguna cuenta con ese código.");
      return false;
    }
    setStoredSyncCode(code);
    localStorage.setItem(SALT_KEY, remote.salt);
    localStorage.setItem(BLOB_KEY, JSON.stringify(remote.blob));
    setSyncCode(code);
    setSyncStatus("synced");
    setStatus("needs-login");
    return true;
  }, []);

  const updateAppData = useCallback(
    (updater: (draft: AppData) => void) => {
      setAppData((prev) => {
        if (!prev) return prev;
        const draft = structuredClone(prev);
        updater(draft);
        scheduleSave(draft);
        return draft;
      });
    },
    [scheduleSave]
  );

  const exportBackup = useCallback(() => {
    if (!appData) return;
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toefl-plan-respaldo-${toISODate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [appData]);

  const importBackup = useCallback(
    async (file: File) => {
      const text = await file.text();
      const loaded = JSON.parse(text) as AppData;
      const merged = mergeWithDefaults(loaded, createDefaultAppData());
      setAppData(merged);
      scheduleSave(merged);
    },
    [scheduleSave]
  );

  const value = useMemo<PlanStoreValue>(
    () => ({
      status,
      syncStatus,
      syncCode,
      linkError,
      appData,
      error,
      clearError,
      signUp,
      logIn,
      logOut,
      forgotPassword,
      changePassword,
      linkDevice,
      clearLinkError,
      updateAppData,
      exportBackup,
      importBackup,
    }),
    [
      status,
      syncStatus,
      syncCode,
      linkError,
      appData,
      error,
      clearError,
      signUp,
      logIn,
      logOut,
      forgotPassword,
      changePassword,
      linkDevice,
      clearLinkError,
      updateAppData,
      exportBackup,
      importBackup,
    ]
  );

  return <PlanStoreContext.Provider value={value}>{children}</PlanStoreContext.Provider>;
}
