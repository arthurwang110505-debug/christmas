"use client";

import { useEffect, useRef } from "react";

interface P {
  x: number;
  y: number;
  r: number;
  v: number;
  a: number;
  phase: number;
  sway: number;
}

/**
 * Canvas snowfall (or drifting firelight motes). Pauses when the tab is hidden,
 * caps device-pixel-ratio for TVs and tablets, and stays off entirely when the
 * visitor prefers reduced motion.
 */
export function Particles({ kind = "snow", density = 1 }: { kind?: "snow" | "motes"; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let items: P[] = [];
    const snow = kind === "snow";

    const make = (anywhere: boolean): P => {
      const r = snow ? 0.7 + Math.random() ** 2.2 * 2.6 : 0.6 + Math.random() * 1.3;
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : snow ? -6 : h + 6,
        r,
        v: snow ? 16 + r * 20 + Math.random() * 10 : 5 + Math.random() * 14,
        a: snow ? 0.35 + Math.random() * 0.55 : 0.25 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        sway: 6 + Math.random() * 16,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const per = snow ? 15000 : 42000;
      const count = Math.max(10, Math.min(190, Math.round(((w * h) / per) * density)));
      while (items.length < count) items.push(make(true));
      items = items.slice(0, count);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = snow ? "#ffffff" : "#ffcf8f";
      for (let i = 0; i < items.length; i++) {
        const p = items[i];
        p.phase += dt * (snow ? 0.8 : 0.5);
        p.y += (snow ? p.v : -p.v) * dt;
        const x = p.x + Math.sin(p.phase) * p.sway + (snow ? (p.y / h) * 24 : 0);
        if (snow ? p.y > h + 8 : p.y < -8) {
          items[i] = make(false);
          continue;
        }
        ctx.globalAlpha = snow ? p.a : p.a * (0.55 + 0.45 * Math.sin(p.phase * 3));
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (document.visibilityState === "visible") {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [kind, density]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
