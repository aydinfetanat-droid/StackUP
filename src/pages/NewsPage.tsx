import { useMemo } from "react";
import { generateDailyNews } from "../lib/news";

export function NewsPage() {
  const news = useMemo(() => generateDailyNews(), []);

  return (
    <div className="min-h-screen bg-ink-100 pb-8">
      <header className="relative overflow-hidden bg-gradient-to-br from-ink-700 via-ink-900 to-black px-6 pb-6 pt-8 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gold-400/20 blur-2xl" />
        <p className="relative text-xs font-extrabold uppercase tracking-widest text-gold-400">Daily Briefing</p>
        <h1 className="relative mt-1 text-2xl font-extrabold">StackMarket News</h1>
        <p className="relative mt-1 text-sm font-semibold text-white/70">What moved today, in plain English.</p>
      </header>

      <main className="px-5 pt-6">
        <div className="flex flex-col gap-3">
          {news.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border-2 p-4 shadow-sm ${
                item.kind === "tip" ? "border-gold-200 bg-gold-50" : "border-ink-100 bg-white"
              }`}
            >
              {item.kind === "tip" ? (
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-gold-600">💡 Money Tip</p>
              ) : (
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-sky-600">{item.symbol}</p>
              )}
              <p className="font-extrabold text-ink-900">{item.headline}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          All tickers and news here are simulated for practice — not real markets, not real advice.
        </p>
      </main>
    </div>
  );
}
