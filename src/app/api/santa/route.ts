import { clientIp, json, rateLimit } from "@/lib/server/wallDb";

export const dynamic = "force-dynamic";

/**
 * Optional AI Santa. Works with any OpenAI-compatible chat endpoint, so a
 * family can plug in whichever (free) provider they like:
 *
 *   SANTA_AI_API_KEY   – required to enable AI
 *   SANTA_AI_MODEL     – required to enable AI (model name at that provider)
 *   SANTA_AI_BASE_URL  – optional, defaults to https://api.openai.com/v1
 *
 * The key is read on the server only and never reaches the browser. Without
 * it, this route reports "not configured" and the page uses Santa's built-in
 * letters instead.
 */

function config() {
  const key = process.env.SANTA_AI_API_KEY?.trim();
  const model = process.env.SANTA_AI_MODEL?.trim();
  if (!key || !model) return null;
  const base = (process.env.SANTA_AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  return { key, model, base };
}

export async function GET() {
  return json({ ai: config() !== null });
}

type Lang = "en" | "zh";
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function systemPrompt(lang: Lang, family: string) {
  const language = lang === "zh" ? "Traditional Chinese (繁體中文, as used in Taiwan)" : "English";
  return [
    "You are Santa Claus, writing to a family through their Christmas website.",
    "Personality: warm, gentle, a little playful, with the occasional 'Ho ho ho'. You speak simply so young children can follow.",
    `Always reply in ${language}. Plain text only: no markdown, no lists, no emoji.`,
    "Everything you say must be suitable for young children.",
    "Never promise a specific gift; say you will write the wish in your book.",
    "Never ask for or repeat personal details such as addresses, schools, phone numbers or full names.",
    "If asked about something unsuitable for children or unrelated to family, kindness or Christmas, gently steer back to Christmas.",
    "If a child sounds sad, scared or unsafe, be kind and encourage them to talk to a grown-up they trust.",
    family ? `The family calls itself: ${family}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

async function complete(cfg: NonNullable<ReturnType<typeof config>>, messages: { role: string; content: string }[]) {
  const call = (tokenField: "max_tokens" | "max_completion_tokens") =>
    fetch(`${cfg.base}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({ model: cfg.model, messages, temperature: 0.8, [tokenField]: 600 }),
      signal: AbortSignal.timeout(25_000),
    });

  let res = await call("max_tokens");
  if (res.status === 400) {
    // Some newer models only accept `max_completion_tokens`.
    const text = await res.text();
    if (text.includes("max_completion_tokens")) res = await call("max_completion_tokens");
    else throw new Error(`provider_400`);
  }
  if (!res.ok) throw new Error(`provider_${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("provider_empty");
  return content.trim().slice(0, 4000);
}

export async function POST(req: Request) {
  const cfg = config();
  if (!cfg) return json({ ok: false, reason: "not_configured" });
  if (!rateLimit(`santa:${clientIp(req)}`, 20, 60_000)) return json({ ok: false, reason: "rate_limited" }, 429);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, reason: "invalid_request" }, 400);
  }

  const lang: Lang = body.lang === "zh" ? "zh" : "en";
  const family = clean(body.family, 40);
  const task = body.task;
  const messages: { role: string; content: string }[] = [{ role: "system", content: systemPrompt(lang, family) }];

  if (task === "chat") {
    if (!Array.isArray(body.messages)) return json({ ok: false, reason: "invalid_request" }, 400);
    const history: ChatMessage[] = [];
    for (const m of body.messages.slice(-12)) {
      const role = (m as ChatMessage)?.role;
      const content = clean((m as ChatMessage)?.content, 600);
      if ((role === "user" || role === "assistant") && content) history.push({ role, content });
    }
    if (history.length === 0 || history[history.length - 1].role !== "user") {
      return json({ ok: false, reason: "invalid_request" }, 400);
    }
    messages.push({ role: "system", content: "Keep each reply under 90 words." }, ...history);
  } else if (task === "greeting") {
    const to = clean(body.to, 60) || "a dear friend";
    const from = clean(body.from, 60) || family || "our family";
    const tone = body.tone === "playful" ? "playful and funny" : body.tone === "short" ? "very short (one or two sentences)" : "warm and heartfelt";
    messages.push({
      role: "user",
      content: `Please write a ${tone} Christmas greeting card message addressed to "${to}" and signed from "${from}". At most 70 words. Write only the message itself.`,
    });
  } else if (task === "story") {
    const name = clean(body.name, 40) || "a child";
    const thing = clean(body.thing, 60) || "a favourite blanket";
    messages.push({
      role: "user",
      content: `Please tell a gentle bedtime Christmas story of about 180 words. The hero is "${name}", and "${thing}" should play a part. Give it a cosy, happy ending. Write only the story.`,
    });
  } else {
    return json({ ok: false, reason: "invalid_request" }, 400);
  }

  try {
    const text = await complete(cfg, messages);
    return json({ ok: true, text });
  } catch (e) {
    console.error("[santa] provider call failed:", e instanceof Error ? e.message : e);
    return json({ ok: false, reason: "provider_error" }, 502);
  }
}
