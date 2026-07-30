const PBKDF2_ITERATIONS = 150_000;

export interface EncryptedBlob {
  iv: string;
  data: string;
}

function bufToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function saltToBase64(salt: Uint8Array): string {
  return bufToBase64(salt);
}

export function saltFromBase64(b64: string): Uint8Array {
  return base64ToBuf(b64);
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true, // extractable — needed so the key can be cached as a short-lived session token
    ["encrypt", "decrypt"]
  );
}

/** Exports the raw key so it can be cached as a session token (see PlanStore's SESSION_KEY). */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufToBase64(new Uint8Array(raw));
}

export async function importKeyFromBase64(b64: string): Promise<CryptoKey> {
  const raw = base64ToBuf(b64);
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

export async function encryptJSON<T>(key: CryptoKey, value: T): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encoder.encode(JSON.stringify(value))
  );
  return { iv: bufToBase64(iv), data: bufToBase64(new Uint8Array(ciphertext)) };
}

/** Throws if the key/blob combination is wrong (wrong password) — AES-GCM auth tag check. */
export async function decryptJSON<T>(key: CryptoKey, blob: EncryptedBlob): Promise<T> {
  const iv = base64ToBuf(blob.iv);
  const data = base64ToBuf(blob.data);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data as BufferSource);
  return JSON.parse(new TextDecoder().decode(plainBuf)) as T;
}
