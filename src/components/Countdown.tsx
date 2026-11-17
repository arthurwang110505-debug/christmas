"use client";

import { useT } from "@/lib/i18n";
import { useSeconds } from "@/lib/hooks";
import { getCountdown } from "@/lib/time";

const SIZES = {
  hero: {
    num: "text-[clamp(1.9rem,9.5vw,2.75rem)] sm:text-[clamp(2.75rem,7.2vw,6.25rem)]",
    gap: "gap-2.5 sm:gap-6 lg:gap-8",
    label: "mt-1 text-[0.62rem] font-semibold tracking-[0.16em] uppercase sm:mt-2 sm:text-xs sm:tracking-[0.22em]",
  },
  tv: {
    num: "text-[clamp(1.9rem,10vw,12rem)]",
    gap: "gap-2.5 sm:gap-8 lg:gap-[3vw]",
    label: "mt-1 text-[clamp(0.62rem,1.3vw,1.5rem)] font-semibold tracking-[0.16em] uppercase sm:mt-2 sm:tracking-[0.22em]",
  },
  compact: {
    num: "text-3xl sm:text-4xl",
    gap: "gap-3 sm:gap-4",
    label: "eyebrow mt-1 !text-[0.65rem]",
  },
};

/** Live countdown to Christmas morning in the viewer's own time zone. */
export function Countdown({ size = "hero", tone = "ink" }: { size?: keyof typeof SIZES; tone?: "ink" | "cream" }) {
  const now = useSeconds();
  const t = useT();
  const s = SIZES[size];
  const c = now ? getCountdown(now) : null;
  const sub = tone === "cream" ? "text-cream/75" : "text-muted";

  if (c?.isChristmas) {
    return (
      <p role="status" className={`display font-light italic ${s.num}`}>
        {t("Merry Christmas!", "聖誕快樂！")}
      </p>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");
  const units: [string, string][] = [
    [c ? String(c.days) : "––", t("Days", "天")],
    [c ? pad(c.hours) : "––", t("Hours", "小時")],
    [c ? pad(c.minutes) : "––", t("Minutes", "分鐘")],
    [c ? pad(c.seconds) : "––", t("Seconds", "秒")],
  ];

  return (
    <div
      role="timer"
      aria-label={
        c
          ? t(
              `${c.days} days, ${c.hours} hours and ${c.minutes} minutes until Christmas ${c.year}`,
              `距離 ${c.year} 年聖誕節還有 ${c.days} 天 ${c.hours} 小時 ${c.minutes} 分鐘`,
            )
          : undefined
      }
      data-testid="countdown"
      className={`flex items-start ${s.gap}`}
    >
      {units.map(([value, label], i) => (
        <div key={label} className={`flex items-start ${s.gap}`}>
          {i > 0 && <span aria-hidden className="w-px self-stretch bg-current opacity-20" />}
          <div aria-hidden className="text-center">
            <div className={`numerals leading-none font-light ${s.num}`}>{value}</div>
            <div className={`${s.label} ${sub}`}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
