"use client";

import { useSyncExternalStore } from "react";
import type { Ambience } from "../scenes";
import { TRACKS, type NoteEvent, type Part, type VoiceId } from "./songs";

/**
 * Web Audio engine for Christmas Wonderland.
 *  - Music: note data played by small additive "music box / bell" voices.
 *  - Ambience: three synthesised layers (fire, wind, chimes) that cross-fade.
 * Scheduling runs ahead of the clock so playback survives throttled timers
 * when the tab is in the background.
 */

export interface AudioState {
  supported: boolean;
  musicOn: boolean;
  trackIndex: number;
  musicVolume: number;
  ambienceOn: boolean;
  ambienceVolume: number;
  loopOne: boolean;
}

const DEFAULT_STATE: AudioState = {
  supported: true,
  musicOn: false,
  trackIndex: 0,
  musicVolume: 0.7,
  ambienceOn: false,
  ambienceVolume: 0.6,
  loopOne: false,
};

const PREFS_KEY = "cw26:audio";
const LOOKAHEAD = 2.4;

interface Partial_ {
  ratio: number;
  gain: number;
  decay: number;
  type: OscillatorType;
}
interface VoiceSpec {
  attack: number;
  minDecay: number;
  sustainMul: number;
  partials: Partial_[];
  /** If set, every partial runs through one shared lowpass (used for the string bed). */
  lowpass?: { frequency: number; q: number };
  /** If true, every partial is doubled into a ±9-cent detuned pair (ensemble warmth). */
  chorus?: boolean;
}

const LEAD: Record<VoiceId, VoiceSpec> = {
  musicbox: {
    attack: 0.004,
    minDecay: 1.5,
    sustainMul: 1.6,
    partials: [
      { ratio: 0.5, gain: 0.24, decay: 1.4, type: "sine" },
      { ratio: 1, gain: 0.9, decay: 1, type: "sine" },
      { ratio: 1, gain: 0.1, decay: 0.7, type: "triangle" },
      { ratio: 2, gain: 0.22, decay: 0.55, type: "sine" },
      { ratio: 5.04, gain: 0.09, decay: 0.16, type: "sine" },
    ],
  },
  bells: {
    attack: 0.003,
    minDecay: 1.2,
    sustainMul: 1.5,
    partials: [
      { ratio: 0.5, gain: 0.12, decay: 1.5, type: "sine" },
      { ratio: 1, gain: 0.8, decay: 1, type: "sine" },
      { ratio: 2, gain: 0.28, decay: 0.7, type: "sine" },
      { ratio: 3.01, gain: 0.15, decay: 0.45, type: "sine" },
      { ratio: 6.3, gain: 0.05, decay: 0.14, type: "sine" },
    ],
  },
  celesta: {
    attack: 0.005,
    minDecay: 1.1,
    sustainMul: 1.4,
    partials: [
      { ratio: 0.5, gain: 0.28, decay: 1.3, type: "sine" },
      { ratio: 1, gain: 0.85, decay: 1, type: "sine" },
      { ratio: 1, gain: 0.1, decay: 0.7, type: "triangle" },
      { ratio: 4, gain: 0.14, decay: 0.3, type: "sine" },
    ],
  },
};

const ACCOMP: Record<Exclude<Part, "lead">, VoiceSpec> = {
  bass: {
    attack: 0.03,
    minDecay: 1.4,
    sustainMul: 1.3,
    partials: [
      { ratio: 0.5, gain: 0.38, decay: 1, type: "sine" },
      { ratio: 1, gain: 0.9, decay: 1, type: "sine" },
      { ratio: 2, gain: 0.18, decay: 0.6, type: "triangle" },
    ],
  },
  harp: {
    attack: 0.008,
    minDecay: 1.0,
    sustainMul: 2,
    chorus: true,
    partials: [
      { ratio: 1, gain: 0.75, decay: 1, type: "sine" },
      { ratio: 2, gain: 0.1, decay: 0.4, type: "sine" },
    ],
  },
  /** Soft sustained triads — the "string bed" that fills out the harmony. */
  strings: {
    attack: 0.4,
    minDecay: 3.2,
    sustainMul: 1.15,
    lowpass: { frequency: 1250, q: 0.4 },
    chorus: true,
    partials: [
      { ratio: 1, gain: 0.34, decay: 1, type: "sawtooth" },
      { ratio: 2, gain: 0.05, decay: 0.7, type: "sine" },
    ],
  },
};

const CHIME_NOTES = [72, 74, 76, 79, 81, 84, 86, 88];

/** Procedural stereo impulse response — a warm, medium room. No assets needed. */
function impulseResponse(ctx: AudioContext, seconds = 2.1, decay = 2.7): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function noiseBuffer(ctx: AudioContext, seconds: number, kind: "white" | "brown"): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "white") data[i] = w;
    else {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
}

class AudioEngine {
  private state: AudioState = DEFAULT_STATE;
  private prefsLoaded = false;
  private listeners = new Set<() => void>();

  private ctx: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private chimeGain: GainNode | null = null;
  private white: AudioBuffer | null = null;

  private amb: Ambience = { fire: 0.7, wind: 0.35, chimes: 0.1 };
  private nextCrackle = 0;
  private nextChime = 0;
  private ambTimer: number | null = null;

  private trackGain: GainNode | null = null;
  private schedIndex = 0;
  private evIdx = 0;
  private loopStart = 0;
  private pausedPos = 0;
  private musicTimer: number | null = null;
  private displayTimer: number | null = null;
  private suspendTimer: number | null = null;

  /* ---- store plumbing ---- */

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  getState = (): AudioState => {
    this.loadPrefs();
    return this.state;
  };

  getServerState = (): AudioState => DEFAULT_STATE;

  private loadPrefs() {
    if (this.prefsLoaded || typeof window === "undefined") return;
    this.prefsLoaded = true;
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<AudioState>;
        const clamp = (v: unknown, d: number) => (typeof v === "number" && v >= 0 && v <= 1 ? v : d);
        this.state = {
          ...this.state,
          musicVolume: clamp(p.musicVolume, this.state.musicVolume),
          ambienceVolume: clamp(p.ambienceVolume, this.state.ambienceVolume),
          loopOne: Boolean(p.loopOne),
          trackIndex:
            typeof p.trackIndex === "number" && p.trackIndex >= 0 && p.trackIndex < TRACKS.length
              ? Math.floor(p.trackIndex)
              : 0,
        };
        this.schedIndex = this.state.trackIndex;
      }
    } catch {
      /* ignore */
    }
  }

  private patch(p: Partial<AudioState>) {
    this.loadPrefs();
    this.state = { ...this.state, ...p };
    try {
      const { musicVolume, ambienceVolume, loopOne, trackIndex } = this.state;
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ musicVolume, ambienceVolume, loopOne, trackIndex }));
    } catch {
      /* ignore */
    }
    this.listeners.forEach((l) => l());
  }

  /* ---- graph ---- */

  /** Must be called from a user gesture the first time (browser autoplay rules). */
  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    this.loadPrefs();
    if (!this.ctx) {
      const AC =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        this.patch({ supported: false });
        return null;
      }
      try {
        this.ctx = new AC();
        this.build(this.ctx);
      } catch {
        this.ctx = null;
        this.patch({ supported: false });
        return null;
      }
    }
    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    if (this.ctx.state !== "running") void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private build(ctx: AudioContext) {
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 5;
    master.connect(comp).connect(ctx.destination);

    // Music bus with a soft echo for a sense of room.
    const musicBus = ctx.createGain();
    musicBus.gain.value = this.state.musicVolume ** 2;
    musicBus.connect(master);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.31;
    const damp = ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 2200;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.26;
    const wet = ctx.createGain();
    wet.gain.value = 0.16;
    musicBus.connect(delay);
    delay.connect(damp);
    damp.connect(feedback).connect(delay);
    damp.connect(wet).connect(master);
    // Convolution reverb: the strongest single "room" cue. Built procedurally.
    const convolver = ctx.createConvolver();
    convolver.buffer = impulseResponse(ctx, 2.1, 2.7);
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.22;
    musicBus.connect(convolver);
    convolver.connect(reverbWet).connect(master);
    this.musicBus = musicBus;

    const ambBus = ctx.createGain();
    ambBus.gain.value = 0;
    ambBus.connect(master);
    this.ambBus = ambBus;

    const white = noiseBuffer(ctx, 2, "white");
    const brown = noiseBuffer(ctx, 5, "brown");
    this.white = white;
    const loop = (buffer: AudioBuffer, offset = 0) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.start(0, offset);
      return src;
    };

    // Fire: low roar + faint hiss; crackles are scheduled individually.
    const fire = ctx.createGain();
    fire.gain.value = 0;
    fire.connect(ambBus);
    const roarLp = ctx.createBiquadFilter();
    roarLp.type = "lowpass";
    roarLp.frequency.value = 420;
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0.5;
    loop(brown).connect(roarLp).connect(roarGain).connect(fire);
    const hissBp = ctx.createBiquadFilter();
    hissBp.type = "bandpass";
    hissBp.frequency.value = 3200;
    hissBp.Q.value = 0.5;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.012;
    loop(white).connect(hissBp).connect(hissGain).connect(fire);
    this.fireGain = fire;

    // Wind: band-passed brown noise whose pitch and loudness drift slowly.
    const wind = ctx.createGain();
    wind.gain.value = 0;
    wind.connect(ambBus);
    const windBp = ctx.createBiquadFilter();
    windBp.type = "bandpass";
    windBp.frequency.value = 380;
    windBp.Q.value = 0.7;
    const windAmp = ctx.createGain();
    windAmp.gain.value = 0.7;
    loop(brown, 2.3).connect(windBp).connect(windAmp).connect(wind);
    const lfo1 = ctx.createOscillator();
    lfo1.frequency.value = 0.07;
    const lfo1Depth = ctx.createGain();
    lfo1Depth.gain.value = 170;
    lfo1.connect(lfo1Depth).connect(windBp.frequency);
    lfo1.start();
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.043;
    const lfo2Depth = ctx.createGain();
    lfo2Depth.gain.value = 0.3;
    lfo2.connect(lfo2Depth).connect(windAmp.gain);
    lfo2.start();
    this.windGain = wind;

    const chimes = ctx.createGain();
    chimes.gain.value = 0;
    chimes.connect(ambBus);
    chimes.connect(delay);
    chimes.connect(convolver);
    this.chimeGain = chimes;

    this.applyAmbience(0.01);

    // Mobile browsers suspend audio when the page is hidden; pick up again on return.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && (this.state.musicOn || this.state.ambienceOn)) {
        void this.ctx?.resume().catch(() => {});
      }
    });
  }

  private maybeSuspend() {
    if (!this.ctx || this.state.musicOn || this.state.ambienceOn) return;
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      this.suspendTimer = null;
      if (!this.state.musicOn && !this.state.ambienceOn) void this.ctx?.suspend().catch(() => {});
    }, 1500);
  }

  /* ---- music ---- */

  private playNote(voice: VoiceId, ev: NoteEvent, when: number, dest: AudioNode) {
    const ctx = this.ctx;
    if (!ctx) return;
    const spec = ev.part === "lead" ? LEAD[voice] : ACCOMP[ev.part];
    const f = 440 * 2 ** ((ev.midi - 69) / 12);
    const sustain = Math.min(3.4, Math.max(spec.minDecay, ev.dur * spec.sustainMul));
    // Per-note humanisation: a constant pitch drift (constant across partials,
    // so the partials stay in tune with each other) and a ±8% velocity wobble.
    const drift = (Math.random() - 0.5) * 8;
    const humanVel = ev.vel * (0.92 + Math.random() * 0.16);
    // Pad voices share one lowpass per note so the whole triad blooms together.
    let sharedFilter: BiquadFilterNode | null = null;
    if (spec.lowpass) {
      sharedFilter = ctx.createBiquadFilter();
      sharedFilter.type = "lowpass";
      sharedFilter.frequency.value = spec.lowpass.frequency;
      sharedFilter.Q.value = spec.lowpass.q;
      sharedFilter.connect(dest);
    }
    const noteDest: AudioNode = sharedFilter ?? dest;
    for (const p of spec.partials) {
      const pf = f * p.ratio;
      if (pf > 11000) continue;
      // Chorus voices double every partial into a slightly detuned pair.
      const detuneOffsets = spec.chorus ? [-9, 9] : [0];
      for (const off of detuneOffsets) {
        const osc = ctx.createOscillator();
        osc.type = p.type;
        osc.frequency.value = pf;
        osc.detune.value = drift + off;
        const g = ctx.createGain();
        const end = when + spec.attack + sustain * p.decay;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(humanVel * p.gain * (spec.chorus ? 0.72 : 1), when + spec.attack);
        g.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(g).connect(noteDest);
        osc.start(when);
        osc.stop(end + 0.05);
      }
    }
  }

  private stopMusicNodes() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.displayTimer !== null) {
      window.clearTimeout(this.displayTimer);
      this.displayTimer = null;
    }
    const g = this.trackGain;
    const ctx = this.ctx;
    this.trackGain = null;
    if (g && ctx) {
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(0, now, 0.06);
      window.setTimeout(() => g.disconnect(), 600);
    }
  }

  private startMusic(fromPos: number) {
    const ctx = this.ensure();
    if (!ctx || !this.musicBus) return false;
    this.stopMusicNodes();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.3);
    g.connect(this.musicBus);
    this.trackGain = g;
    const track = TRACKS[this.schedIndex];
    this.loopStart = ctx.currentTime + 0.12 - fromPos;
    const idx = track.events.findIndex((e) => e.t >= fromPos);
    this.evIdx = idx < 0 ? track.events.length : idx;
    this.tickMusic();
    this.musicTimer = window.setInterval(this.tickMusic, 250);
    return true;
  }

  private tickMusic = () => {
    const ctx = this.ctx;
    const dest = this.trackGain;
    if (!ctx || !dest) return;
    const horizon = ctx.currentTime + LOOKAHEAD;
    for (let guard = 0; guard < 600; guard++) {
      const track = TRACKS[this.schedIndex];
      if (this.evIdx >= track.events.length) {
        const end = this.loopStart + track.length;
        if (end > horizon) break;
        this.loopStart = end;
        this.evIdx = 0;
        if (!this.state.loopOne) {
          this.schedIndex = (this.schedIndex + 1) % TRACKS.length;
          const next = this.schedIndex;
          if (this.displayTimer !== null) window.clearTimeout(this.displayTimer);
          this.displayTimer = window.setTimeout(
            () => {
              this.displayTimer = null;
              this.patch({ trackIndex: next });
            },
            Math.max(0, (end - ctx.currentTime) * 1000),
          );
        }
        continue;
      }
      const ev = track.events[this.evIdx];
      const when = this.loopStart + ev.t;
      if (when > horizon) break;
      if (when > ctx.currentTime - 0.08) this.playNote(track.voice, ev, Math.max(when, ctx.currentTime), dest);
      this.evIdx++;
    }
  };

  playMusic() {
    if (this.state.musicOn) return;
    if (this.startMusic(this.pausedPos)) this.patch({ musicOn: true, trackIndex: this.schedIndex });
  }

  pauseMusic() {
    if (!this.state.musicOn) return;
    const ctx = this.ctx;
    if (ctx) {
      const pos = ctx.currentTime - this.loopStart;
      // If the scheduler has already moved on to the next pass, resume from its start.
      this.pausedPos = pos > 0 && pos < TRACKS[this.schedIndex].length ? pos : 0;
    }
    this.stopMusicNodes();
    this.patch({ musicOn: false, trackIndex: this.schedIndex });
    this.maybeSuspend();
  }

  toggleMusic() {
    if (this.state.musicOn) this.pauseMusic();
    else this.playMusic();
  }

  /** Choose a track. Starts it when `play` is true or music is already playing. */
  selectTrack(index: number, play = false) {
    const i = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
    this.loadPrefs();
    this.schedIndex = i;
    this.pausedPos = 0;
    if (play || this.state.musicOn) {
      if (this.startMusic(0)) this.patch({ trackIndex: i, musicOn: true });
      else this.patch({ trackIndex: i });
    } else {
      this.patch({ trackIndex: i });
    }
  }

  next() {
    this.selectTrack(this.state.trackIndex + 1);
  }

  prev() {
    this.selectTrack(this.state.trackIndex - 1);
  }

  setLoopOne(v: boolean) {
    this.patch({ loopOne: v });
  }

  setMusicVolume(v: number) {
    const vol = Math.min(1, Math.max(0, v));
    if (this.ctx && this.musicBus) this.musicBus.gain.setTargetAtTime(vol ** 2, this.ctx.currentTime, 0.05);
    this.patch({ musicVolume: vol });
  }

  /* ---- ambience ---- */

  private applyAmbience(timeConstant = 0.9) {
    const ctx = this.ctx;
    if (!ctx || !this.fireGain || !this.windGain || !this.chimeGain) return;
    const now = ctx.currentTime;
    this.fireGain.gain.setTargetAtTime(this.amb.fire * 0.9, now, timeConstant);
    this.windGain.gain.setTargetAtTime(this.amb.wind * 0.8, now, timeConstant);
    this.chimeGain.gain.setTargetAtTime(this.amb.chimes, now, timeConstant);
  }

  /** Cross-fade the ambience layers to a new mix (heard only while ambience is on). */
  setAmbience(a: Ambience) {
    this.amb = a;
    this.applyAmbience();
  }

  private tickAmbience = () => {
    const ctx = this.ctx;
    if (!ctx || !this.state.ambienceOn || !this.white || !this.fireGain || !this.chimeGain) return;
    const now = ctx.currentTime;
    const horizon = now + 1.6;
    if (this.nextCrackle < now) this.nextCrackle = now + 0.05;
    while (this.nextCrackle < horizon) {
      if (this.amb.fire > 0.02) {
        const t = this.nextCrackle;
        const dur = 0.008 + Math.random() * 0.05;
        const src = ctx.createBufferSource();
        src.buffer = this.white;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 700 + Math.random() * 4300;
        bp.Q.value = 1.5 + Math.random() * 3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.05 + Math.random() ** 3 * 0.85, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(bp).connect(g).connect(this.fireGain);
        src.start(t, Math.random() * 1.5, dur + 0.02);
      }
      this.nextCrackle += -Math.log(1 - Math.random()) / 8;
    }
    if (this.nextChime < now) this.nextChime = now + 1 + Math.random() * 3;
    while (this.nextChime < horizon) {
      if (this.amb.chimes > 0.02) {
        const midi = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
        this.playNote(
          "bells",
          { t: 0, midi, dur: 2.2, vel: 0.05 + Math.random() * 0.06, part: "lead" },
          this.nextChime,
          this.chimeGain,
        );
      }
      this.nextChime += 1.5 + Math.random() * 6;
    }
  };

  setAmbienceOn(on: boolean) {
    if (on) {
      const ctx = this.ensure();
      if (!ctx || !this.ambBus) return;
      this.ambBus.gain.setTargetAtTime(this.state.ambienceVolume ** 2, ctx.currentTime, 0.5);
      this.patch({ ambienceOn: true });
      this.applyAmbience(0.3);
      this.tickAmbience();
      if (this.ambTimer === null) this.ambTimer = window.setInterval(this.tickAmbience, 400);
    } else {
      if (this.ctx && this.ambBus) this.ambBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      if (this.ambTimer !== null) {
        window.clearInterval(this.ambTimer);
        this.ambTimer = null;
      }
      this.patch({ ambienceOn: false });
      this.maybeSuspend();
    }
  }

  setAmbienceVolume(v: number) {
    const vol = Math.min(1, Math.max(0, v));
    if (this.ctx && this.ambBus && this.state.ambienceOn) {
      this.ambBus.gain.setTargetAtTime(vol ** 2, this.ctx.currentTime, 0.05);
    }
    this.patch({ ambienceVolume: vol });
  }

  /** One switch for "sound on / off" used by the dashboard and header. */
  setAllSound(on: boolean) {
    if (on) {
      this.setAmbienceOn(true);
      this.playMusic();
    } else {
      this.pauseMusic();
      this.setAmbienceOn(false);
    }
  }

  /** For diagnostics and tests. */
  debug() {
    return { context: this.ctx?.state ?? "none", time: this.ctx?.currentTime ?? 0, scheduled: this.evIdx };
  }
}

export const audio = new AudioEngine();

export function useAudio(): AudioState {
  return useSyncExternalStore(audio.subscribe, audio.getState, audio.getServerState);
}

if (typeof window !== "undefined") {
  (window as unknown as { __cwAudio?: AudioEngine }).__cwAudio = audio;
}
