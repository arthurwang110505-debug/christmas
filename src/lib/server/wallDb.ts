import { sql } from "drizzle-orm";

/**
 * Server helpers for Home Sync. The database is optional: if it cannot be
 * reached (for example a deployment without DATABASE_URL), callers get a
 * clean "unavailable" error and the client keeps working from local storage.
 */

export class SyncUnavailable extends Error {}

let schemaReady: Promise<void> | null = null;

export async function getDb() {
  try {
    const { db } = await import("@/db");
    schemaReady ??= (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS homes (
          code text PRIMARY KEY,
          created_at timestamptz NOT NULL DEFAULT now()
        )`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS wall_messages (
          id uuid PRIMARY KEY,
          home_code text NOT NULL REFERENCES homes(code) ON DELETE CASCADE,
          author text NOT NULL,
          body text NOT NULL,
          kind text NOT NULL,
          tone text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )`);
      await db.execute(
        sql`CREATE INDEX IF NOT EXISTS wall_messages_home_idx ON wall_messages (home_code, created_at)`,
      );
    })();
    await schemaReady;
    return db;
  } catch (e) {
    schemaReady = null;
    console.error("[home-sync] database unavailable:", e instanceof Error ? e.message : e);
    throw new SyncUnavailable("database_unavailable");
  }
}

/** Unambiguous alphabet (no 0/O, 1/I/L). 12 characters ≈ 59 bits: not guessable. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 12;

export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (code.length !== CODE_LENGTH) return null;
  for (const ch of code) if (!CODE_ALPHABET.includes(ch)) return null;
  return code;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const buckets = new Map<string, { count: number; reset: number }>();

/** Small in-memory limiter (per server instance) to blunt abuse of the public endpoints. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    }
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
