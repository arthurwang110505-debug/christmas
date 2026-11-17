import type { Metadata } from "next";
import { AmbientPlayer } from "@/components/AmbientPlayer";

export const metadata: Metadata = { title: "Ambient Player" };

export default function AmbientPage() {
  return <AmbientPlayer />;
}
