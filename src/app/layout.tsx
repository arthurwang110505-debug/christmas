import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://christmas-home.vercel.app"),
  title: { default: "Christmas Wonderland 2026", template: "%s · Christmas Wonderland 2026" },
  description:
    "The digital heart of a cozy Christmas home: countdown, ambient scenes with sound, an Advent calendar, a family wall and letters from Santa.",
  appleWebApp: { capable: true, title: "Wonderland", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Christmas Wonderland 2026",
    description:
      "The digital heart of a cozy Christmas home: countdown, ambient scenes with sound, an Advent calendar, a family wall and letters from Santa.",
    url: "/",
    siteName: "Christmas Wonderland 2026",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "A snowy alpine village glowing with Christmas lights" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Christmas Wonderland 2026",
    description:
      "The digital heart of a cozy Christmas home: countdown, ambient scenes with sound, an Advent calendar, a family wall and letters from Santa.",
    images: ["/og.jpg"],
  },
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
