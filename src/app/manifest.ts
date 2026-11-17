import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Christmas Wonderland 2026",
    short_name: "Wonderland",
    description: "The digital heart of a cozy Christmas home.",
    start_url: "/",
    display: "standalone",
    background_color: "#101a17",
    theme_color: "#101a17",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
