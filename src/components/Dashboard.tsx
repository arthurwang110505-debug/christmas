"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Clock3, Pause, Play, Tv } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { audio, useAudio } from "@/lib/audio/engine";
import { TRACKS } from "@/lib/audio/songs";
import { QUOTES } from "@/lib/content/quotes";
import { useMinutes, useMode, useReduce } from "@/lib/hooks";
import { formatDate, useFamily, useLang, useT } from "@/lib/i18n";
import { MODE_ORDER, MODES, type ModeId } from "@/lib/scenes";
import { CHRISTMAS_YEAR, dailyGreeting, dayOfYear, salutation, todaysDoor } from "@/lib/time";
import { wallStore } from "@/lib/wall";
import { SoundToggle } from "./AppShell";
import { Countdown } from "./Countdown";
import { SceneBackdrop } from "./SceneBackdrop";
import { btn, Reveal } from "./ui";

function AnimatedWord({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduce = useReduce();
  return (
    <span aria-hidden className="inline-block whitespace-nowrap">
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={`${text}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: "0.35em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.9, delay: reduce ? 0 : delay + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

function ModeSelector({ onPick }: { onPick: (m: ModeId) => void }) {
  const t = useT();
  const { mode, choice, setMode } = useMode();
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id="atmosphere" className="eyebrow">
          {t("Atmosphere", "氛圍")}
        </h2>
        <button
          type="button"
          aria-pressed={choice === "auto"}
          onClick={() => setMode(choice === "auto" ? mode : "auto")}
          className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition-colors ${
            choice === "auto" ? "border-accent bg-accent text-on-accent" : "border-line bg-surface/70 hover:border-accent"
          }`}
        >
          <Clock3 className="size-3.5" aria-hidden />
          {choice === "auto" ? t("Following the clock", "跟隨時間自動切換") : t("Follow the clock", "跟隨時間")}
        </button>
      </div>
      <div role="radiogroup" aria-labelledby="atmosphere" className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {MODE_ORDER.map((id) => {
          const m = MODES[id];
          const active = id === mode;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setMode(id);
                onPick(id);
              }}
              className={`group flex items-center gap-3 rounded-2xl border p-2 text-left backdrop-blur-md transition-colors sm:p-2.5 ${
                active ? "border-accent bg-surface" : "border-line bg-surface/65 hover:border-accent"
              }`}
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl sm:size-14">
                <Image src={m.image} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-tight font-semibold sm:truncate sm:text-[0.95rem]">{t(m.name)}</span>
                <span className="mt-0.5 hidden truncate text-xs text-muted sm:block">{t(m.tagline)}</span>
              </span>
              <span
                aria-hidden
                className={`mr-1 hidden size-5 shrink-0 items-center justify-center rounded-full border sm:flex ${
                  active ? "border-accent bg-accent text-on-accent" : "border-line"
                }`}
              >
                {active && <Check className="size-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Dashboard() {
  const t = useT();
  const lang = useLang();
  const family = useFamily();
  const { mode } = useMode();
  const now = useMinutes();
  const reduce = useReduce();
  const a = useAudio();
  const { notes } = wallStore.use();
  const m = MODES[mode];
  const isEve = mode === "eve";
  const [eveIntro, setEveIntro] = useState(false);

  useEffect(() => {
    if (!eveIntro) return;
    const id = window.setTimeout(() => setEveIntro(false), 3200);
    return () => window.clearTimeout(id);
  }, [eveIntro]);

  const quote = QUOTES[(now ? dayOfYear(now) : 0) % QUOTES.length];
  const door = now ? todaysDoor(now) : null;
  const adventStart = new Date(CHRISTMAS_YEAR, 11, 1);
  const daysToAdvent = now
    ? Math.ceil((adventStart.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000)
    : null;
  const track = TRACKS[a.trackIndex];
  const latest = notes[0];

  const greetingLine = now
    ? isEve
      ? t(
          `Merry Christmas Eve, ${family.label}. The stockings are hung — listen for sleigh bells.`,
          `${family.label}，平安夜快樂。聖誕襪已經掛好，仔細聽，有沒有雪橇的鈴聲。`,
        )
      : `${t(salutation(now))}${lang === "zh" ? "，" : ", "}${family.label}${lang === "zh" ? "。" : ". "}${t(dailyGreeting(now))}`
    : "\u00a0";

  return (
    <>
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden" aria-labelledby="hero-title">
        <SceneBackdrop image={m.image} particles={m.particles} density={m.density} firelight={m.firelight} priority />
        <div
          aria-hidden
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background:
              "linear-gradient(to top, rgb(var(--scrim)) 0%, rgb(var(--scrim) / var(--scrim-low)) 26%, rgb(var(--scrim) / var(--scrim-mid)) 62%, rgb(var(--scrim) / 0.55) 100%)",
          }}
        />
        {/* Christmas Eve: cinematic letterbox */}
        <AnimatePresence>
          {isEve && (
            <motion.div
              key="bar"
              aria-hidden
              className="absolute inset-x-0 top-16 bg-black"
              initial={{ height: 0 }}
              animate={{ height: "5svh" }}
              exit={{ height: 0 }}
              transition={{ duration: reduce ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>

        <div className="relative mx-auto w-full max-w-[1400px] px-5 pt-28 pb-8 sm:px-8 lg:px-12 lg:pb-10">
          <div className="grid items-end gap-x-10 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="eyebrow text-accent" data-testid="today">
                {now ? formatDate(now, lang) : "\u00a0"}
              </p>
              <h1
                id="hero-title"
                aria-label={isEve ? t("Christmas Eve", "平安夜") : t("Christmas Wonderland 2026", "聖誕仙境 2026")}
                className={`display mt-4 font-light ${lang === "zh" ? "text-[clamp(4.5rem,11vw,10rem)] leading-[1.05]" : "text-[clamp(3.25rem,9.2vw,8.75rem)] leading-[0.92]"}`}
              >
                <AnimatedWord key={`a-${lang}-${isEve}`} text={t("Christmas", isEve ? "平安" : "聖誕")} />
                <br aria-hidden />
                <span className="text-accent italic">
                  <AnimatedWord
                    key={`b-${lang}-${isEve}`}
                    text={isEve ? t("Eve", "夜") : t("Wonderland", "仙境")}
                    delay={0.35}
                  />
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg" data-testid="greeting">
                {greetingLine}
              </p>
            </div>

            <div className="lg:col-span-5 lg:justify-self-end">
              <p className="eyebrow mb-3 text-muted">{t("Until Christmas morning", "距離聖誕早晨")}</p>
              <Countdown />
              <div className="mt-6 flex flex-wrap gap-3">
                <SoundToggle />
                <Link href="/ambient" className={btn.outline}>
                  {t("Open Ambient Player", "打開氛圍播放器")}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-9 lg:mt-12">
            <ModeSelector onPick={(id) => id === "eve" && !reduce && setEveIntro(true)} />
          </div>
        </div>
      </section>

      {/* Christmas Eve opening title card */}
      <AnimatePresence>
        {eveIntro && (
          <motion.div
            role="presentation"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black px-8 text-center text-cream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            onClick={() => setEveIntro(false)}
          >
            <motion.p
              className="display max-w-3xl text-[clamp(1.75rem,5vw,4rem)] leading-tight font-light italic"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, delay: 0.5 }}
            >
              {t("’Twas the night before Christmas…", "那是聖誕節的前一夜……")}
              <span className="eyebrow mt-6 block text-gold not-italic">{family.label}</span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------ Quote ------------------------------ */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12" aria-labelledby="quote-h">
        <Reveal className="mx-auto max-w-4xl text-center">
          <h2 id="quote-h" className="eyebrow text-accent">
            {t("Today's Christmas quote", "今日聖誕語錄")}
          </h2>
          <blockquote className="display mt-6 text-[clamp(1.6rem,3.6vw,3rem)] leading-[1.2] font-light italic">
            “{t(quote.text)}”
          </blockquote>
          <p className="mt-6 text-sm text-muted">— {t(quote.source)}</p>
        </Reveal>
      </section>

      {/* ------------------------------ Around the house ------------------------------ */}
      <section className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8 lg:px-12" aria-labelledby="house-h">
        <Reveal>
          <h2 id="house-h" className="display text-[clamp(2rem,4.4vw,3.5rem)] leading-none font-light">
            {t("Around the house", "家裡的每個角落")}
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            {t(
              "One website for every screen at home — the TV over the fireplace, the iPad on the shelf, the phone in your pocket.",
              "一個網站，陪伴家裡的每一個螢幕：客廳的電視、書架上的 iPad、口袋裡的手機。",
            )}
          </p>
        </Reveal>

        <div className="mt-9 grid gap-4 md:grid-cols-6 lg:grid-cols-12 lg:gap-5">
          {/* Ambient */}
          <Reveal className="md:col-span-6 lg:col-span-7">
            <div className="relative flex min-h-[21rem] flex-col justify-end overflow-hidden rounded-3xl border border-line">
              <Image
                src="/scenes/window.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-night/55" />
              <div className="relative p-6 text-cream sm:p-8">
                <p className="eyebrow text-gold">{t("Ambient Player", "氛圍播放器")}</p>
                <h3 className="display mt-2 text-3xl leading-tight font-light sm:text-4xl">
                  {t("Five living scenes, with sound", "五個有聲的動態場景")}
                </h3>
                <p className="mt-2 max-w-md text-sm text-cream/80 sm:text-base">
                  {t(
                    "Fireplace, village, forest, cabin and a snowy window. Full screen, with a clock or countdown.",
                    "壁爐、小鎮、森林、木屋與飄雪的窗。可全螢幕，還能顯示時鐘或倒數。",
                  )}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/ambient" className={`${btn.primary} !bg-gold !text-night`}>
                    {t("Open the player", "打開播放器")}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href="/tv"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cream/40 px-5 text-sm font-medium text-cream hover:border-gold"
                  >
                    <Tv className="size-4" aria-hidden />
                    {t("TV mode", "電視模式")}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Advent */}
          <Reveal className="md:col-span-3 lg:col-span-5" delay={0.05}>
            <Link
              href="/advent"
              className="group flex h-full min-h-[21rem] flex-col justify-between rounded-3xl border border-line bg-surface-2 p-6 transition-colors hover:border-accent sm:p-8"
            >
              <p className="eyebrow text-accent">{t("Advent Calendar", "降臨節月曆")}</p>
              <div>
                <p className="numerals text-[clamp(5rem,11vw,9rem)] leading-none font-light" data-testid="advent-teaser">
                  {door ?? (daysToAdvent !== null && daysToAdvent > 0 ? daysToAdvent : 25)}
                </p>
                <p className="mt-2 text-lg">
                  {door
                    ? t(`Door ${door} is ready to open`, `第 ${door} 扇門可以打開了`)
                    : daysToAdvent !== null && daysToAdvent > 0
                      ? t("days until the first door opens", "天後打開第一扇門")
                      : t("doors, all open to revisit", "扇門，全部都能回味")}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
                {t("See the calendar", "查看月曆")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </Reveal>

          {/* Wall */}
          <Reveal className="md:col-span-3 lg:col-span-4">
            <Link
              href="/wall"
              className="group flex h-full min-h-64 flex-col justify-between rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-accent sm:p-7"
            >
              <p className="eyebrow text-accent">{t("Family Wall", "家庭留言牆")}</p>
              {latest ? (
                <figure className="my-5">
                  <blockquote className="display line-clamp-4 text-xl leading-snug font-light italic sm:text-2xl">
                    “{latest.body}”
                  </blockquote>
                  <figcaption className="mt-3 text-sm text-muted">— {latest.author}</figcaption>
                </figure>
              ) : (
                <p className="display my-5 text-2xl leading-snug font-light">
                  {t("The wall is waiting for its first note.", "留言牆正等著第一張紙條。")}
                </p>
              )}
              <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
                {latest ? t("Read the wall", "看看留言牆") : t("Leave a note", "留下一張紙條")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </Reveal>

          {/* Santa */}
          <Reveal className="md:col-span-3 lg:col-span-4" delay={0.05}>
            <Link
              href="/santa"
              className="group relative flex h-full min-h-64 flex-col justify-end overflow-hidden rounded-3xl border border-line"
            >
              <Image src="/scenes/santa-desk.jpg" alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
              <div aria-hidden className="absolute inset-0 bg-night/60" />
              <div className="relative p-6 text-cream sm:p-7">
                <p className="eyebrow text-gold">{t("Santa's desk", "聖誕老人的書桌")}</p>
                <p className="display mt-2 text-2xl leading-snug font-light">
                  {t("Chat with Santa, ask for a story or a greeting.", "和聖誕老人聊天，請他說故事或寫祝福。")}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold">
                  {t("Write to Santa", "寫信給聖誕老人")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          </Reveal>

          {/* Music */}
          <Reveal className="md:col-span-3 lg:col-span-4" delay={0.1}>
            <div className="flex h-full min-h-64 flex-col justify-between rounded-3xl border border-line bg-surface p-6 sm:p-7">
              <p className="eyebrow text-accent">{a.musicOn ? t("Now playing", "正在播放") : t("Christmas Music", "聖誕音樂")}</p>
              <div className="my-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => audio.toggleMusic()}
                  aria-label={a.musicOn ? t("Pause music", "暫停音樂") : t("Play music", "播放音樂")}
                  className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition hover:brightness-110"
                >
                  {a.musicOn ? <Pause className="size-6" aria-hidden /> : <Play className="size-6 translate-x-0.5" aria-hidden />}
                </button>
                <div className="min-w-0">
                  <p className="display truncate text-2xl leading-tight font-light">{t(track.title)}</p>
                  <p className="mt-1 truncate text-sm text-muted">{t(track.mood)}</p>
                </div>
              </div>
              <Link href="/music" className="group inline-flex items-center gap-2 text-sm font-medium text-accent">
                {t("Open the playlist", "打開播放清單")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </Reveal>

          {/* Cards */}
          <Reveal className="md:col-span-3 lg:col-span-12">
            <Link
              href="/wallpapers"
              className="group flex h-full flex-col justify-between gap-6 rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-accent sm:p-8 lg:flex-row lg:items-center"
            >
              <div>
                <p className="eyebrow text-accent">{t("Wallpapers & cards", "桌布與賀卡")}</p>
                <p className="display mt-2 max-w-2xl text-2xl leading-snug font-light sm:text-3xl">
                  {t(
                    "Put your family's name on a Christmas wallpaper for your iPhone, or make a card to send.",
                    "把家人的名字放上 iPhone 聖誕桌布，或製作一張賀卡送給朋友。",
                  )}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-accent">
                {t("Open the studio", "打開工作室")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1400px] px-5 py-10 text-sm leading-relaxed text-muted sm:px-8 lg:px-12">
          <p className="display text-lg text-ink">
            {t("Christmas Wonderland", "聖誕仙境")} <span className="text-accent italic">2026</span>
          </p>
          <p className="mt-3 max-w-3xl">
            {t(
              "All music and ambience are synthesised live in your browser; the carols are traditional, public-domain melodies. Scene imagery was generated for this project. No account, no ads, no cost.",
              "所有音樂與環境音皆由瀏覽器即時合成；頌歌為公有領域的傳統旋律。場景圖片為本專案專屬生成。無需帳號、沒有廣告、完全免費。",
            )}
          </p>
        </div>
      </footer>
    </>
  );
}
