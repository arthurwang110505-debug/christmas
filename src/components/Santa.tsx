"use client";

import { BookOpen, Check, Copy, ImageIcon, MessageCircle, PenLine, Send } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { localChatReply, localGreeting, localStory, SUGGESTIONS, type GreetingTone } from "@/lib/content/santa";
import { useFamily, useLang, useT } from "@/lib/i18n";
import { btn, Button, Field, inputClass, Page, PageHeader, Segmented } from "./ui";

type Tab = "chat" | "greeting" | "story";
interface Msg {
  role: "user" | "assistant";
  content: string;
}

/** Ask the optional AI route. Resolves to null whenever AI is off or fails, so callers fall back locally. */
async function askAi(payload: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch("/api/santa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; text?: unknown };
    return data.ok && typeof data.text === "string" ? data.text : null;
  } catch {
    return null;
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function CopyButton({ text }: { text: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  return (
    <Button
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("done");
        } catch {
          setState("failed");
        }
        window.setTimeout(() => setState("idle"), 2200);
      }}
    >
      {state === "done" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {state === "done"
        ? t("Copied", "已複製")
        : state === "failed"
          ? t("Select the text to copy", "請手動選取文字複製")
          : t("Copy", "複製")}
    </Button>
  );
}

function Chat({ ai, onAiDown }: { ai: boolean; onAiDown: () => void }) {
  const t = useT();
  const lang = useLang();
  const family = useFamily();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const turn = useRef(0);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  const send = async (raw: string) => {
    const content = raw.trim().slice(0, 600);
    if (!content || busy) return;
    const history = [...msgs, { role: "user" as const, content }];
    setMsgs(history);
    setText("");
    setBusy(true);
    let reply: string | null = null;
    if (ai) {
      reply = await askAi({ task: "chat", lang, family: family.name, messages: history });
      if (reply === null) onAiDown();
    }
    if (reply === null) {
      await wait(650);
      reply = localChatReply(content, lang, turn.current++);
    }
    setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    setBusy(false);
  };

  const welcome = t(
    `Ho ho ho! Welcome, ${family.label}. The fire is warm and the cocoa is hot. What would you like to tell Santa?`,
    `呵呵呵！歡迎你，${family.label}。爐火正暖，熱可可也準備好了。你想跟聖誕老人說些什麼呢？`,
  );

  return (
    <div>
      <div
        ref={log}
        role="log"
        aria-live="polite"
        aria-label={t("Conversation with Santa", "與聖誕老人的對話")}
        tabIndex={0}
        className="h-[min(52svh,30rem)] space-y-3 overflow-y-auto rounded-2xl border border-line bg-bg/50 p-4"
      >
        {[{ role: "assistant" as const, content: welcome }, ...msgs].map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p
              data-role={m.role}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] ${
                m.role === "user" ? "rounded-br-md bg-accent text-on-accent" : "rounded-bl-md bg-surface-2 text-ink"
              }`}
            >
              <span className="sr-only">{m.role === "user" ? t("You: ", "你：") : t("Santa: ", "聖誕老人：")}</span>
              {m.content}
            </p>
          </div>
        ))}
        {busy && (
          <p className="text-sm text-muted italic">{t("Santa is writing…", "聖誕老人正在寫字……")}</p>
        )}
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s[0]}
            type="button"
            disabled={busy}
            onClick={() => void send(t(s))}
            className="min-h-9 shrink-0 rounded-full border border-line px-3.5 text-sm text-muted transition-colors hover:border-accent hover:text-ink disabled:opacity-50"
          >
            {t(s)}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <label htmlFor="santa-input" className="sr-only">
          {t("Your message to Santa", "給聖誕老人的訊息")}
        </label>
        <input
          id="santa-input"
          className={inputClass}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={600}
          autoComplete="off"
          placeholder={t("Write to Santa…", "寫給聖誕老人……")}
        />
        <button type="submit" disabled={busy || !text.trim()} className={`${btn.primary} shrink-0`}>
          <Send className="size-4" aria-hidden />
          <span className="hidden sm:inline">{t("Send", "送出")}</span>
          <span className="sr-only sm:hidden">{t("Send", "送出")}</span>
        </button>
      </form>
    </div>
  );
}

function Greeting({ ai, onAiDown }: { ai: boolean; onAiDown: () => void }) {
  const t = useT();
  const lang = useLang();
  const family = useFamily();
  const router = useRouter();
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [tone, setTone] = useState<GreetingTone>("warm");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const seed = useRef(0);

  const generate = async () => {
    setBusy(true);
    const sender = from.trim() || family.name;
    let out: string | null = null;
    if (ai) {
      out = await askAi({ task: "greeting", lang, family: family.name, to, from: sender, tone });
      if (out === null) onAiDown();
    }
    if (out === null) {
      await wait(400);
      out = localGreeting(to, sender, tone, lang, seed.current++);
    }
    setResult(out);
    setBusy(false);
  };

  return (
    <div>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
      >
        <Field label={t("Who is it for?", "要送給誰？")}>
          <input className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} maxLength={60} placeholder={t("e.g. Auntie Mei", "例如：美阿姨")} />
        </Field>
        <Field label={t("Signed from", "署名")}>
          <input
            className={inputClass}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            maxLength={60}
            placeholder={family.name || t("e.g. the Lin family", "例如：林家")}
          />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">{t("Tone", "語氣")}</p>
          <Segmented
            label={t("Tone", "語氣")}
            value={tone}
            onChange={setTone}
            options={[
              { value: "warm", label: t("Warm", "溫暖") },
              { value: "playful", label: t("Playful", "俏皮") },
              { value: "short", label: t("Short", "簡短") },
            ]}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className={btn.primary} disabled={busy}>
            <PenLine className="size-4" aria-hidden />
            {busy ? t("Santa is writing…", "聖誕老人正在寫……") : result ? t("Write another", "再寫一則") : t("Write my greeting", "幫我寫祝福")}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6" aria-live="polite">
          <div className="paper rounded-2xl bg-cream p-6 text-forest shadow-lg shadow-black/10 sm:p-8">
            <p data-testid="greeting-result" className="display text-xl leading-relaxed font-light whitespace-pre-wrap">
              {result}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton text={result} />
            <Button
              variant="outline"
              onClick={() => {
                try {
                  window.localStorage.setItem("cw26:cardDraft", result);
                } catch {
                  /* the studio simply opens without the draft */
                }
                router.push("/wallpapers");
              }}
            >
              <ImageIcon className="size-4" aria-hidden />
              {t("Put it on a card", "做成賀卡")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Story({ ai, onAiDown }: { ai: boolean; onAiDown: () => void }) {
  const t = useT();
  const lang = useLang();
  const family = useFamily();
  const [name, setName] = useState("");
  const [thing, setThing] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const seed = useRef(0);

  const generate = async () => {
    setBusy(true);
    let out: string | null = null;
    if (ai) {
      out = await askAi({ task: "story", lang, family: family.name, name, thing });
      if (out === null) onAiDown();
    }
    if (out === null) {
      await wait(500);
      out = localStory(name, thing, lang, seed.current++);
    }
    setResult(out);
    setBusy(false);
  };

  return (
    <div>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
      >
        <Field label={t("Who is the hero?", "故事的主角是誰？")}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t("A child's first name", "孩子的名字")} />
        </Field>
        <Field label={t("A favourite thing", "最喜歡的東西")}>
          <input className={inputClass} value={thing} onChange={(e) => setThing(e.target.value)} maxLength={60} placeholder={t("e.g. a toy rabbit", "例如：玩具兔子")} />
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" className={btn.primary} disabled={busy}>
            <BookOpen className="size-4" aria-hidden />
            {busy ? t("Santa is thinking…", "聖誕老人正在想……") : result ? t("Tell another story", "再說一個故事") : t("Tell me a story", "說故事給我聽")}
          </button>
        </div>
      </form>
      {result && (
        <article className="mt-6" aria-live="polite">
          <p data-testid="story-result" className="display text-lg leading-[1.75] font-light whitespace-pre-wrap sm:text-xl">
            {result}
          </p>
          <div className="mt-4">
            <CopyButton text={result} />
          </div>
        </article>
      )}
    </div>
  );
}

export function Santa() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("chat");
  const [ai, setAi] = useState<boolean | null>(null);
  const [aiDown, setAiDown] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/santa")
      .then((r) => r.json())
      .then((d: { ai?: boolean }) => alive && setAi(Boolean(d.ai)))
      .catch(() => alive && setAi(false));
    return () => {
      alive = false;
    };
  }, []);

  const onAiDown = () => setAiDown(true);
  const useAi = ai === true;

  return (
    <Page>
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <PageHeader
            eyebrow={t("Santa's desk · North Pole", "聖誕老人的書桌・北極")}
            title={
              <>
                {t("A word with", "和聖誕老人")} <em className="text-accent">{t("Santa", "聊聊天")}</em>
              </>
            }
            intro={t(
              "Chat with Santa, ask him to write a greeting for someone you love, or settle in for a short bedtime story.",
              "和聖誕老人聊天，請他為你愛的人寫一段祝福，或是聽一個短短的睡前故事。",
            )}
          />
          <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-3xl border border-line lg:block">
            <Image
              src="/scenes/santa-desk.jpg"
              alt={t("A candle-lit writing desk with letters, spectacles and a mug of cocoa", "燭光下的書桌，上面有信件、眼鏡和一杯熱可可")}
              fill
              sizes="(min-width: 1024px) 40vw, 0px"
              className="object-cover"
            />
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed" data-testid="santa-mode" data-ai={ai === null ? "checking" : String(ai)}>
            <p className="font-semibold">
              {ai === null
                ? t("Checking the line to the North Pole…", "正在確認通往北極的線路……")
                : useAi
                  ? t("AI Santa is switched on", "AI 聖誕老人已啟用")
                  : t("Santa's workshop letters", "聖誕老人的工坊信件")}
            </p>
            <p className="mt-1 text-muted">
              {useAi
                ? aiDown
                  ? t(
                      "The AI line was busy just now, so Santa answered from his workshop letters instead.",
                      "剛才 AI 線路忙線中，所以聖誕老人改用工坊信件回覆。",
                    )
                  : t("Replies are written by an AI model through this home's own server key.", "回覆由 AI 模型撰寫，使用的是這個網站伺服器上的金鑰。")
                : t(
                    "Santa replies from a built-in collection of letters and stories. It is free, private and works without any AI service.",
                    "聖誕老人會從內建的信件與故事中回覆。完全免費、保有隱私，也不需要任何 AI 服務。",
                  )}
            </p>
            {ai === false && (
              <details className="mt-2 text-muted">
                <summary className="font-medium text-ink">{t("For grown-ups: switching on AI Santa", "給大人：如何啟用 AI 聖誕老人")}</summary>
                <p className="mt-2">
                  {t(
                    "Set SANTA_AI_API_KEY and SANTA_AI_MODEL (and optionally SANTA_AI_BASE_URL) on the server, using any OpenAI-compatible provider. The key stays on the server and is never sent to the browser.",
                    "在伺服器上設定 SANTA_AI_API_KEY 與 SANTA_AI_MODEL（也可設定 SANTA_AI_BASE_URL），可使用任何相容 OpenAI 的服務。金鑰只會留在伺服器，不會傳到瀏覽器。",
                  )}
                </p>
              </details>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <div role="tablist" aria-label={t("What would you like from Santa?", "想請聖誕老人做什麼？")} className="mb-6 flex flex-wrap gap-2">
              {(
                [
                  ["chat", MessageCircle, t("Chat", "聊天")],
                  ["greeting", PenLine, t("Greeting", "祝福")],
                  ["story", BookOpen, t("Story", "故事")],
                ] as const
              ).map(([id, Icon, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls="santa-panel"
                  onClick={() => setTab(id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors ${
                    tab === id ? "border-accent bg-accent text-on-accent" : "border-line text-muted hover:text-ink"
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
            <div role="tabpanel" id="santa-panel" aria-labelledby={`tab-${tab}`}>
              {tab === "chat" && <Chat ai={useAi} onAiDown={onAiDown} />}
              {tab === "greeting" && <Greeting ai={useAi} onAiDown={onAiDown} />}
              {tab === "story" && <Story ai={useAi} onAiDown={onAiDown} />}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
