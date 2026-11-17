"use client";

import { Download, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFamily, useLang, useT, type Bi } from "@/lib/i18n";
import { useHydrated } from "@/lib/store";
import { CHRISTMAS_YEAR } from "@/lib/time";
import { Button, Field, inputClass, Page, PageHeader, Segmented } from "./ui";

type FormatId = "phone" | "tablet" | "desktop" | "card";

const FORMATS: Record<FormatId, { w: number; h: number; label: Bi; note: Bi }> = {
  phone: { w: 1179, h: 2556, label: ["iPhone", "iPhone"], note: ["Lock-screen wallpaper · 1179 × 2556", "鎖定畫面桌布・1179 × 2556"] },
  tablet: { w: 2048, h: 2732, label: ["iPad", "iPad"], note: ["Portrait wallpaper · 2048 × 2732", "直式桌布・2048 × 2732"] },
  desktop: { w: 2560, h: 1440, label: ["Desktop / TV", "電腦／電視"], note: ["16:9 wallpaper · 2560 × 1440", "16:9 桌布・2560 × 1440"] },
  card: { w: 1800, h: 1200, label: ["Greeting card", "賀卡"], note: ["Landscape card to send · 1800 × 1200", "橫式賀卡・1800 × 1200"] },
};

const BACKDROPS: { id: string; src: string; name: Bi }[] = [
  { id: "village", src: "/scenes/village.jpg", name: ["Village", "小鎮"] },
  { id: "cabin", src: "/scenes/cabin.jpg", name: ["Cabin", "木屋"] },
  { id: "forest", src: "/scenes/forest.jpg", name: ["Forest", "森林"] },
  { id: "fireplace", src: "/scenes/fireplace.jpg", name: ["Fireplace", "壁爐"] },
  { id: "window", src: "/scenes/window.jpg", name: ["Window", "窗邊"] },
  { id: "morning", src: "/scenes/morning.jpg", name: ["Morning", "早晨"] },
];

const SERIF = '"Fraunces Variable", "Iowan Old Style", Palatino, "Noto Serif TC", "Songti TC", "PMingLiU", Georgia, serif';
const CJK = "\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF";
const TOKEN = new RegExp(`[${CJK}]|[^\\s${CJK}]+|\\s+`, "g");

/** Word-wrap that also breaks between CJK characters. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const tok of para.match(TOKEN) ?? []) {
      const next = line + tok;
      if (line.trim() && ctx.measureText(next.trimEnd()).width > maxW) {
        lines.push(line.trimEnd());
        line = tok.trimStart();
      } else line = next;
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

const cache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        cache.delete(src);
        reject(new Error("image_failed"));
      };
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

let shareSupport: boolean | null = null;
/** Can this device share an image file (e.g. "Save to Photos" on iPhone)? Checked once. */
function canShareFiles(): boolean {
  if (shareSupport === null) {
    try {
      const probe = new File([new Blob(["x"], { type: "image/jpeg" })], "probe.jpg", { type: "image/jpeg" });
      shareSupport = typeof navigator.share === "function" && Boolean(navigator.canShare?.({ files: [probe] }));
    } catch {
      shareSupport = false;
    }
  }
  return shareSupport;
}
const noSubscribe = () => () => {};

interface Design {
  format: FormatId;
  message: string;
  name: string;
  eyebrow: string;
}

function draw(canvas: HTMLCanvasElement, img: HTMLImageElement, d: Design) {
  const { w, h } = FORMATS[d.format];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.fillStyle = "rgba(16, 26, 23, 0.5)";
  ctx.fillRect(0, 0, w, h);

  const u = Math.min(w, h) / 100;
  const maxW = w * 0.8;
  const cx = w / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Fit the message: start large and step down until it sits within its share of the canvas.
  const message = d.message.trim() || " ";
  const long = message.length > 40;
  let size = u * (long ? 5.2 : d.format === "card" ? 10 : 11.5);
  let lines: string[] = [];
  const room = h * (d.format === "phone" || d.format === "tablet" ? 0.4 : 0.52);
  for (let i = 0; i < 24; i++) {
    ctx.font = `300 ${size}px ${SERIF}`;
    lines = wrap(ctx, message, maxW);
    if (lines.length * size * 1.22 <= room || size <= u * 2.4) break;
    size *= 0.92;
  }
  const lh = size * (long ? 1.42 : 1.12);

  const eyebrowSize = u * 2.5;
  const nameSize = u * 4.4;
  const gap = u * 4.5;
  const total = eyebrowSize + gap + lines.length * lh + (d.name ? gap * 1.6 + nameSize : 0);
  // Phones and tablets: keep clear of the lock-screen clock at the top.
  const centre = d.format === "phone" ? h * 0.63 : d.format === "tablet" ? h * 0.58 : h * 0.5;
  let y = centre - total / 2;

  ctx.fillStyle = "#c6a76b";
  ctx.font = `600 ${eyebrowSize}px ui-sans-serif, system-ui, -apple-system, "PingFang TC", "Noto Sans TC", sans-serif`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${eyebrowSize * 0.24}px`;
  y += eyebrowSize;
  ctx.fillText(d.eyebrow.toUpperCase(), cx, y);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";

  y += gap;
  ctx.fillStyle = "#f5ebdd";
  ctx.font = `300 ${size}px ${SERIF}`;
  for (const line of lines) {
    y += lh;
    ctx.fillText(line, cx, y - lh * 0.22);
  }

  if (d.name) {
    y += gap * 0.8;
    ctx.fillStyle = "#c6a76b";
    ctx.fillRect(cx - u * 7, y, u * 14, Math.max(2, u * 0.16));
    y += gap * 0.8 + nameSize * 0.8;
    ctx.font = `italic 400 ${nameSize}px ${SERIF}`;
    const nameLines = wrap(ctx, d.name, maxW);
    ctx.fillText(nameLines[0] ?? "", cx, y);
  }
}

export function WallpaperStudio() {
  const t = useT();
  const lang = useLang();
  const family = useFamily();
  const hydrated = useHydrated();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<FormatId>("phone");
  const [backdrop, setBackdrop] = useState(BACKDROPS[0]);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [drawn, setDrawn] = useState<{ key: string; ok: boolean } | null>(null);
  const [note, setNote] = useState("");
  const canShare = useSyncExternalStore(noSubscribe, canShareFiles, () => false);

  // A greeting sent over from Santa's desk arrives as a card draft.
  useEffect(() => {
    try {
      const draft = window.localStorage.getItem("cw26:cardDraft");
      if (draft) {
        window.localStorage.removeItem("cw26:cardDraft");
        // One-off hand-over from another page, read from browser storage after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessage(draft.slice(0, 400));
        setFormat("card");
      }
    } catch {
      /* no draft */
    }
  }, []);

  const effectiveMessage = message ?? t("Merry Christmas", "聖誕快樂");
  const effectiveName = name ?? family.name;
  const eyebrow = t(`Christmas ${CHRISTMAS_YEAR}`, `${CHRISTMAS_YEAR} 聖誕節`);
  // The preview is "ready" only when the canvas shows exactly the current design.
  const designKey = [backdrop.id, format, effectiveMessage, effectiveName, eyebrow].join("\u0000");
  const status: "drawing" | "ready" | "error" = drawn?.key === designKey ? (drawn.ok ? "ready" : "error") : "drawing";

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    const fonts = document.fonts
      ? Promise.all([
          document.fonts.load('300 48px "Fraunces Variable"', effectiveMessage),
          document.fonts.load('italic 400 48px "Fraunces Variable"', effectiveName || "A"),
        ]).catch(() => [])
      : Promise.resolve([]);
    Promise.all([loadImage(backdrop.src), fonts])
      .then(([img]) => {
        if (!alive || !canvasRef.current) return;
        draw(canvasRef.current, img, { format, message: effectiveMessage, name: effectiveName, eyebrow });
        setDrawn({ key: designKey, ok: true });
      })
      .catch(() => alive && setDrawn({ key: designKey, ok: false }));
    return () => {
      alive = false;
    };
  }, [hydrated, backdrop, format, effectiveMessage, effectiveName, eyebrow, designKey]);

  const toBlob = () =>
    new Promise<Blob>((resolve, reject) => {
      const c = canvasRef.current;
      if (!c) return reject(new Error("no_canvas"));
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode_failed"))), "image/jpeg", 0.92);
    });
  const fileName = `christmas-wonderland-${format}.jpg`;

  const download = async () => {
    try {
      const blob = await toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setNote(t("Saved. On iPhone, open it in Files or Photos and choose “Use as Wallpaper”.", "已儲存。在 iPhone 上，請到「檔案」或「照片」開啟，再選擇「作為背景圖片」。"));
    } catch {
      setNote(t("The image couldn't be created. Please try again.", "無法產生圖片，請再試一次。"));
    }
  };

  const share = async () => {
    try {
      const blob = await toBlob();
      await navigator.share({ files: [new File([blob], fileName, { type: "image/jpeg" })] });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setNote(t("Sharing didn't work here — use Download instead.", "這裡無法分享，請改用下載。"));
    }
  };

  const f = FORMATS[format];

  return (
    <Page>
      <PageHeader
        eyebrow={t("Wallpapers & cards", "桌布與賀卡")}
        title={
          <>
            {t("Your name on", "把名字寫進")} <em className="text-accent">{t("Christmas", "聖誕節")}</em>
          </>
        }
        intro={t(
          "Make a personal wallpaper for an iPhone, iPad or TV, or a card to send to someone far away. Everything is drawn on your device.",
          "為 iPhone、iPad 或電視製作專屬桌布，或做一張賀卡寄給遠方的人。所有圖片都在你的裝置上繪製。",
        )}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div>
            <p className="mb-2 text-sm font-medium">{t("Format", "格式")}</p>
            <Segmented
              label={t("Format", "格式")}
              value={format}
              onChange={setFormat}
              options={(Object.keys(FORMATS) as FormatId[]).map((id) => ({ value: id, label: t(FORMATS[id].label) }))}
            />
            <p className="mt-2 text-sm text-muted">{t(f.note)}</p>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("Scene", "場景")}</legend>
            <div className="grid grid-cols-3 gap-2.5">
              {BACKDROPS.map((b) => (
                <label key={b.id} className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name="backdrop"
                    className="peer sr-only"
                    checked={backdrop.id === b.id}
                    onChange={() => setBackdrop(b)}
                  />
                  <span className="relative block aspect-video overflow-hidden rounded-xl border-2 border-transparent peer-checked:border-accent peer-focus-visible:outline-2">
                    <Image src={b.src} alt="" fill sizes="160px" className="object-cover" />
                  </span>
                  <span className="mt-1 block text-center text-xs text-muted peer-checked:text-ink">{t(b.name)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={t("Message", "訊息")} hint={`${effectiveMessage.length}/400`}>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={effectiveMessage}
              maxLength={400}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>
          <Field label={t("Name or signature", "名字或署名")} hint={t("Leave empty to hide it.", "留空則不顯示。")}>
            <input
              className={inputClass}
              value={effectiveName}
              maxLength={40}
              placeholder={t("e.g. The Lin Family", "例如：林家")}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => void download()} disabled={status !== "ready"} data-testid="download">
              <Download className="size-4" aria-hidden />
              {t("Download image", "下載圖片")}
            </Button>
            {canShare && (
              <Button variant="outline" onClick={() => void share()} disabled={status !== "ready"}>
                <Share2 className="size-4" aria-hidden />
                {t("Share or save to Photos", "分享或存到照片")}
              </Button>
            )}
          </div>
          <p role="status" className="min-h-5 text-sm text-muted">
            {status === "error" ? t("The scene image couldn't be loaded. Check your connection and pick a scene again.", "場景圖片無法載入，請檢查連線後重新選擇場景。") : note}
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="flex min-h-[20rem] items-center justify-center rounded-3xl border border-line bg-surface p-4 sm:p-6">
            <canvas
              ref={canvasRef}
              data-testid="preview"
              data-status={status}
              role="img"
              aria-label={t(
                `Preview: “${effectiveMessage}” over the ${backdrop.name[0]} scene`,
                `預覽：「${effectiveMessage}」，背景為${backdrop.name[1]}`,
              )}
              className="h-auto max-h-[72svh] w-auto max-w-full rounded-xl shadow-2xl shadow-black/30"
              style={{ aspectRatio: `${f.w} / ${f.h}` }}
              width={f.w}
              height={f.h}
              lang={lang === "zh" ? "zh-Hant" : "en"}
            />
          </div>
        </div>
      </div>
    </Page>
  );
}
