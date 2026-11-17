"use client";

import { useCallback } from "react";
import { settings } from "./store";

export type Lang = "en" | "zh";

/** A bilingual string: [English, Traditional Chinese]. */
export type Bi = readonly [en: string, zh: string];

export function pick(b: Bi, lang: Lang): string {
  return lang === "zh" ? b[1] : b[0];
}

export function useLang(): Lang {
  return settings.use().lang;
}

/** `t("Hello", "你好")` or `t(bi)` — returns the string for the active language. */
export function useT() {
  const lang = useLang();
  return useCallback(
    (en: string | Bi, zh?: string): string => {
      if (typeof en !== "string") return pick(en, lang);
      return lang === "zh" ? (zh ?? en) : en;
    },
    [lang],
  );
}

export function useFamily(): { name: string; label: string } {
  const { familyName, lang } = settings.use();
  const name = familyName.trim();
  return { name, label: name || (lang === "zh" ? "我們一家" : "our family") };
}

export function formatDate(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-TW" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatClock(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}
