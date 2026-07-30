import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";
import type { EncryptedBlob } from "@/lib/crypto";
import { hashSyncCode } from "@/lib/syncCode";

export const dynamic = "force-dynamic";

const STORE_NAME = "toefl-account";

interface AccountRecord {
  salt: string;
  blob: EncryptedBlob;
}

function accountStore() {
  // Strong consistency: this store is a single low-traffic record checked on every
  // page load/login, so we'd rather pay the latency than risk a device seeing a
  // stale (or just-deleted) account within Blobs' default ~60s propagation window.
  return getStore(STORE_NAME, { consistency: "strong" });
}

/**
 * The sync code is generated client-side at signup and never compiled into any bundle —
 * knowing it is both the account's identity and its authorization (a bearer capability,
 * the same trust model as an API key). We hash it into the storage key rather than using
 * it directly, so the raw code isn't what ends up stored as a record name, and one
 * account's key can't be guessed from another's.
 */
async function recordKeyFromRequest(request: NextRequest): Promise<string | null> {
  const token = request.headers.get("x-sync-token");
  if (!token || token.length < 8) return null;
  return hashSyncCode(token);
}

export async function GET(request: NextRequest) {
  const key = await recordKeyFromRequest(request);
  if (!key) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const record = await accountStore().get(key, { type: "json" });
    return NextResponse.json(record ?? null);
  } catch {
    return NextResponse.json({ error: "blobs-unavailable" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const key = await recordKeyFromRequest(request);
  if (!key) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: AccountRecord;
  try {
    body = (await request.json()) as AccountRecord;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  if (!body?.salt || !body?.blob?.iv || !body?.blob?.data) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }
  try {
    await accountStore().setJSON(key, body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "blobs-unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const key = await recordKeyFromRequest(request);
  if (!key) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await accountStore().delete(key);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "blobs-unavailable" }, { status: 503 });
  }
}
