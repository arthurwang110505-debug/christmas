import type { Bi } from "./i18n";
import type { ModeId } from "./scenes";

export const CHRISTMAS_YEAR = 2026;

export interface Countdown {
  /** The Christmas being counted down to. */
  year: number;
  /** True on Christmas Day and Boxing Day. */
  isChristmas: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Calendar nights left ("sleeps"). */
  sleeps: number;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Countdown to 00:00 on 25 December in the viewer's own time zone.
 * Before Christmas 2026 it targets 2026; once the celebration (25–26 Dec)
 * is over it rolls on to the following year so the site never shows negatives.
 */
export function getCountdown(now: Date): Countdown {
  let year = Math.max(CHRISTMAS_YEAR, now.getFullYear());
  if (now.getTime() >= new Date(year, 11, 27).getTime()) year += 1;
  const target = new Date(year, 11, 25, 0, 0, 0, 0);
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) {
    return { year, isChristmas: true, days: 0, hours: 0, minutes: 0, seconds: 0, sleeps: 0 };
  }
  const total = Math.floor(ms / 1000);
  const sleeps = Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / 86_400_000);
  return {
    year,
    isChristmas: false,
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    sleeps,
  };
}

export interface DoorStatus {
  unlocked: boolean;
  isToday: boolean;
}

/** Advent door `day` (1–25) opens at local midnight on that day of December 2026. */
export function doorStatus(day: number, now: Date): DoorStatus {
  const opens = new Date(CHRISTMAS_YEAR, 11, day);
  const isToday =
    now.getFullYear() === CHRISTMAS_YEAR && now.getMonth() === 11 && now.getDate() === day;
  return { unlocked: now.getTime() >= opens.getTime(), isToday };
}

/** Today's door number during Advent 2026, otherwise null. */
export function todaysDoor(now: Date): number | null {
  if (now.getFullYear() !== CHRISTMAS_YEAR || now.getMonth() !== 11) return null;
  const d = now.getDate();
  return d >= 1 && d <= 25 ? d : null;
}

/** Atmosphere suggested by the clock: Christmas Eve all day on 24 Dec. */
export function autoMode(now: Date): ModeId {
  if (now.getMonth() === 11 && now.getDate() === 24) return "eve";
  const h = now.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  return "evening";
}

export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((startOfDay(d).getTime() - start.getTime()) / 86_400_000);
}

export function salutation(now: Date): Bi {
  const h = now.getHours();
  if (h >= 5 && h < 12) return ["Good morning", "早安"];
  if (h >= 12 && h < 18) return ["Good afternoon", "午安"];
  return ["Good evening", "晚安"];
}

const DAILY_GREETINGS: Bi[] = [
  ["May today be slow, warm and a little bit sparkly.", "願今天慢慢的、暖暖的，還帶著一點點閃亮。"],
  ["Put the kettle on — Christmas is getting closer.", "煮一壺熱茶吧，聖誕節又近了一點。"],
  ["A small kindness today makes the whole house glow.", "今天的一點小小善意，會讓整個家都發光。"],
  ["Light a candle, play a carol, and let the day soften.", "點一支蠟燭、放一首頌歌，讓今天變得柔軟。"],
  ["Home is where the fairy lights are.", "有小燈串的地方，就是家。"],
  ["Today is a good day for cocoa and a good story.", "今天很適合一杯熱可可，配一個好故事。"],
  ["May your home be full of laughter and the smell of cinnamon.", "願家裡充滿笑聲與肉桂的香氣。"],
  ["Somewhere, snow is falling quietly just for you.", "在某個地方，雪正為你靜靜地落下。"],
  ["Wrap up warm. The best season is on its way.", "穿暖一點，最美好的季節正在路上。"],
  ["Every day until Christmas is a little gift of its own.", "聖誕節前的每一天，都是一份小小的禮物。"],
  ["Leave room today for something unexpectedly lovely.", "今天，留一點空間給意想不到的美好。"],
  ["The lights are on and you are welcome here.", "燈已經亮了，歡迎回家。"],
];

/** A greeting that changes once a day and is the same on every device. */
export function dailyGreeting(now: Date): Bi {
  if (now.getMonth() === 11 && now.getDate() === 25) {
    return ["Merry Christmas! Today is the day we waited for.", "聖誕快樂！今天就是我們等待的那一天。"];
  }
  if (now.getMonth() === 11 && now.getDate() === 24) {
    return ["It is Christmas Eve. Hang the stockings and listen for bells.", "今天是平安夜。掛好聖誕襪，聽聽看有沒有鈴聲。"];
  }
  return DAILY_GREETINGS[dayOfYear(now) % DAILY_GREETINGS.length];
}
