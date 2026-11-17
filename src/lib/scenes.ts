import type { Bi } from "./i18n";

export type ModeId = "morning" | "afternoon" | "evening" | "eve";
export type SceneId = "fireplace" | "village" | "forest" | "cabin" | "window";
export type ParticleKind = "snow" | "motes" | "none";

/** Levels (0–1) for the three synthesised ambience layers. */
export interface Ambience {
  fire: number;
  wind: number;
  chimes: number;
}

export interface Scene {
  id: SceneId;
  image: string;
  name: Bi;
  blurb: Bi;
  sound: Bi;
  particles: ParticleKind;
  density: number;
  firelight: boolean;
  ambience: Ambience;
}

export const SCENES: Record<SceneId, Scene> = {
  fireplace: {
    id: "fireplace",
    image: "/scenes/fireplace.jpg",
    name: ["Cozy Fireplace", "溫暖壁爐"],
    blurb: ["Logs crackling under a garland of lights.", "燈串花環下，柴火劈啪作響。"],
    sound: ["Crackling fire", "柴火聲"],
    particles: "motes",
    density: 0.5,
    firelight: true,
    ambience: { fire: 1, wind: 0.08, chimes: 0 },
  },
  village: {
    id: "village",
    image: "/scenes/village.jpg",
    name: ["Snowy Christmas Village", "雪中聖誕小鎮"],
    blurb: ["Golden windows beneath the mountains.", "群山之下，窗裡透出金色的光。"],
    sound: ["Soft wind and distant chimes", "微風與遠方鈴聲"],
    particles: "snow",
    density: 1,
    firelight: false,
    ambience: { fire: 0, wind: 0.55, chimes: 0.8 },
  },
  forest: {
    id: "forest",
    image: "/scenes/forest.jpg",
    name: ["Winter Forest", "冬日森林"],
    blurb: ["One small tree, lit for whoever passes.", "一棵小樹，為每個路過的人點亮。"],
    sound: ["Wind through the pines", "松林風聲"],
    particles: "snow",
    density: 1.4,
    firelight: false,
    ambience: { fire: 0, wind: 1, chimes: 0.15 },
  },
  cabin: {
    id: "cabin",
    image: "/scenes/cabin.jpg",
    name: ["Christmas Cabin", "聖誕小木屋"],
    blurb: ["Smoke from the chimney, lanterns on the steps.", "煙囪冒著煙，台階上點著提燈。"],
    sound: ["Night wind and a fire indoors", "夜風與屋內爐火"],
    particles: "snow",
    density: 0.8,
    firelight: false,
    ambience: { fire: 0.35, wind: 0.6, chimes: 0.2 },
  },
  window: {
    id: "window",
    image: "/scenes/window.jpg",
    name: ["Snowfall Window", "窗外飄雪"],
    blurb: ["Candles on the sill, snow on the glass.", "窗台上的燭光，玻璃外的雪。"],
    sound: ["Hushed snowfall", "靜謐雪聲"],
    particles: "snow",
    density: 0.7,
    firelight: false,
    ambience: { fire: 0.12, wind: 0.4, chimes: 0 },
  },
};

export const SCENE_ORDER: SceneId[] = ["fireplace", "village", "forest", "cabin", "window"];

export interface Mode {
  id: ModeId;
  name: Bi;
  tagline: Bi;
  image: string;
  particles: ParticleKind;
  density: number;
  firelight: boolean;
  ambience: Ambience;
  /** Track cued when this atmosphere is chosen. */
  track: string;
}

export const MODES: Record<ModeId, Mode> = {
  morning: {
    id: "morning",
    name: ["Morning Christmas", "聖誕早晨"],
    tagline: ["Soft golden light, calm music", "柔和晨光・寧靜音樂"],
    image: "/scenes/morning.jpg",
    particles: "snow",
    density: 0.45,
    firelight: false,
    ambience: { fire: 0, wind: 0.3, chimes: 0.5 },
    track: "first-snow",
  },
  afternoon: {
    id: "afternoon",
    name: ["Cozy Afternoon", "溫馨午後"],
    tagline: ["Warm fireplace, soft snowfall", "溫暖壁爐・輕輕飄雪"],
    image: "/scenes/fireplace.jpg",
    particles: "snow",
    density: 0.4,
    firelight: true,
    ambience: { fire: 0.9, wind: 0.15, chimes: 0 },
    track: "o-christmas-tree",
  },
  evening: {
    id: "evening",
    name: ["Christmas Evening", "聖誕夜晚"],
    tagline: ["Forest green, golden lights", "森林綠・金色燈火"],
    image: "/scenes/cabin.jpg",
    particles: "snow",
    density: 0.8,
    firelight: false,
    ambience: { fire: 0.7, wind: 0.35, chimes: 0.1 },
    track: "silent-night",
  },
  eve: {
    id: "eve",
    name: ["Christmas Eve", "平安夜"],
    tagline: ["A cinematic night, festive music", "電影般的夜晚・節慶音樂"],
    image: "/scenes/village.jpg",
    particles: "snow",
    density: 1.1,
    firelight: false,
    ambience: { fire: 0.25, wind: 0.4, chimes: 0.9 },
    track: "we-wish-you",
  },
};

export const MODE_ORDER: ModeId[] = ["morning", "afternoon", "evening", "eve"];
