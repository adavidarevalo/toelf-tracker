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
import { createDefaultAppData, mergeWithDefaults, type AppData } from "@/lib/types";

const SALT_KEY = "toefl90:salt";
const BLOB_KEY = "toefl90:blob";
const SESSION_KEY = "toefl90:session";
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

interface PlanStoreValue {
  status: AuthStatus;
  appData: AppData | null;
  error: string | null;
  clearError: () => void;
  signUp: (password: string, confirmPassword: string) => Promise<void>;
  logIn: (password: string) => Promise<void>;
  logOut: () => void;
  forgotPassword: () => void;
  changePassword: (current: string, next: string, confirmNext: string) => Promise<void>;
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
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
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
    localStorage.removeItem(SALT_KEY);
    localStorage.removeItem(BLOB_KEY);
    clearSession();
    cryptoKeyRef.current = null;
    setAppData(null);
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
      appData,
      error,
      clearError,
      signUp,
      logIn,
      logOut,
      forgotPassword,
      changePassword,
      updateAppData,
      exportBackup,
      importBackup,
    }),
    [
      status,
      appData,
      error,
      clearError,
      signUp,
      logIn,
      logOut,
      forgotPassword,
      changePassword,
      updateAppData,
      exportBackup,
      importBackup,
    ]
  );

  return <PlanStoreContext.Provider value={value}>{children}</PlanStoreContext.Provider>;
}
