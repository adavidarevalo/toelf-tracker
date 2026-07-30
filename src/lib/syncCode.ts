// Crockford base32 — no 0/O, 1/I/L, or U, so a handwritten or read-aloud code isn't ambiguous.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_BYTES = 10; // 80 bits of entropy — 16 base32 chars, grouped as XXXX-XXXX-XXXX-XXXX

function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

/** A random, unguessable per-account code — generated client-side, never compiled into any bundle. */
export function generateSyncCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_BYTES));
  return (toBase32(bytes).match(/.{1,4}/g) ?? []).join("-");
}

export function normalizeSyncCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Knowing the code is both the account's identity and its authorization (a bearer
 * capability, like an API key) — we hash it before using it as the server-side storage
 * key so the raw code isn't what ends up stored as a record name.
 */
export async function hashSyncCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeSyncCode(code));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
