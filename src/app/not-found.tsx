import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-2xl flex-col items-start justify-center px-6 pt-24 pb-16">
      <p className="eyebrow text-accent">404 · 找不到頁面</p>
      <h1 className="display mt-4 text-[clamp(2.5rem,7vw,4.5rem)] leading-none font-light">
        This path is <em className="text-accent">snowed in</em>
      </h1>
      <p className="mt-5 text-lg text-muted">
        The page you were looking for isn&rsquo;t here. The fire is still lit back at the house.
        <br />
        這個頁面被雪蓋住了，回到溫暖的家吧。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-on-accent hover:brightness-110"
      >
        Back home · 回首頁
      </Link>
    </div>
  );
}
