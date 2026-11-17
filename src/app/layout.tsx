import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: { default: "Christmas Wonderland 2026", template: "%s · Christmas Wonderland 2026" },
  description:
    "The digital heart of a cozy Christmas home: countdown, ambient scenes with sound, an Advent calendar, a family wall and letters from Santa.",
  appleWebApp: { capable: true, title: "Wonderland", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101a17",
};

// Runs before first paint so the saved atmosphere and language never flash.
const bootScript = `(function(){try{var s=JSON.parse(localStorage.getItem('cw26:settings')||'{}');var m=s.mode;var d=new Date();if(['morning','afternoon','evening','eve'].indexOf(m)<0){var h=d.getHours();m=(d.getMonth()===11&&d.getDate()===24)?'eve':(h>=5&&h<12)?'morning':(h>=12&&h<17)?'afternoon':'evening';}var r=document.documentElement;r.dataset.mode=m;if(s.lang==='zh'||(!s.lang&&/^zh/i.test(navigator.language||'')))r.lang='zh-Hant';}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <noscript>
          <style>{`.app-fade{opacity:1 !important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
