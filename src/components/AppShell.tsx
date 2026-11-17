"use client";

import {
  CalendarDays,
  Flame,
  Home,
  Image as ImageIcon,
  MessagesSquare,
  MoreHorizontal,
  Music,
  Settings as SettingsIcon,
  Sparkles,
  Tv,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { MotionConfig } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { audio, useAudio } from "@/lib/audio/engine";
import { useMode } from "@/lib/hooks";
import { useT, type Bi } from "@/lib/i18n";
import { MODES } from "@/lib/scenes";
import { settings } from "@/lib/store";
import { Field, inputClass, Modal, Segmented } from "./ui";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: Bi;
  long: Bi;
}

const NAV: NavItem[] = [
  { href: "/", icon: Home, label: ["Home", "首頁"], long: ["Dashboard", "首頁"] },
  { href: "/ambient", icon: Flame, label: ["Ambient", "氛圍"], long: ["Ambient Player", "氛圍播放器"] },
  { href: "/advent", icon: CalendarDays, label: ["Advent", "降臨曆"], long: ["Advent Calendar", "降臨節月曆"] },
  { href: "/wall", icon: MessagesSquare, label: ["Wall", "留言牆"], long: ["Family Wall", "家庭留言牆"] },
  { href: "/santa", icon: Sparkles, label: ["Santa", "聖誕老人"], long: ["Talk to Santa", "和聖誕老人聊天"] },
  { href: "/music", icon: Music, label: ["Music", "音樂"], long: ["Christmas Music", "聖誕音樂"] },
  { href: "/wallpapers", icon: ImageIcon, label: ["Cards", "卡片"], long: ["Wallpapers & Cards", "桌布與賀卡"] },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function SoundToggle({ className = "" }: { className?: string }) {
  const t = useT();
  const a = useAudio();
  const on = a.musicOn || a.ambienceOn;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => audio.setAllSound(!on)}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur transition-colors ${
        on ? "border-accent bg-accent text-on-accent" : "border-line bg-surface/70 text-ink hover:border-accent"
      } ${className}`}
    >
      {on ? (
        <span aria-hidden className="flex h-4 items-end gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="eq-bar h-4 w-[3px] rounded-full bg-current" style={{ animationDelay: `${i * 0.22}s` }} />
          ))}
        </span>
      ) : (
        <VolumeX className="size-4" aria-hidden />
      )}
      <span>{on ? t("Sound on", "聲音開啟") : t("Sound off", "聲音關閉")}</span>
    </button>
  );
}

function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const s = settings.use();
  return (
    <Modal open={open} onClose={onClose} title={t("Make it yours", "打造屬於你們的家")}>
      <div className="space-y-6">
        <Field
          label={t("Family name", "家庭名稱")}
          hint={t(
            "Used in greetings, the Advent calendar, Santa's letters and wallpapers. Saved on this device only.",
            "會用在問候語、降臨曆、聖誕老人的信和桌布上。只儲存在這台裝置。",
          )}
        >
          <input
            className={inputClass}
            value={s.familyName}
            maxLength={40}
            placeholder={t("e.g. the Lin family", "例如：林家")}
            onChange={(e) => settings.set({ familyName: e.target.value })}
            autoComplete="off"
          />
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium">{t("Language", "語言")}</p>
          <Segmented
            label={t("Language", "語言")}
            value={s.lang}
            onChange={(lang) => settings.set({ lang })}
            options={[
              { value: "en", label: "English" },
              { value: "zh", label: "繁體中文" },
            ]}
          />
        </div>
        <p className="border-t border-line pt-5 text-sm leading-relaxed text-muted">
          {t(
            "No account is needed. Your settings, opened doors, wall notes and photos live in this browser. To share the Family Wall between your devices, set up Home Sync on the Wall page.",
            "不需要註冊帳號。設定、已開啟的門、留言和照片都保存在這個瀏覽器裡。若想在多台裝置間共用家庭留言牆，請到留言牆頁面設定「家庭同步」。",
          )}
        </p>
      </div>
    </Modal>
  );
}

/** Root client shell. `reducedMotion="user"` makes every animation honour the device's motion setting. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Shell>{children}</Shell>
    </MotionConfig>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const t = useT();
  const { lang } = settings.use();
  const { mode } = useMode();
  const a = useAudio();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const immersive = pathname.startsWith("/ambient") || pathname.startsWith("/tv");

  // Reflect atmosphere + language on <html>, then reveal the page.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = mode;
    root.lang = lang === "zh" ? "zh-Hant" : "en";
    root.dataset.ready = "";
  }, [mode, lang]);

  // Outside the Ambient Player, the soundscape follows the atmosphere.
  useEffect(() => {
    if (!immersive) audio.setAmbience(MODES[mode].ambience);
  }, [mode, immersive]);

  if (immersive) return <div className="app-fade">{children}</div>;

  const soundOn = a.musicOn || a.ambienceOn;

  return (
    <div className="app-fade">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        {t("Skip to content", "跳到主要內容")}
      </a>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-md transition-colors duration-700">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 pt-[env(safe-area-inset-top)] sm:px-8 lg:px-12">
          <Link href="/" className="flex shrink-0 items-baseline gap-2 rounded-lg" aria-label="Christmas Wonderland 2026">
            <span aria-hidden className="twinkle text-accent">
              ✦
            </span>
            <span className="display text-lg leading-none sm:text-xl">
              {t("Wonderland", "聖誕仙境")} <span className="text-accent italic">2026</span>
            </span>
          </Link>

          <nav aria-label={t("Main", "主選單")} className="ml-4 hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-2 text-sm whitespace-nowrap transition-colors xl:px-3.5 ${
                    active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/tv"
              className="hidden min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-accent xl:inline-flex"
            >
              <Tv className="size-4" aria-hidden />
              {t("TV mode", "電視模式")}
            </Link>
            <div className="hidden sm:block">
              <SoundToggle />
            </div>
            <button
              type="button"
              aria-pressed={soundOn}
              aria-label={soundOn ? t("Turn sound off", "關閉聲音") : t("Turn sound on", "開啟聲音")}
              onClick={() => audio.setAllSound(!soundOn)}
              className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors sm:hidden ${
                soundOn ? "border-accent bg-accent text-on-accent" : "border-line text-ink"
              }`}
            >
              {soundOn ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => settings.set({ lang: lang === "zh" ? "en" : "zh" })}
              aria-label={lang === "zh" ? "Switch to English" : "切換為繁體中文"}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink transition-colors hover:border-accent"
            >
              {lang === "zh" ? "EN" : "中"}
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={t("Settings", "設定")}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-accent"
            >
              <SettingsIcon className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>

      {/* Phone & tablet navigation */}
      <nav
        aria-label={t("Main", "主選單")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-5 md:grid-cols-7">
          {NAV.map((item, i) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className={i >= 4 ? "hidden md:block" : ""}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-[4.25rem] flex-col items-center justify-center gap-1 text-[0.7rem] font-medium transition-colors ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <Icon className="size-[22px]" aria-hidden />
                  {t(item.label)}
                </Link>
              </li>
            );
          })}
          <li className="md:hidden">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={`flex h-[4.25rem] w-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium ${
                NAV.slice(4).some((n) => isActive(pathname, n.href)) ? "text-accent" : "text-muted"
              }`}
            >
              <MoreHorizontal className="size-[22px]" aria-hidden />
              {t("More", "更多")}
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title={t("More to explore", "更多功能")}>
        <ul className="-mx-2 divide-y divide-line">
          {[...NAV.slice(4), { href: "/tv", icon: Tv, label: ["TV", "電視"] as Bi, long: ["TV mode", "電視模式"] as Bi }].map(
            (item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex min-h-14 items-center gap-4 rounded-xl px-2 text-base hover:text-accent"
                  >
                    <Icon className="size-5 text-accent" aria-hidden />
                    {t(item.long)}
                  </Link>
                </li>
              );
            },
          )}
        </ul>
      </Modal>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
