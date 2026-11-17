"use client";

import { Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { audio, useAudio } from "@/lib/audio/engine";
import { TRACKS } from "@/lib/audio/songs";
import { useMode } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { MODES } from "@/lib/scenes";
import { Page, PageHeader, Slider } from "./ui";

function duration(seconds: number) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const t = useT();
  const a = useAudio();
  const { mode } = useMode();
  const track = TRACKS[a.trackIndex];
  const round = "flex items-center justify-center rounded-full border border-line transition-colors hover:border-accent";

  return (
    <Page>
      <PageHeader
        eyebrow={t("Christmas Music", "聖誕音樂")}
        title={
          <>
            {t("Carols from a", "來自")} <em className="text-accent">{t("music box", "音樂盒的頌歌")}</em>
          </>
        }
        intro={t(
          "Traditional carols and two original pieces, played live by a small synthesiser inside your browser. Nothing to download, nothing to license.",
          "傳統頌歌與兩首原創曲，由瀏覽器裡的小型合成器即時演奏。不需下載，也沒有版權問題。",
        )}
      />

      {!a.supported && (
        <p role="alert" className="mt-6 rounded-2xl border border-accent p-4 text-sm">
          {t("This browser can't play synthesised audio, so music and ambience are unavailable here.", "這個瀏覽器無法播放合成音訊，因此無法使用音樂與環境音。")}
        </p>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <section aria-labelledby="np-h" className="rounded-3xl border border-line bg-surface-2 p-6 sm:p-8 lg:col-span-5 lg:self-start">
          <h2 id="np-h" className="eyebrow text-accent">
            {a.musicOn ? t("Now playing", "正在播放") : t("Ready to play", "準備播放")}
          </h2>
          <p className="display mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-light" data-testid="track-title">
            {t(track.title)}
          </p>
          <p className="mt-2 text-muted">{t(track.mood)}</p>
          <p className="mt-1 text-xs text-muted">{t(track.credit)}</p>

          <div className="mt-8 flex items-center gap-3">
            <button type="button" onClick={() => audio.prev()} aria-label={t("Previous track", "上一首")} className={`${round} size-12`}>
              <SkipBack className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => audio.toggleMusic()}
              aria-label={a.musicOn ? t("Pause", "暫停") : t("Play", "播放")}
              data-testid="play"
              className="flex size-[4.5rem] items-center justify-center rounded-full bg-accent text-on-accent transition hover:brightness-110"
            >
              {a.musicOn ? <Pause className="size-7" aria-hidden /> : <Play className="size-7 translate-x-0.5" aria-hidden />}
            </button>
            <button type="button" onClick={() => audio.next()} aria-label={t("Next track", "下一首")} className={`${round} size-12`}>
              <SkipForward className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-pressed={a.loopOne}
              onClick={() => audio.setLoopOne(!a.loopOne)}
              className={`ml-auto inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                a.loopOne ? "border-accent bg-accent text-on-accent" : "border-line hover:border-accent"
              }`}
            >
              {a.loopOne ? <Repeat1 className="size-4" aria-hidden /> : <Repeat className="size-4" aria-hidden />}
              {a.loopOne ? t("Looping this track", "單曲循環") : t("Looping playlist", "清單循環")}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Volume2 className="size-5 shrink-0 text-muted" aria-hidden />
            <Slider value={a.musicVolume} onChange={(v) => audio.setMusicVolume(v)} label={t("Music volume", "音樂音量")} className="flex-1" />
            <span className="numerals w-10 text-right text-sm text-muted">{Math.round(a.musicVolume * 100)}</span>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{t("Ambience", "環境音")}</h3>
                <p className="mt-0.5 text-sm text-muted">
                  {t(`Follows the atmosphere: ${MODES[mode].name[0]}`, `跟隨目前氛圍：${MODES[mode].name[1]}`)}
                </p>
              </div>
              <button
                type="button"
                aria-pressed={a.ambienceOn}
                onClick={() => audio.setAmbienceOn(!a.ambienceOn)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                  a.ambienceOn ? "border-accent bg-accent text-on-accent" : "border-line hover:border-accent"
                }`}
              >
                {a.ambienceOn ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
                {a.ambienceOn ? t("On", "開") : t("Off", "關")}
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Slider value={a.ambienceVolume} onChange={(v) => audio.setAmbienceVolume(v)} label={t("Ambience volume", "環境音音量")} className="flex-1" />
              <span className="numerals w-10 text-right text-sm text-muted">{Math.round(a.ambienceVolume * 100)}</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="pl-h" className="lg:col-span-7">
          <h2 id="pl-h" className="display text-2xl font-light">
            {t("Playlist", "播放清單")}
          </h2>
          <ol className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
            {TRACKS.map((tr, i) => {
              const current = i === a.trackIndex;
              return (
                <li key={tr.id}>
                  <button
                    type="button"
                    onClick={() => audio.selectTrack(i, true)}
                    aria-current={current ? "true" : undefined}
                    aria-label={t(`Play ${tr.title[0]}`, `播放 ${tr.title[1]}`)}
                    className={`flex min-h-[4.5rem] w-full items-center gap-4 px-4 py-3 text-left transition-colors sm:px-6 ${
                      current ? "bg-surface-2" : "hover:bg-surface-2/50"
                    }`}
                  >
                    <span className="flex w-6 shrink-0 justify-center">
                      {current && a.musicOn ? (
                        <span aria-hidden className="flex h-4 items-end gap-[3px] text-accent">
                          {[0, 1, 2].map((b) => (
                            <span key={b} className="eq-bar h-4 w-[3px] rounded-full bg-current" style={{ animationDelay: `${b * 0.22}s` }} />
                          ))}
                        </span>
                      ) : (
                        <span className={`numerals text-sm ${current ? "text-accent" : "text-muted"}`}>{i + 1}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-medium ${current ? "text-accent" : ""}`}>{t(tr.title)}</span>
                      <span className="mt-0.5 block truncate text-sm text-muted">{t(tr.mood)}</span>
                    </span>
                    <span className="numerals shrink-0 text-sm text-muted">{duration(tr.length)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {t(
              "Music keeps playing while you move around the site. On phones and tablets the system may pause it when the screen locks or you switch apps — that is the browser's rule, not ours.",
              "在網站內切換頁面時音樂會持續播放。在手機和平板上，螢幕鎖定或切換 App 時系統可能會暫停音樂，這是瀏覽器的限制。",
            )}
          </p>
        </section>
      </div>
    </Page>
  );
}
