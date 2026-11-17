"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Heart, Lightbulb, Lock, Scissors, Sparkles, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DOORS, KIND_LABEL, type Door, type DoorKind } from "@/lib/content/advent";
import { useMinutes, useReduce } from "@/lib/hooks";
import { useFamily, useT } from "@/lib/i18n";
import { settings } from "@/lib/store";
import { CHRISTMAS_YEAR, doorStatus } from "@/lib/time";
import { btn, Modal, Page, PageHeader, Switch } from "./ui";

const KIND_ICON: Record<DoorKind, LucideIcon> = {
  greeting: Sparkles,
  message: Heart,
  fact: Lightbulb,
  activity: Scissors,
  challenge: Users,
};

// A patchwork of the brand palette, fixed per door so the calendar looks the same every day.
const TONES = [
  "bg-forest text-cream border-forest",
  "bg-burgundy text-cream border-burgundy",
  "bg-night text-gold border-gold/40",
  "bg-cream text-forest border-forest/20 paper",
  "bg-gold text-night border-gold",
];
const toneFor = (day: number) => TONES[(day * 3 + Math.floor(day / 5)) % TONES.length];

export function AdventCalendar() {
  const t = useT();
  const family = useFamily();
  const s = settings.use();
  const now = useMinutes();
  const reduce = useReduce();
  const [active, setActive] = useState<Door | null>(null);
  const [notice, setNotice] = useState("");
  const [shake, setShake] = useState<{ day: number; n: number } | null>(null);

  const fill = (text: string) => text.replaceAll("{family}", family.label);
  const isOpenable = (day: number) => s.adventPreview || (now ? doorStatus(day, now).unlocked : false);

  const tryOpen = (door: Door) => {
    if (!isOpenable(door.day)) {
      setNotice(
        t(
          `Door ${door.day} opens on ${door.day} December ${CHRISTMAS_YEAR}. No peeking!`,
          `第 ${door.day} 扇門要到 ${CHRISTMAS_YEAR} 年 12 月 ${door.day} 日才會打開，不可以偷看喔！`,
        ),
      );
      setShake((p) => ({ day: door.day, n: (p?.n ?? 0) + 1 }));
      return;
    }
    setNotice("");
    settings.set((st) => ({ opened: st.opened.includes(door.day) ? st.opened : [...st.opened, door.day] }));
    setActive(door);
  };

  const toggleDone = (day: number) =>
    settings.set((st) => ({ done: st.done.includes(day) ? st.done.filter((d) => d !== day) : [...st.done, day] }));

  const beforeAdvent = now ? now.getTime() < new Date(CHRISTMAS_YEAR, 11, 1).getTime() : false;
  const ActiveIcon = active ? KIND_ICON[active.kind] : Sparkles;

  return (
    <Page>
      <PageHeader
        eyebrow={t(`December ${CHRISTMAS_YEAR}`, `${CHRISTMAS_YEAR} 年 12 月`)}
        title={
          <>
            {t("Advent", "降臨節")} <em className="text-accent">{t("Calendar", "月曆")}</em>
          </>
        }
        intro={t(
          "Twenty-five doors, one for each day until Christmas. Each opens at midnight on its own day with a message, a fact, a small activity or a challenge for the whole family.",
          "二十五扇門，陪你們一天一天走到聖誕節。每扇門會在當天午夜開啟，裡面有一句話、一則小知識、一個小活動，或是全家人的挑戰。",
        )}
      />

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
        <p data-testid="advent-progress">
          <span className="numerals text-2xl text-ink">{s.opened.length}</span> {t("of 25 doors opened", "／25 扇門已開啟")}
        </p>
        {beforeAdvent && !s.adventPreview && (
          <p>{t("The first door opens on 1 December.", "第一扇門將在 12 月 1 日開啟。")}</p>
        )}
        {s.adventPreview && (
          <p className="rounded-full border border-accent px-3 py-1 text-accent">
            {t("Grown-up preview is on: every door can be opened", "大人預覽模式已開啟：所有門都能打開")}
          </p>
        )}
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-sm font-medium text-accent">
        {notice}
      </p>

      <ol className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-4" aria-label={t("Advent doors", "降臨曆的門")}>
        {DOORS.map((door, i) => {
          const openable = isOpenable(door.day);
          const opened = s.opened.includes(door.day) && openable;
          const today = now ? doorStatus(door.day, now).isToday : false;
          const Icon = KIND_ICON[door.kind];
          const last = door.day === 25;
          return (
            <motion.li
              key={door.day}
              className={last ? "col-span-3 sm:col-span-1" : ""}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.025, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.button
                type="button"
                data-day={door.day}
                data-state={opened ? "opened" : openable ? "ready" : "locked"}
                aria-label={
                  openable
                    ? t(
                        `Door ${door.day}${opened ? `: ${door.title[0]}` : ", ready to open"}`,
                        `第 ${door.day} 扇門${opened ? `：${door.title[1]}` : "，可以打開"}`,
                      )
                    : t(`Door ${door.day}, locked until ${door.day} December`, `第 ${door.day} 扇門，12 月 ${door.day} 日開啟`)
                }
                onClick={() => tryOpen(door)}
                animate={shake?.day === door.day && !reduce ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
                key={shake?.day === door.day ? `s${shake.n}` : "d"}
                transition={{ duration: 0.4 }}
                whileHover={openable && !reduce ? { y: -4 } : undefined}
                className={`relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border p-3 text-left sm:p-4 ${
                  last ? "aspect-[3/1] sm:aspect-square" : "aspect-square"
                } ${toneFor(door.day)} ${openable && !opened ? "shadow-lg shadow-black/20" : ""} ${
                  today ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className={`numerals text-[clamp(2rem,6.5vw,4.25rem)] leading-none font-light ${openable ? "" : "opacity-60"}`}>{door.day}</span>
                  {!openable ? (
                    <Lock className="size-4 opacity-70" aria-hidden />
                  ) : opened ? (
                    <Check className="size-4" strokeWidth={3} aria-hidden />
                  ) : (
                    <span aria-hidden className="twinkle text-lg leading-none">
                      ✦
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wider uppercase sm:text-xs">
                  {today ? (
                    t("Today", "今天")
                  ) : opened ? (
                    <>
                      <Icon className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate normal-case tracking-normal">{t(door.title)}</span>
                    </>
                  ) : openable ? (
                    t("Open me", "打開我")
                  ) : (
                    t(`${door.day} Dec`, `12/${door.day}`)
                  )}
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </ol>

      <div className="mt-12 flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 sm:items-center">
        <Switch
          checked={s.adventPreview}
          onChange={(v) => settings.set({ adventPreview: v })}
          label={t("Grown-up preview", "大人預覽模式")}
        />
        <div>
          <p className="font-medium">{t("Grown-up preview", "大人預覽模式")}</p>
          <p className="mt-0.5 text-sm text-muted">
            {t(
              "Unlocks every door on this device so parents can read ahead and prepare. Switch it off again before little eyes arrive.",
              "在這台裝置上解鎖所有的門，方便爸爸媽媽提前閱讀與準備。孩子來之前記得關掉。",
            )}
          </p>
        </div>
      </div>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active ? `${active.day} · ${t(active.title)}` : ""}
      >
        {active && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow flex items-center gap-2 text-accent">
              <ActiveIcon className="size-4" aria-hidden />
              {t(KIND_LABEL[active.kind])}
            </p>
            <p className="display mt-4 text-xl leading-relaxed font-light sm:text-2xl" data-testid="door-body">
              {fill(t(active.body))}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {(active.kind === "activity" || active.kind === "challenge") && (
                <button
                  type="button"
                  aria-pressed={s.done.includes(active.day)}
                  onClick={() => toggleDone(active.day)}
                  className={s.done.includes(active.day) ? btn.primary : btn.outline}
                >
                  <Check className="size-4" aria-hidden />
                  {s.done.includes(active.day) ? t("We did it!", "我們完成了！") : t("Mark as done", "標記為完成")}
                </button>
              )}
              {active.link && (
                <Link href={active.link.href} className={btn.outline}>
                  {t(active.link.label)}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </Modal>
    </Page>
  );
}
