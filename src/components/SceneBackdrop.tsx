"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useReduce } from "@/lib/hooks";
import type { ParticleKind } from "@/lib/scenes";
import { Particles } from "./Particles";

/**
 * A living scene: photograph with slow drift, cross-fade between scenes,
 * optional firelight flicker and a particle layer on top.
 */
export function SceneBackdrop({
  image,
  particles,
  density = 1,
  firelight = false,
  priority = false,
}: {
  image: string;
  particles: ParticleKind;
  density?: number;
  firelight?: boolean;
  priority?: boolean;
}) {
  const reduce = useReduce();
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-night">
      <AnimatePresence initial={false}>
        <motion.div
          key={image}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduce ? 0 : 1.4, delay: reduce ? 0 : 0.5 } }}
          transition={{ duration: reduce ? 0 : 1.6, ease: "easeInOut" }}
        >
          <Image src={image} alt="" fill priority={priority} sizes="100vw" className="kenburns object-cover" />
        </motion.div>
      </AnimatePresence>
      {firelight && <div className="firelight absolute inset-0" />}
      {particles !== "none" && <Particles key={particles} kind={particles} density={density} />}
    </div>
  );
}
