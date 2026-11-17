"use client";

import { useCallback, useSyncExternalStore } from "react";
import { audio } from "./audio/engine";
import { trackIndexById } from "./audio/songs";
import { MODES, type ModeId } from "./scenes";
import { settings } from "./store";
import { autoMode } from "./time";

/** A shared wall clock that ticks exactly on second / minute boundaries. */
function createClock(every: number) {
  let now: Date | null = null;
  let timer: number | undefined;
  const listeners = new Set<() => void>();

  const schedule = () => {
    timer = window.setTimeout(tick, every - (Date.now() % every) + 4);
  };
  const tick = () => {
    now = new Date();
    listeners.forEach((l) => l());
    schedule();
  };
  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    window.clearTimeout(timer);
    tick();
  };

  return {
    subscribe(l: () => void) {
      listeners.add(l);
      if (listeners.size === 1) {
        now = new Date();
        schedule();
        document.addEventListener("visibilitychange", onVisible);
      }
      return () => {
        listeners.delete(l);
        if (listeners.size === 0) {
          window.clearTimeout(timer);
          document.removeEventListener("visibilitychange", onVisible);
        }
      };
    },
    get(): Date {
      if (!now) now = new Date();
      return now;
    },
  };
}

const secondClock = createClock(1000);
const minuteClock = createClock(60_000);
const serverNow = () => null;

/** Current time, updated every second. `null` during server render / hydration. */
export function useSeconds(): Date | null {
  return useSyncExternalStore(secondClock.subscribe, secondClock.get, serverNow);
}

/** Current time, updated every minute. `null` during server render / hydration. */
export function useMinutes(): Date | null {
  return useSyncExternalStore(minuteClock.subscribe, minuteClock.get, serverNow);
}

/** The active atmosphere: the family's choice, or the clock's suggestion when set to auto. */
export function useMode() {
  const { mode: choice } = settings.use();
  const now = useMinutes();
  const mode: ModeId = choice === "auto" ? (now ? autoMode(now) : "evening") : choice;

  const setMode = useCallback((next: "auto" | ModeId) => {
    settings.set({ mode: next });
    const resolved = next === "auto" ? autoMode(new Date()) : next;
    // Cue this atmosphere's music; it switches straight away if music is already playing.
    audio.selectTrack(trackIndexById(MODES[resolved].track));
  }, []);

  return { mode, choice, setMode };
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the visitor asked for reduced motion. Hydration-safe: reports `false`
 * while hydrating, then the real value (unlike framer-motion's own hook, which
 * differs between server and first client render and breaks hydration).
 */
export function useReduce(): boolean {
  return useSyncExternalStore(
    (l) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", l);
      return () => mq.removeEventListener("change", l);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}
