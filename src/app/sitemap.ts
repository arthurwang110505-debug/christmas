import type { MetadataRoute } from "next";

const BASE = "https://christmas-home.vercel.app";
const ROUTES = ["", "/ambient", "/tv", "/advent", "/wall", "/santa", "/music", "/wallpapers"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-17");
  return ROUTES.map((path) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
