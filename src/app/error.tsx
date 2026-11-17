"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-2xl flex-col items-start justify-center px-6 pt-24 pb-16">
      <p className="eyebrow text-accent">Something went wrong · 發生了一點問題</p>
      <h1 className="display mt-4 text-[clamp(2.25rem,6vw,4rem)] leading-none font-light">
        A bauble fell off the <em className="text-accent">tree</em>
      </h1>
      <p className="mt-5 text-lg text-muted">
        This part of the house couldn&rsquo;t be shown. Your saved notes, photos and settings are safe on this device.
        <br />
        這個頁面暫時無法顯示。你儲存的留言、照片和設定都還安全地留在這台裝置上。
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-on-accent hover:brightness-110"
        >
          Try again · 再試一次
        </button>
        {/* A full page load on purpose: it resets any broken client state. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="inline-flex min-h-11 items-center rounded-full border border-line px-6 text-sm font-medium">
          Back home · 回首頁
        </a>
      </div>
    </div>
  );
}
