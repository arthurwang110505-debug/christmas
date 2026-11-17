"use client";

import { motion } from "framer-motion";
import { Camera, Check, Cloud, CloudOff, Copy, Heart, RefreshCw, Star, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useReduce } from "@/lib/hooks";
import { useFamily, useLang, useT } from "@/lib/i18n";
import {
  addNote,
  addPhoto,
  createHome,
  deletePhoto,
  formatCode,
  joinHome,
  leaveHome,
  listPhotos,
  removeNote,
  syncNow,
  useSyncStatus,
  wallStore,
  type Note,
  type NoteKind,
  type NoteTone,
} from "@/lib/wall";
import { btn, Button, Field, inputClass, Modal, Page, PageHeader, Segmented } from "./ui";

const TONE_CLASS: Record<NoteTone, string> = {
  cream: "bg-cream text-forest paper",
  forest: "bg-forest text-cream",
  burgundy: "bg-burgundy text-cream",
  gold: "bg-gold text-night",
};
const TONE_NAME: Record<NoteTone, [string, string]> = {
  cream: ["Cream paper", "米白紙"],
  forest: ["Forest green", "森林綠"],
  burgundy: ["Burgundy", "酒紅"],
  gold: ["Champagne gold", "香檳金"],
};
const TONES: NoteTone[] = ["cream", "forest", "burgundy", "gold"];

function NoteCard({ note }: { note: Note }) {
  const t = useT();
  const lang = useLang();
  const reduce = useReduce();
  const [confirm, setConfirm] = useState(false);
  const date = new Intl.DateTimeFormat(lang === "zh" ? "zh-TW" : "en-GB", { day: "numeric", month: "short" }).format(
    new Date(note.createdAt),
  );
  return (
    <motion.article
      data-testid="note"
      initial={reduce ? false : { opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-4 break-inside-avoid rounded-2xl p-5 shadow-lg shadow-black/10 sm:odd:-rotate-[0.5deg] sm:even:rotate-[0.4deg] ${TONE_CLASS[note.tone]}`}
    >
      <p className="eyebrow flex items-center gap-1.5 opacity-80">
        {note.kind === "wish" ? <Star className="size-3.5" aria-hidden /> : <Heart className="size-3.5" aria-hidden />}
        {note.kind === "wish" ? t("Christmas wish", "聖誕願望") : t("Message", "留言")}
      </p>
      <p className="display mt-3 text-xl leading-snug font-light whitespace-pre-wrap italic [overflow-wrap:anywhere]">
        {note.body}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-sm">
          <span className="font-semibold">— {note.author}</span>
          <span className="opacity-70"> · {date}</span>
        </p>
        {confirm ? (
          <span className="flex items-center gap-1 text-sm">
            <button
              type="button"
              onClick={() => removeNote(note.id)}
              className="min-h-9 rounded-full bg-current/10 px-3 font-semibold underline underline-offset-2"
            >
              {t("Remove", "移除")}
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="min-h-9 rounded-full px-2">
              {t("Keep", "保留")}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label={t(`Remove note from ${note.author}`, `移除 ${note.author} 的留言`)}
            className="-m-2 flex size-11 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </motion.article>
  );
}

function SyncPanel() {
  const t = useT();
  const { homeCode } = wallStore.use();
  const status = useSyncStatus();
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async (fn: () => Promise<unknown>, messages: Record<string, string>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setJoining(false);
      setCode("");
    } catch (e) {
      const key = e instanceof Error ? e.message : "";
      setError(messages[key] ?? messages.default);
    } finally {
      setBusy(false);
    }
  };

  const unavailable = t(
    "Home Sync can't be reached right now. Your wall keeps working on this device.",
    "目前無法連線到家庭同步。留言牆仍可在這台裝置上正常使用。",
  );

  const label: Record<string, string> = {
    local: "",
    syncing: t("Syncing…", "同步中…"),
    synced: t("Up to date on all devices", "所有裝置皆已同步"),
    offline: t("Can't reach the server — saved on this device, will retry", "無法連線到伺服器，已儲存在這台裝置，稍後會重試"),
    gone: t("This home code no longer exists", "這個家庭代碼已不存在"),
  };

  return (
    <section aria-labelledby="sync-h" className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <h2 id="sync-h" className="flex items-center gap-2 font-semibold">
        {homeCode && status.state !== "offline" && status.state !== "gone" ? (
          <Cloud className="size-5 text-accent" aria-hidden />
        ) : (
          <CloudOff className="size-5 text-muted" aria-hidden />
        )}
        {t("Home Sync", "家庭同步")}
        <span className="ml-auto rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-muted">
          {t("Optional", "選用")}
        </span>
      </h2>

      {homeCode ? (
        <div className="mt-4">
          <p className="text-sm text-muted">
            {t("Enter this code on your other devices to share the same wall:", "在其他裝置輸入這組代碼，就能共用同一面留言牆：")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code data-testid="home-code" className="flex-1 rounded-xl border border-line bg-bg/60 px-3 py-2.5 text-center font-mono text-lg tracking-widest">
              {formatCode(homeCode)}
            </code>
            <button
              type="button"
              aria-label={t("Copy code", "複製代碼")}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(formatCode(homeCode));
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                } catch {
                  setError(t("Couldn't copy — please select the code and copy it by hand.", "無法複製，請手動選取代碼。"));
                }
              }}
              className="flex size-11 items-center justify-center rounded-full border border-line hover:border-accent"
            >
              {copied ? <Check className="size-4 text-accent" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </button>
          </div>
          <p role="status" data-testid="sync-status" data-state={status.state} className="mt-3 flex items-center gap-2 text-sm text-muted">
            {status.state === "syncing" && <RefreshCw className="size-3.5 animate-spin" aria-hidden />}
            {label[status.state]}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void syncNow()} disabled={status.state === "syncing"}>
              <RefreshCw className="size-4" aria-hidden />
              {t("Sync now", "立即同步")}
            </Button>
            <Button variant="quiet" onClick={leaveHome}>
              {t("Stop syncing", "停止同步")}
            </Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t(
              "Anyone with the code can read and add notes, so share it only with family. Photos are not synced.",
              "擁有代碼的人都能讀取和新增留言，請只分享給家人。照片不會同步。",
            )}
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-muted">
            {t(
              "Right now this wall lives only on this device. Create a home code to see the same notes on the TV, iPad and phones — no accounts needed.",
              "目前這面牆只存在這台裝置上。建立一組家庭代碼，就能在電視、iPad 和手機上看到相同的留言，不需要帳號。",
            )}
          </p>
          {joining ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => joinHome(code), {
                  not_found: t("We couldn't find a home with that code. Check it and try again.", "找不到這組代碼，請確認後再試一次。"),
                  default: unavailable,
                });
              }}
            >
              <Field label={t("Home code", "家庭代碼")}>
                <input
                  className={`${inputClass} font-mono tracking-widest uppercase`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={20}
                  required
                />
              </Field>
              <div className="flex gap-2">
                <button type="submit" className={btn.primary} disabled={busy}>
                  {busy ? t("Joining…", "加入中…") : t("Join", "加入")}
                </button>
                <Button variant="quiet" onClick={() => setJoining(false)}>
                  {t("Cancel", "取消")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={busy}
                onClick={() => void run(createHome, { default: unavailable })}
              >
                {busy ? t("Creating…", "建立中…") : t("Create a home code", "建立家庭代碼")}
              </Button>
              <Button variant="outline" onClick={() => setJoining(true)}>
                {t("I have a code", "我有代碼")}
              </Button>
            </div>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-accent">
          {error}
        </p>
      )}
    </section>
  );
}

interface Shot {
  id: string;
  url: string;
}

function Gallery() {
  const t = useT();
  const [shots, setShots] = useState<Shot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<Shot | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    let alive = true;
    listPhotos()
      .then((photos) => {
        if (!alive) return;
        const next = photos.map((p) => ({ id: p.id, url: URL.createObjectURL(p.blob) }));
        urls.current.push(...next.map((n) => n.url));
        setShots(next);
      })
      .catch(() => alive && setError(t("Photos can't be stored in this browser (private mode?).", "這個瀏覽器無法儲存照片（可能是無痕模式）。")))
      .finally(() => alive && setLoaded(true));
    const all = urls.current;
    return () => {
      alive = false;
      all.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    let failed = 0;
    for (const file of Array.from(files).slice(0, 12)) {
      try {
        const p = await addPhoto(file);
        const url = URL.createObjectURL(p.blob);
        urls.current.push(url);
        setShots((s) => [{ id: p.id, url }, ...s]);
      } catch {
        failed += 1;
      }
    }
    if (failed) {
      setError(
        t(
          `${failed} photo${failed > 1 ? "s" : ""} couldn't be added. Try a JPEG or PNG image.`,
          `有 ${failed} 張照片無法加入，請改用 JPEG 或 PNG 圖片。`,
        ),
      );
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const remove = async (shot: Shot) => {
    try {
      await deletePhoto(shot.id);
      setShots((s) => s.filter((x) => x.id !== shot.id));
      setView(null);
    } catch {
      setError(t("That photo couldn't be removed. Please try again.", "無法移除這張照片，請再試一次。"));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {t("Photos are resized and kept on this device only.", "照片會縮小後只保存在這台裝置上。")}
        </p>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          id="photo-input"
          data-testid="photo-input"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <label htmlFor="photo-input" className={`${btn.primary} cursor-pointer focus-within:outline-2`} aria-busy={busy}>
          <Camera className="size-4" aria-hidden />
          {busy ? t("Adding…", "加入中…") : t("Add photos", "加入照片")}
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-accent">
          {error}
        </p>
      )}
      {loaded && shots.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="display text-2xl font-light">{t("No photos yet", "還沒有照片")}</p>
          <p className="mt-2 text-sm text-muted">
            {t("Add this year's tree, the baking chaos, the family photo.", "加入今年的聖誕樹、烤餅乾的混亂現場、還有全家福。")}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shots.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setView(s)}
                aria-label={t(`Open photo ${i + 1}`, `開啟第 ${i + 1} 張照片`)}
                className="block aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={t(`Family photo ${i + 1}`, `家庭照片 ${i + 1}`)} className="size-full object-cover transition-transform duration-500 hover:scale-105" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={view !== null} onClose={() => setView(null)} title={t("Family photo", "家庭照片")} wide>
        {view && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view.url} alt={t("Family photo", "家庭照片")} className="max-h-[62svh] w-full rounded-2xl object-contain" />
            <Button variant="outline" className="mt-4" onClick={() => void remove(view)}>
              <Trash2 className="size-4" aria-hidden />
              {t("Remove photo", "移除照片")}
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}

export function FamilyWall() {
  const t = useT();
  const family = useFamily();
  const { notes, homeCode } = wallStore.use();
  const [tab, setTab] = useState<"notes" | "photos">("notes");
  const [filter, setFilter] = useState<"all" | NoteKind>("all");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<NoteKind>("message");
  const [tone, setTone] = useState<NoteTone>("cream");
  const [posted, setPosted] = useState(false);

  // Keep the shared wall fresh while this page is open.
  useEffect(() => {
    if (!homeCode) return;
    void syncNow();
    const tick = () => {
      if (document.visibilityState === "visible") void syncNow();
    };
    const id = window.setInterval(tick, 15_000);
    window.addEventListener("online", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [homeCode]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !body.trim()) return;
    addNote({ author, body, kind, tone });
    setBody("");
    setPosted(true);
    window.setTimeout(() => setPosted(false), 2500);
  };

  const shown = filter === "all" ? notes : notes.filter((n) => n.kind === filter);

  return (
    <Page>
      <PageHeader
        eyebrow={t("Family Wall", "家庭留言牆")}
        title={
          family.name ? (
            <>
              {t("The wall of ", "")}
              <em className="text-accent">{family.name}</em>
              {t("", " 的留言牆")}
            </>
          ) : (
            <>
              {t("Notes, wishes &", "留言、願望與")} <em className="text-accent">{t("memories", "回憶")}</em>
            </>
          )
        }
        intro={t(
          "Leave a message for someone at home, pin a Christmas wish, or add this year's photos. No sign-up — everything is saved right here.",
          "給家人留一句話、貼上一個聖誕願望，或加入今年的照片。不需要註冊，一切都保存在這裡。",
        )}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="note-h">
            <h2 id="note-h" className="display text-2xl font-light">
              {t("Pin a note", "貼一張紙條")}
            </h2>
            <Segmented
              label={t("Kind of note", "紙條類型")}
              value={kind}
              onChange={setKind}
              options={[
                { value: "message", label: t("Message", "留言") },
                { value: "wish", label: t("Christmas wish", "聖誕願望") },
              ]}
            />
            <Field label={t("Your name", "你的名字")}>
              <input
                className={inputClass}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={40}
                required
                autoComplete="given-name"
                placeholder={t("e.g. Grandma", "例如：阿嬤")}
              />
            </Field>
            <Field label={kind === "wish" ? t("Your wish", "你的願望") : t("Your message", "你的留言")} hint={`${body.length}/500`}>
              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                required
                placeholder={
                  kind === "wish"
                    ? t("This Christmas I wish for…", "這個聖誕節，我希望……")
                    : t("Something kind for the family to read…", "寫一句溫暖的話給家人……")
                }
              />
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("Paper colour", "紙張顏色")}</legend>
              <div className="flex gap-2.5">
                {TONES.map((tn) => (
                  <label key={tn} className="relative">
                    <input
                      type="radio"
                      name="tone"
                      value={tn}
                      checked={tone === tn}
                      onChange={() => setTone(tn)}
                      className="peer sr-only"
                    />
                    <span
                      className={`block size-11 cursor-pointer rounded-full border-2 border-line peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-accent peer-checked:ring-offset-2 peer-checked:ring-offset-surface peer-focus-visible:outline-2 ${TONE_CLASS[tn]}`}
                    />
                    <span className="sr-only">{t(TONE_NAME[tn][0], TONE_NAME[tn][1])}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center gap-3">
              <button type="submit" className={btn.primary}>
                {t("Pin to the wall", "貼到牆上")}
              </button>
              <span role="status" className="text-sm text-accent">
                {posted ? t("Pinned!", "已貼上！") : ""}
              </span>
            </div>
          </form>
          <SyncPanel />
        </div>

        <div className="lg:col-span-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label={t("Wall section", "留言牆分頁")}
              value={tab}
              onChange={setTab}
              options={[
                { value: "notes", label: `${t("Notes", "紙條")} (${notes.length})` },
                { value: "photos", label: t("Photos", "照片") },
              ]}
            />
            {tab === "notes" && notes.length > 0 && (
              <Segmented
                label={t("Filter notes", "篩選紙條")}
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: t("All", "全部") },
                  { value: "message", label: t("Messages", "留言") },
                  { value: "wish", label: t("Wishes", "願望") },
                ]}
              />
            )}
          </div>

          {tab === "notes" ? (
            shown.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line p-10 text-center">
                <p className="display text-2xl font-light">
                  {notes.length === 0 ? t("The wall is waiting for its first note", "留言牆正等著第一張紙條") : t("Nothing in this section yet", "這個分類還沒有內容")}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {t("Write something kind and pin it — it will be here every time you come back.", "寫一句溫暖的話貼上去，每次回來它都會在這裡。")}
                </p>
              </div>
            ) : (
              <div className="columns-1 gap-4 sm:columns-2 xl:columns-3" data-testid="notes">
                {shown.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            )
          ) : (
            <Gallery />
          )}
        </div>
      </div>
    </Page>
  );
}
