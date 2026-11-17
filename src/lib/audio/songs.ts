import type { Bi } from "../i18n";

/**
 * Every piece of music in Christmas Wonderland is synthesised in the browser.
 * The carols are traditional melodies in the public domain, arranged here as
 * note data; the two "original" pieces are generated from a seeded pattern.
 * No recordings are shipped, so there is nothing to license.
 */

export type VoiceId = "musicbox" | "bells" | "celesta";
export type Part = "lead" | "bass" | "harp";

export interface NoteEvent {
  t: number;
  midi: number;
  dur: number;
  vel: number;
  part: Part;
}

export interface Track {
  id: string;
  title: Bi;
  credit: Bi;
  mood: Bi;
  voice: VoiceId;
  events: NoteEvent[];
  /** Seconds, including a short breath before the next pass. */
  length: number;
}

interface SongDef {
  id: string;
  title: Bi;
  credit: Bi;
  mood: Bi;
  voice: VoiceId;
  /** Seconds per rhythmic unit. */
  unit: number;
  unitsPerBar: number;
  unitsPerBeat: number;
  pickup: number;
  transpose: number;
  melody: string;
  chords: string;
  repeat?: number;
}

const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parseMelody(src: string): { midi: number | null; units: number }[] {
  return src
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [name, len] = tok.split(":");
      const units = Number(len);
      if (name === "R") return { midi: null, units };
      const m = /^([A-G])(#|b)?(\d)$/.exec(name);
      if (!m || !Number.isFinite(units)) throw new Error(`Bad note token: ${tok}`);
      const midi = 12 * (Number(m[3]) + 1) + PITCH[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
      return { midi, units };
    });
}

function parseChord(name: string): { root: number; minor: boolean } {
  const m = /^([A-G])(#|b)?(m)?$/.exec(name);
  if (!m) throw new Error(`Bad chord: ${name}`);
  return { root: PITCH[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0), minor: Boolean(m[3]) };
}

function buildTrack(def: SongDef): Track {
  const notes = parseMelody(def.melody);
  const bars = def.chords.trim().split(/\s+/);
  const events: NoteEvent[] = [];
  const totalUnits = notes.reduce((n, x) => n + x.units, 0);
  const passUnits = Math.max(totalUnits, def.pickup + bars.length * def.unitsPerBar);
  const repeat = def.repeat ?? 1;

  for (let pass = 0; pass < repeat; pass++) {
    const base = pass * (passUnits + def.unitsPerBar - def.pickup) * def.unit;

    // Melody
    let u = 0;
    for (const n of notes) {
      if (n.midi !== null) {
        const onBar = (u - def.pickup) % def.unitsPerBar === 0;
        events.push({
          t: base + u * def.unit,
          midi: n.midi + def.transpose,
          dur: n.units * def.unit,
          vel: onBar ? 0.5 : 0.42,
          part: "lead",
        });
      }
      u += n.units;
    }

    // Accompaniment: a soft bass note per chord, with a gentle broken chord on the other beats.
    const beats = def.unitsPerBar / def.unitsPerBeat;
    bars.forEach((bar, b) => {
      const parts = bar.split("|").map(parseChord);
      for (let beat = 0; beat < beats; beat++) {
        const seg = Math.min(parts.length - 1, Math.floor((beat / beats) * parts.length));
        const chord = parts[seg];
        const segStartBeat = Math.ceil((seg * beats) / parts.length);
        const t = base + (def.pickup + b * def.unitsPerBar + beat * def.unitsPerBeat) * def.unit;
        const root = 43 + ((chord.root + def.transpose - 7 + 120) % 12);
        if (beat === segStartBeat) {
          events.push({
            t,
            midi: root,
            dur: ((beats / parts.length) * def.unitsPerBeat * def.unit),
            vel: 0.3,
            part: "bass",
          });
        } else {
          const tones = [root + 12 + (chord.minor ? 3 : 4), root + 12 + 7, root + 24];
          events.push({
            t,
            midi: tones[(beat - segStartBeat - 1 + 3) % 3],
            dur: def.unitsPerBeat * def.unit,
            vel: 0.13,
            part: "harp",
          });
        }
      }
    });
  }

  events.sort((a, b) => a.t - b.t);
  const length = repeat * (passUnits + def.unitsPerBar - def.pickup) * def.unit + 1.2;
  return { id: def.id, title: def.title, credit: def.credit, mood: def.mood, voice: def.voice, events, length };
}

/* ---- Seeded generator for the two original pieces --------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function noteName(midi: number): string {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/** Wandering pentatonic melody: deterministic for a given seed, so it loops like a composed piece. */
function generateMelody(seed: number, scale: number[], bars: number, start: number): string {
  const rand = mulberry32(seed);
  const rhythms = [[4, 4], [2, 2, 4], [3, 1, 4], [4, 2, 2], [6, 2], [2, 2, 2, 2], [8], [4, 4]];
  let idx = start;
  const out: string[] = [];
  for (let b = 0; b < bars; b++) {
    const last = b === bars - 1;
    const rhythm = last ? [8] : b % 4 === 3 ? [4, 4] : rhythms[Math.floor(rand() * rhythms.length)];
    for (const len of rhythm) {
      if (last) idx = start;
      else {
        const step = Math.floor(rand() * 5) - 2;
        idx = Math.min(scale.length - 1, Math.max(0, idx + (step === 0 ? 1 : step)));
      }
      // The occasional rest lets the piece breathe.
      if (!last && len <= 2 && rand() < 0.14) out.push(`R:${len}`);
      else out.push(`${noteName(scale[idx])}:${len}`);
    }
  }
  return out.join(" ");
}

const TRADITIONAL: Bi = ["Traditional carol · public domain · synthesised arrangement", "傳統頌歌・公有領域・合成編曲"];
const ORIGINAL: Bi = ["Original piece · generated in your browser", "原創曲・由瀏覽器即時生成"];

const SONGS: SongDef[] = [
  {
    id: "silent-night",
    title: ["Silent Night", "平安夜"],
    credit: TRADITIONAL,
    mood: ["Music box · gentle", "音樂盒・溫柔"],
    voice: "musicbox",
    unit: 0.36,
    unitsPerBar: 6,
    unitsPerBeat: 2,
    pickup: 0,
    transpose: -2,
    melody:
      "G4:3 A4:1 G4:2 E4:6 G4:3 A4:1 G4:2 E4:6 D5:4 D5:2 B4:6 C5:4 C5:2 G4:6 " +
      "A4:4 A4:2 C5:3 B4:1 A4:2 G4:3 A4:1 G4:2 E4:6 A4:4 A4:2 C5:3 B4:1 A4:2 G4:3 A4:1 G4:2 E4:6 " +
      "D5:4 D5:2 F5:3 D5:1 B4:2 C5:6 E5:6 C5:2 G4:2 E4:2 G4:3 F4:1 D4:2 C4:12",
    chords: "C C C C G G C C F F C C F F C C G G C C C G C C",
  },
  {
    id: "first-snow",
    title: ["First Snow", "初雪"],
    credit: ORIGINAL,
    mood: ["Celesta · calm morning", "鋼片琴・寧靜早晨"],
    voice: "celesta",
    unit: 0.31,
    unitsPerBar: 8,
    unitsPerBeat: 2,
    pickup: 0,
    transpose: 0,
    melody: generateMelody(1225, [67, 69, 72, 74, 76, 79, 81, 84], 16, 2),
    chords: "C Am F G C Am F G C Am F G F G C C",
  },
  {
    id: "o-christmas-tree",
    title: ["O Christmas Tree", "聖誕樹"],
    credit: TRADITIONAL,
    mood: ["Celesta · warm", "鋼片琴・溫暖"],
    voice: "celesta",
    unit: 0.165,
    unitsPerBar: 12,
    unitsPerBeat: 4,
    pickup: 4,
    transpose: -3,
    melody:
      "G4:4 C5:3 C5:1 C5:6 D5:2 E5:3 E5:1 E5:6 E5:2 D5:2 E5:2 F5:4 B4:4 D5:4 C5:4 " +
      "G4:4 C5:3 C5:1 C5:6 D5:2 E5:3 E5:1 E5:6 E5:2 D5:2 E5:2 F5:4 B4:4 D5:4 C5:4 " +
      "R:2 G5:2 G5:2 E5:2 A5:6 G5:2 G5:3 F5:1 F5:6 F5:2 F5:2 D5:2 G5:6 F5:2 F5:3 E5:1 E5:4 " +
      "G4:4 C5:3 C5:1 C5:6 D5:2 E5:3 E5:1 E5:6 E5:2 D5:2 E5:2 F5:4 B4:4 D5:4 C5:8",
    chords: "C C Dm|G C C C Dm|G C C Dm G C C C Dm|G C",
    repeat: 2,
  },
  {
    id: "jingle-bells",
    title: ["Jingle Bells", "聖誕鈴聲"],
    credit: TRADITIONAL,
    mood: ["Bells · bright", "鈴聲・明亮"],
    voice: "bells",
    unit: 0.175,
    unitsPerBar: 8,
    unitsPerBeat: 2,
    pickup: 0,
    transpose: -5,
    melody:
      "G4:2 E5:2 D5:2 C5:2 G4:6 G4:1 G4:1 G4:2 E5:2 D5:2 C5:2 A4:8 A4:2 F5:2 E5:2 D5:2 B4:8 G5:2 G5:2 F5:2 D5:2 E5:8 " +
      "G4:2 E5:2 D5:2 C5:2 G4:8 G4:2 E5:2 D5:2 C5:2 A4:6 A4:2 A4:2 F5:2 E5:2 D5:2 G5:2 G5:2 G5:2 G5:2 A5:2 G5:2 F5:2 D5:2 C5:4 G5:4 " +
      "E5:2 E5:2 E5:4 E5:2 E5:2 E5:4 E5:2 G5:2 C5:3 D5:1 E5:8 F5:2 F5:2 F5:3 F5:1 F5:2 E5:2 E5:2 E5:1 E5:1 E5:2 D5:2 D5:2 E5:2 D5:4 G5:4 " +
      "E5:2 E5:2 E5:4 E5:2 E5:2 E5:4 E5:2 G5:2 C5:3 D5:1 E5:8 F5:2 F5:2 F5:3 F5:1 F5:2 E5:2 E5:2 E5:1 E5:1 G5:2 G5:2 F5:2 D5:2 C5:8",
    chords: "C C C F F G G C C C C F F G G C C C C C F C D G C C C C F C G C",
  },
  {
    id: "deck-the-halls",
    title: ["Deck the Halls", "裝飾大廳"],
    credit: TRADITIONAL,
    mood: ["Celesta · cheerful", "鋼片琴・歡樂"],
    voice: "celesta",
    unit: 0.225,
    unitsPerBar: 8,
    unitsPerBeat: 2,
    pickup: 0,
    transpose: 5,
    melody:
      "G4:3 F4:1 E4:2 D4:2 C4:2 D4:2 E4:2 C4:2 D4:1 E4:1 F4:1 D4:1 E4:3 D4:1 C4:2 B3:2 C4:4 " +
      "G4:3 F4:1 E4:2 D4:2 C4:2 D4:2 E4:2 C4:2 D4:1 E4:1 F4:1 D4:1 E4:3 D4:1 C4:2 B3:2 C4:4 " +
      "D4:3 E4:1 F4:2 D4:2 E4:3 F4:1 G4:2 D4:2 E4:1 F#4:1 G4:2 A4:1 B4:1 C5:2 B4:2 A4:2 G4:4 " +
      "G4:3 F4:1 E4:2 D4:2 C4:2 D4:2 E4:2 C4:2 A4:1 A4:1 A4:1 A4:1 G4:3 F4:1 E4:2 D4:2 C4:4",
    chords: "C C G G|C C C G G|C G C D G C C F C",
    repeat: 2,
  },
  {
    id: "we-wish-you",
    title: ["We Wish You a Merry Christmas", "祝你聖誕快樂"],
    credit: TRADITIONAL,
    mood: ["Bells · festive", "鈴聲・節慶"],
    voice: "bells",
    unit: 0.2,
    unitsPerBar: 6,
    unitsPerBeat: 2,
    pickup: 2,
    transpose: 2,
    melody:
      "G4:2 C5:2 C5:1 D5:1 C5:1 B4:1 A4:2 A4:2 A4:2 D5:2 D5:1 E5:1 D5:1 C5:1 B4:2 G4:2 G4:2 " +
      "E5:2 E5:1 F5:1 E5:1 D5:1 C5:2 A4:2 G4:1 G4:1 A4:2 D5:2 B4:2 C5:4 " +
      "G4:2 C5:2 C5:2 C5:2 B4:4 B4:2 C5:2 B4:2 A4:2 G4:4 D5:2 E5:2 D5:2 C5:2 G5:2 G4:2 G4:1 G4:1 A4:2 D5:2 B4:2 C5:4 " +
      "G4:2 C5:2 C5:1 D5:1 C5:1 B4:1 A4:2 A4:2 A4:2 D5:2 D5:1 E5:1 D5:1 C5:1 B4:2 G4:2 G4:2 " +
      "E5:2 E5:1 F5:1 E5:1 D5:1 C5:2 A4:2 G4:1 G4:1 A4:2 D5:2 B4:2 C5:6",
    chords: "C F D G E Am G C C G Am G C C G C C F D G E Am G C",
  },
  {
    id: "hearthside",
    title: ["Hearthside", "爐邊"],
    credit: ORIGINAL,
    mood: ["Music box · late evening", "音樂盒・深夜"],
    voice: "musicbox",
    unit: 0.35,
    unitsPerBar: 8,
    unitsPerBeat: 2,
    pickup: 0,
    transpose: 0,
    melody: generateMelody(2026, [64, 67, 69, 72, 74, 76, 79], 16, 2),
    chords: "Am F C G Am F C G Am F C G F G Am Am",
  },
];

export const TRACKS: Track[] = SONGS.map(buildTrack);

export function trackIndexById(id: string): number {
  const i = TRACKS.findIndex((t) => t.id === id);
  return i < 0 ? 0 : i;
}
