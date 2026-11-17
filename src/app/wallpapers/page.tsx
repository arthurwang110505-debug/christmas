import type { Metadata } from "next";
import { WallpaperStudio } from "@/components/WallpaperStudio";

export const metadata: Metadata = { title: "Wallpapers & Cards" };

export default function Page() {
  return <WallpaperStudio />;
}
