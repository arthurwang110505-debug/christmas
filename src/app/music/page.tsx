import type { Metadata } from "next";
import { MusicPlayer } from "@/components/MusicPlayer";

export const metadata: Metadata = { title: "Christmas Music" };

export default function Page() {
  return <MusicPlayer />;
}
