import type { Metadata } from "next";
import { Santa } from "@/components/Santa";

export const metadata: Metadata = { title: "Talk to Santa" };

export default function Page() {
  return <Santa />;
}
