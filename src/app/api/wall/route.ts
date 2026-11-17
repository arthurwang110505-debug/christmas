import { and, count, desc, eq } from "drizzle-orm";
import { homes, wallMessages } from "@/db/schema";
import { clientIp, getDb, json, normalizeCode, rateLimit, SyncUnavailable, UUID_RE } from "@/lib/server/wallDb";

export const dynamic = "force-dynamic";

const KINDS = new Set(["message", "wish"]);
const TONES = new Set(["cream", "forest", "burgundy", "gold"]);
const MAX_NOTES_PER_HOME = 300;

function fail(e: unknown) {
  if (e instanceof SyncUnavailable) return json({ error: "sync_unavailable" }, 503);
  console.error("[home-sync] wall request failed:", e);
  return json({ error: "server_error" }, 500);
}

async function homeExists(db: Awaited<ReturnType<typeof getDb>>, code: string) {
  const rows = await db.select({ code: homes.code }).from(homes).where(eq(homes.code, code)).limit(1);
  return rows.length > 0;
}

/** List the notes of a home (newest first). 404 when the code is unknown. */
export async function GET(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`wall-read:${ip}`, 240, 60_000)) return json({ error: "rate_limited" }, 429);
  const code = normalizeCode(new URL(req.url).searchParams.get("home"));
  if (!code) return json({ error: "home_not_found" }, 404);
  try {
    const db = await getDb();
    if (!(await homeExists(db, code))) {
      // Slow down anyone guessing codes.
      if (!rateLimit(`wall-miss:${ip}`, 20, 10 * 60_000)) return json({ error: "rate_limited" }, 429);
      return json({ error: "home_not_found" }, 404);
    }
    const rows = await db
      .select()
      .from(wallMessages)
      .where(eq(wallMessages.homeCode, code))
      .orderBy(desc(wallMessages.createdAt))
      .limit(MAX_NOTES_PER_HOME);
    return json({
      notes: rows.map((r) => ({
        id: r.id,
        author: r.author,
        body: r.body,
        kind: r.kind,
        tone: r.tone,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return fail(e);
  }
}

interface Incoming {
  id: string;
  author: string;
  body: string;
  kind: string;
  tone: string;
  createdAt: Date;
}

function parseNote(raw: unknown): Incoming | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Record<string, unknown>;
  if (typeof n.id !== "string" || !UUID_RE.test(n.id)) return null;
  if (typeof n.author !== "string" || typeof n.body !== "string") return null;
  const author = n.author.trim();
  const body = n.body.trim();
  if (author.length < 1 || author.length > 40 || body.length < 1 || body.length > 500) return null;
  if (typeof n.kind !== "string" || !KINDS.has(n.kind)) return null;
  if (typeof n.tone !== "string" || !TONES.has(n.tone)) return null;
  // Trust the device's timestamp only if it is plausible.
  let createdAt = new Date();
  if (typeof n.createdAt === "string") {
    const d = new Date(n.createdAt);
    if (!Number.isNaN(d.getTime()) && d.getTime() <= Date.now() + 5 * 60_000 && d.getFullYear() >= 2024) createdAt = d;
  }
  return { id: n.id.toLowerCase(), author, body, kind: n.kind, tone: n.tone, createdAt };
}

/** Add notes to a home. Idempotent: re-sending a note with the same id is a no-op. */
export async function POST(req: Request) {
  if (!rateLimit(`wall-write:${clientIp(req)}`, 120, 60_000)) return json({ error: "rate_limited" }, 429);
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const p = (payload ?? {}) as Record<string, unknown>;
  const code = normalizeCode(p.home);
  if (!code) return json({ error: "home_not_found" }, 404);
  if (!Array.isArray(p.notes) || p.notes.length === 0 || p.notes.length > 50) {
    return json({ error: "invalid_notes" }, 400);
  }
  const notes = p.notes.map(parseNote);
  if (notes.some((n) => n === null)) return json({ error: "invalid_notes" }, 400);

  try {
    const db = await getDb();
    if (!(await homeExists(db, code))) return json({ error: "home_not_found" }, 404);
    const [{ n }] = await db.select({ n: count() }).from(wallMessages).where(eq(wallMessages.homeCode, code));
    if (n + notes.length > MAX_NOTES_PER_HOME) return json({ error: "wall_full" }, 409);
    await db
      .insert(wallMessages)
      .values((notes as Incoming[]).map((x) => ({ ...x, homeCode: code })))
      .onConflictDoNothing();
    return json({ saved: notes.length });
  } catch (e) {
    return fail(e);
  }
}

/** Remove one note from a home. */
export async function DELETE(req: Request) {
  if (!rateLimit(`wall-write:${clientIp(req)}`, 120, 60_000)) return json({ error: "rate_limited" }, 429);
  const params = new URL(req.url).searchParams;
  const code = normalizeCode(params.get("home"));
  const id = params.get("id") ?? "";
  if (!code) return json({ error: "home_not_found" }, 404);
  if (!UUID_RE.test(id)) return json({ error: "invalid_id" }, 400);
  try {
    const db = await getDb();
    if (!(await homeExists(db, code))) return json({ error: "home_not_found" }, 404);
    await db.delete(wallMessages).where(and(eq(wallMessages.id, id.toLowerCase()), eq(wallMessages.homeCode, code)));
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
