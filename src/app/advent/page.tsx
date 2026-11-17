import type { Metadata } from "next";
import { AdventCalendar } from "@/components/AdventCalendar";

export const metadata: Metadata = { title: "Advent Calendar" };

export default function AdventPage() {
  return <AdventCalendar />;
}
