"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "./i18n";
import type { ModeId, SceneId } from "./scenes";

/**
 * Tiny localStorage-backed store. Hydration-safe: the server (and the first
 * client render) see `initial`; saved values arrive right after hydration.
 * Changes in other tabs are picked up through the `storage` event.
 */
export function createPersistentStore<T extends object>(key: string, initial: T, onFirstLoad?: (s: T) => T) {
  let state: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function read(): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return { ...initial, ...parsed };
    } catch {
      /* storage blocked or corrupted: fall back to defaults */
    }
    return null;
  }

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    const saved = read();
    state = saved ?? (onFirstLoad ? onFirstLoad(initial) : initial);
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  function onStorage(e: StorageEvent) {
    if (e.key !== key) return;
    state = read() ?? initial;
    emit();
  }

  return {
    get(): T {
      load();
      return state;
    },
    set(patch: Partial<T> | ((s: T) => Partial<T>)) {
      load();
      const p = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...p };
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* quota or private mode: keep in memory for this session */
      }
      emit();
    },
    subscribe(l: () => void) {
      if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
      listeners.add(l);
      return () => {
        listeners.delete(l);
        if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    use(): T {
      return useSyncExternalStore(this.subscribe, this.get, () => initial);
    },
  };
}

export interface Settings {
  familyName: string;
  lang: Lang;
  mode: "auto" | ModeId;
  adventPreview: boolean;
  opened: number[];
  done: number[];
}

export const settings = createPersistentStore<Settings>(
  "cw26:settings",
  { familyName: "", lang: "en", mode: "auto", adventPreview: false, opened: [], done: [] },
  (s) => ({
    ...s,
    lang: typeof navigator !== "undefined" && /^zh/i.test(navigator.language || "") ? "zh" : "en",
  }),
);

export type OverlayKind = "countdown" | "clock" | "off";

export interface AmbientPrefs {
  scene: SceneId;
  overlay: OverlayKind | null;
  rotate: boolean | null;
}

export const ambientPrefs = createPersistentStore<AmbientPrefs>("cw26:ambient", {
  scene: "fireplace",
  overlay: null,
  rotate: null,
});

const noopSubscribe = () => () => {};

/** True once the component tree has hydrated on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
