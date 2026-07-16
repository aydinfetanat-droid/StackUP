import { useMemo } from "react";
import { generateDailyNews } from "../lib/news";

export function NewsPage() {
  const news = useMemo(() => generateDailyNews(), []);

  return (
    <div className="min-h-screen bg-ink-100 pb-8">
      <header className="bg-brand-600 px-6 pb-6 pt-8 text-white">
        <h1 className="text-2xl font-extrabold">StackMarket News</h1>
        <p className="mt-1 text-sm text-brand-100">What moved today, in plain English.</p>
      </header>

      <main className="px-5 pt-6">
        <div className="flex flex-col gap-3">
          {news.map((item) => (
            <div key={item.id} className="rounded-2xl border border-ink-300 bg-white p-4">
              {item.kind === "tip" ? (
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">Money Tip</p>
              ) : (
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-500">{item.symbol}</p>
              )}
              <p className="font-bold text-ink-900">{item.headline}</p>
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
