import { randomInt } from "node:crypto";
import { homes } from "@/db/schema";
import { clientIp, CODE_ALPHABET, CODE_LENGTH, getDb, json, rateLimit, SyncUnavailable } from "@/lib/server/wallDb";

export const dynamic = "force-dynamic";

/** Create a new home and return its share code. */
export async function POST(req: Request) {
  if (!rateLimit(`homes:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return json({ error: "rate_limited" }, 429);
  }
  try {
    const db = await getDb();
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    await db.insert(homes).values({ code });
    return json({ code }, 201);
  } catch (e) {
    if (e instanceof SyncUnavailable) return json({ error: "sync_unavailable" }, 503);
    console.error("[home-sync] create home failed:", e);
    return json({ error: "server_error" }, 500);
  }
}
