"use client";

import {
  ArrowLeft,
  Clock3,
  EyeOff,
  Maximize,
  Minimize,
  Music,
  Pause,
  Play,
  Repeat,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { audio, useAudio } from "@/lib/audio/engine";
import { TRACKS } from "@/lib/audio/songs";
import { useMinutes } from "@/lib/hooks";
import { formatClock, formatDate, useLang, useT } from "@/lib/i18n";
import { SCENE_ORDER, SCENES, type SceneId } from "@/lib/scenes";
import { ambientPrefs, type OverlayKind } from "@/lib/store";
import { Countdown } from "./Countdown";
import { SceneBackdrop } from "./SceneBackdrop";
import { Slider } from "./ui";

const OVERLAYS: OverlayKind[] = ["countdown", "clock", "off"];
const SHIFTS = ["0,0", "1.2vw,0.8vh", "0.5vw,1.6vh", "-0.4vw,0.9vh"];
const AUTO_HIDE_MS = 10_000;

const subscribeFullscreen = (l: () => void) => {
  document.addEventListener("fullscreenchange", l);
  return () => document.removeEventListener("fullscreenchange", l);
};
const noSubscribe = () => () => {};

function stepScene(dir: number) {
  const i = SCENE_ORDER.indexOf(ambientPrefs.get().scene);
  const next = SCENE_ORDER[(i + dir + SCENE_ORDER.length) % SCENE_ORDER.length];
  ambientPrefs.set({ scene: next });
}

/**
 * Full-screen ambient scenes with synthesised sound. Doubles as the TV
 * presentation (`tv`): larger type and controls, countdown on by default,
 * scenes rotating, and everything reachable with a remote's arrow keys.
 */
export function AmbientPlayer({ tv = false }: { tv?: boolean }) {
  const t = useT();
  const lang = useLang();
  const prefs = ambientPrefs.use();
  const a = useAudio();
  const now = useMinutes();
  const scene = SCENES[prefs.scene] ?? SCENES.fireplace;
  const overlay: OverlayKind = prefs.overlay ?? (tv ? "countdown" : "clock");
  const rotate = prefs.rotate ?? tv;

  const [ui, setUi] = useState(true);
  const uiRef = useRef(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const ignoreMoveUntil = useRef(0);
  const isFs = useSyncExternalStore(subscribeFullscreen, () => Boolean(document.fullscreenElement), () => false);
  // iPhone Safari has no element full screen; the button only appears where it works.
  const fsOk = useSyncExternalStore(noSubscribe, () => Boolean(document.fullscreenEnabled), () => false);

  /** (Re)start the countdown to tucking the controls away. */
  const arm = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      uiRef.current = false;
      setUi(false);
    }, AUTO_HIDE_MS);
  }, []);

  const show = useCallback(() => {
    uiRef.current = true;
    setUi(true);
    arm();
  }, [arm]);

  const hide = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    uiRef.current = false;
    setUi(false);
    ignoreMoveUntil.current = Date.now() + 900;
  }, []);

  // The soundscape follows the scene.
  useEffect(() => {
    audio.setAmbience(scene.ambience);
  }, [scene]);

  // Pointer activity reveals the controls; they tuck away again after a pause.
  useEffect(() => {
    arm();
    const onPointer = () => {
      if (Date.now() >= ignoreMoveUntil.current) show();
    };
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.clearTimeout(hideTimer.current);
    };
  }, [arm, show]);

  // Keyboard / TV remote.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const root = rootRef.current;
      if (!root) return;
      const arrow = e.key.startsWith("Arrow");

      if (!uiRef.current) {
        // Controls hidden: left/right change the scene directly; anything else brings the controls back.
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          stepScene(e.key === "ArrowRight" ? 1 : -1);
          e.preventDefault();
          return;
        }
        if (e.key === "Tab" || e.key === "Shift") return show();
        e.preventDefault();
        show();
        requestAnimationFrame(() => root.querySelector<HTMLElement>('[data-nav][aria-checked="true"]')?.focus());
        return;
      }

      show();
      if (e.key === "Escape" && !document.fullscreenElement) {
        hide();
        return;
      }
      if (!arrow) return;
      const target = e.target as HTMLElement | null;
      const isRange = target instanceof HTMLInputElement && target.type === "range";
      if (isRange && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return; // adjusts the volume
      const items = Array.from(root.querySelectorAll<HTMLElement>("[data-nav]")).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
      const next = i < 0 ? 0 : (i + (forward ? 1 : -1) + items.length) % items.length;
      items[next].focus();
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, hide]);

  // Optional slow rotation through the scenes.
  useEffect(() => {
    if (!rotate) return;
    const id = window.setInterval(() => stepScene(1), 180_000);
    return () => window.clearInterval(id);
  }, [rotate]);

  // Keep the screen awake while this is on display (where the browser allows it).
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release().catch(() => {});
      } catch {
        /* not permitted (e.g. low battery): carry on without it */
      }
    };
    void request();
    const onVis = () => {
      if (document.visibilityState === "visible") void request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => {});
    };
  }, []);

  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void rootRef.current?.requestFullscreen().catch(() => {});
  };

  const nextOverlay = OVERLAYS[(OVERLAYS.indexOf(overlay) + 1) % OVERLAYS.length];
  const overlayLabel: Record<OverlayKind, string> = {
    countdown: t("Countdown", "倒數"),
    clock: t("Clock", "時鐘"),
    off: t("No overlay", "不顯示"),
  };
  const track = TRACKS[a.trackIndex];
  const shift = SHIFTS[(now?.getMinutes() ?? 0) % SHIFTS.length];

  const ctl = `inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-cream/20 bg-cream/5 font-medium text-cream transition-colors hover:border-gold aria-pressed:border-gold aria-pressed:bg-gold aria-pressed:text-night ${
    tv ? "min-h-[clamp(3.5rem,4.4vw,5.5rem)] px-[clamp(1.5rem,1.8vw,2.5rem)] text-[clamp(1.125rem,1.5vw,2rem)]" : "min-h-11 px-4 text-sm"
  }`;
  const icon = tv ? "size-[1.25em]" : "size-[18px]";
  // Phones: the four view buttons collapse to icons so the panel stays compact.
  const compact = tv ? "" : "max-sm:w-11 max-sm:px-0";
  const text = tv ? "" : "max-sm:sr-only";
  const slider = tv ? "w-[10vw]" : "w-24 sm:w-28";
  const fade = ui ? "opacity-100" : "pointer-events-none opacity-0";

  return (
    <div
      ref={rootRef}
      data-testid="ambient"
      data-ui={ui ? "shown" : "hidden"}
      className={`fixed inset-0 z-50 overflow-hidden bg-night text-cream ${ui ? "" : "cursor-none"} ${tv ? "tv" : ""}`}
      style={
        {
          "--accent": "#c6a76b",
          "--slider-fill": "#c6a76b",
          "--slider-track": "rgb(245 235 221 / 0.25)",
          "--slider-thumb": "#f5ebdd",
        } as CSSProperties
      }
    >
      <h1 className="sr-only">{tv ? t("TV mode", "電視模式") : t("Ambient Player", "氛圍播放器")}</h1>
      <SceneBackdrop
        image={scene.image}
        particles={scene.particles}
        density={scene.density}
        firelight={scene.firelight}
        priority
      />
      <div aria-hidden className="absolute inset-0 bg-night/15" />

      {overlay !== "off" && (
        <div aria-hidden className="absolute inset-y-0 left-0 w-[85%] bg-gradient-to-r from-night/80 via-night/45 to-transparent" />
      )}

      {/* Clock / countdown overlay. Nudged every minute to be kind to OLED screens. */}
      {overlay !== "off" && (
        <div
          className="absolute top-[max(6rem,14vh)] left-[6vw] max-w-[88vw]"
          style={{
            transform: `translate(${shift})`,
            transition: "transform 8s ease-in-out",
            textShadow: "0 2px 28px rgb(0 0 0 / 0.6)",
          }}
        >
          {overlay === "countdown" ? (
            <>
              <p className="mb-[1.5vh] text-[clamp(0.75rem,1.4vw,1.6rem)] font-semibold tracking-[0.22em] text-gold uppercase">
                {t("Until Christmas morning", "距離聖誕早晨")}
              </p>
              <Countdown size="tv" tone="cream" />
              <p className="numerals mt-[2.5vh] text-[clamp(1.1rem,2.4vw,2.75rem)] text-cream/90" data-testid="overlay-clock">
                {now ? `${formatClock(now)} · ${formatDate(now, lang)}` : "\u00a0"}
              </p>
            </>
          ) : (
            <>
              <p className="numerals text-[clamp(4.5rem,15vw,15rem)] leading-none font-light" data-testid="overlay-clock">
                {now ? formatClock(now) : "––:––"}
              </p>
              <p className="mt-[1vh] text-[clamp(1rem,2.2vw,2.5rem)] text-cream/90">{now ? formatDate(now, lang) : "\u00a0"}</p>
            </>
          )}
        </div>
      )}

      {/* Top bar */}
      <div
        inert={!ui}
        className={`absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 pt-[max(1rem,env(safe-area-inset-top))] transition-opacity duration-500 sm:p-6 ${fade}`}
      >
        <Link href="/" data-nav className={`${ctl} bg-night/60 backdrop-blur-md`}>
          <ArrowLeft className={icon} aria-hidden />
          {t("Home", "首頁")}
        </Link>
        <div className="text-right" style={{ textShadow: "0 2px 20px rgb(0 0 0 / 0.6)" }}>
          <p className={`display leading-tight font-light ${tv ? "text-[clamp(2.25rem,3vw,4rem)]" : "text-xl sm:text-2xl"}`}>{t(scene.name)}</p>
          <p className={`mt-1 text-cream/80 ${tv ? "text-[clamp(1.25rem,1.5vw,2rem)]" : "text-sm"}`}>{t(scene.blurb)}</p>
        </div>
      </div>

      {/* Controls */}
      <div
        inert={!ui}
        className={`absolute inset-x-0 bottom-0 transition-all duration-500 ${fade} ${ui ? "translate-y-0" : "translate-y-4"}`}
      >
        <div className="border-t border-cream/15 bg-night/80 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-6">
          <div
            role="radiogroup"
            aria-label={t("Scene", "場景")}
            className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 py-1.5"
          >
            {SCENE_ORDER.map((id: SceneId) => {
              const s = SCENES[id];
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  data-nav
                  aria-checked={id === scene.id}
                  onClick={() => ambientPrefs.set({ scene: id })}
                  className={`group relative aspect-video shrink-0 overflow-hidden rounded-xl border-2 border-transparent transition-colors aria-checked:border-gold ${
                    tv ? "w-[clamp(14rem,15vw,22rem)]" : "w-32 sm:w-40"
                  }`}
                >
                  <Image src={s.image} alt="" fill sizes={tv ? "15vw" : "160px"} className="object-cover" />
                  <span
                    className={`absolute inset-x-0 bottom-0 truncate bg-night/75 px-2 py-1 text-left font-medium ${
                      tv ? "text-[clamp(1rem,1.2vw,1.5rem)]" : "text-xs"
                    }`}
                  >
                    {t(s.name)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-nav
                aria-pressed={a.ambienceOn}
                onClick={() => audio.setAmbienceOn(!a.ambienceOn)}
                className={ctl}
              >
                {a.ambienceOn ? <Volume2 className={icon} aria-hidden /> : <VolumeX className={icon} aria-hidden />}
                {a.ambienceOn ? t(scene.sound) : t("Sound off", "聲音關閉")}
              </button>
              <Slider
                value={a.ambienceVolume}
                onChange={(v) => audio.setAmbienceVolume(v)}
                label={t("Ambience volume", "環境音音量")}
                className={slider}
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="button" data-nav aria-pressed={a.musicOn} onClick={() => audio.toggleMusic()} className={ctl}>
                {a.musicOn ? <Pause className={icon} aria-hidden /> : <Play className={icon} aria-hidden />}
                <Music className={`${icon} sm:hidden`} aria-hidden />
                <span className="hidden max-w-44 truncate sm:inline">{t(track.title)}</span>
                <span className="sr-only sm:hidden">{t(track.title)}</span>
              </button>
              <button
                type="button"
                data-nav
                onClick={() => audio.next()}
                aria-label={t("Next track", "下一首")}
                title={t("Next track", "下一首")}
                className={`${ctl} !px-0 ${tv ? "w-[clamp(3.5rem,4.4vw,5.5rem)]" : "w-11"}`}
              >
                <SkipForward className={icon} aria-hidden />
              </button>
              <Slider
                value={a.musicVolume}
                onChange={(v) => audio.setMusicVolume(v)}
                label={t("Music volume", "音樂音量")}
                className={slider}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto">
              <button
                type="button"
                data-nav
                onClick={() => ambientPrefs.set({ overlay: nextOverlay })}
                aria-label={t(
                  `Overlay: ${overlayLabel[overlay]}. Switch to ${overlayLabel[nextOverlay]}`,
                  `畫面顯示：${overlayLabel[overlay]}。切換為${overlayLabel[nextOverlay]}`,
                )}
                title={overlayLabel[overlay]}
                className={`${ctl} ${compact}`}
              >
                <Clock3 className={icon} aria-hidden />
                <span className={text}>{overlayLabel[overlay]}</span>
              </button>
              <button
                type="button"
                data-nav
                aria-pressed={rotate}
                onClick={() => ambientPrefs.set({ rotate: !rotate })}
                title={t("Rotate scenes", "輪播場景")}
                className={`${ctl} ${compact}`}
              >
                <Repeat className={icon} aria-hidden />
                <span className={text}>{t("Rotate scenes", "輪播場景")}</span>
              </button>
              {fsOk && (
                <button type="button" data-nav aria-pressed={isFs} onClick={toggleFs} title={t("Full screen", "全螢幕")} className={`${ctl} ${compact}`}>
                  {isFs ? <Minimize className={icon} aria-hidden /> : <Maximize className={icon} aria-hidden />}
                  <span className={text}>{isFs ? t("Exit full screen", "離開全螢幕") : t("Full screen", "全螢幕")}</span>
                </button>
              )}
              <button type="button" data-nav onClick={hide} title={t("Hide controls", "隱藏控制列")} className={`${ctl} ${compact}`}>
                <EyeOff className={icon} aria-hidden />
                <span className={text}>{t("Hide controls", "隱藏控制列")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
