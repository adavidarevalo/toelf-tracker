import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";
import type { EncryptedBlob } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const STORE_NAME = "toefl-account";
const RECORD_KEY = "account";

interface AccountRecord {
  salt: string;
  blob: EncryptedBlob;
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.NEXT_PUBLIC_SYNC_TOKEN;
  if (!expected) return false;
  return request.headers.get("x-sync-token") === expected;
}

function accountStore() {
  // Strong consistency: this store is a single low-traffic record checked on every
  // page load/login, so we'd rather pay the latency than risk a device seeing a
  // stale (or just-deleted) account within Blobs' default ~60s propagation window.
  return getStore(STORE_NAME, { consistency: "strong" });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const record = await accountStore().get(RECORD_KEY, { type: "json" });
    return NextResponse.json(record ?? null);
  } catch {
    return NextResponse.json({ error: "blobs-unavailable" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
    await accountStore().setJSON(RECORD_KEY, body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "blobs-unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await accountStore().delete(RECORD_KEY);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "blobs-unavailable" }, { status: 503 });
  }
}
