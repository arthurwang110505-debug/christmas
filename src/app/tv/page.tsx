import type { Metadata } from "next";
import { AmbientPlayer } from "@/components/AmbientPlayer";

export const metadata: Metadata = { title: "TV mode" };

export default function TvPage() {
  return <AmbientPlayer tv />;
}
