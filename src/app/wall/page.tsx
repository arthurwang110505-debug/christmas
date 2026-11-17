import type { Metadata } from "next";
import { FamilyWall } from "@/components/FamilyWall";

export const metadata: Metadata = { title: "Family Wall" };

export default function WallPage() {
  return <FamilyWall />;
}
