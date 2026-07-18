import { useMemo } from "react";
import { generateDailyNews } from "../lib/news";
import type { Tone } from "../lib/news";

const TONE_STYLES: Record<Tone, string> = {
  positive: "text-forest-700 bg-forest-50 border-forest-200",
  neutral: "text-ink-600 bg-ink-100 border-ink-200",
  negative: "text-rust-700 bg-rust-50 border-rust-200",
};

export function NewsPage() {
  const news = useMemo(() => generateDailyNews(), []);

  return (
    <div className="min-h-screen bg-ink-50 pb-8">
      <header className="bg-ink-950 px-6 pb-6 pt-8 text-white">
        <p className="label-caps text-white/50">Daily briefing</p>
        <h1 className="mt-1 font-display text-2xl text-white">StackMarket News</h1>
        <p className="mt-1.5 text-sm text-white/60">
          What moved today, why it might have happened, and how to think about it.
        </p>
      </header>

      <div className="border-b border-ink-200 bg-white px-5 py-2.5 text-center text-xs text-ink-500">
        Practice-market analysis for your StackMarket portfolio — not real markets, not real financial advice.
      </div>

      <main className="px-5 pt-6">
        <div className="flex flex-col gap-3">
          {news.map((item) => (
            <div key={item.id} className={`card p-4 ${item.kind === "tip" ? "border-ochre-200 bg-ochre-50" : ""}`}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                {item.kind === "tip" ? (
                  <p className="label-caps text-ochre-600">Money tip</p>
                ) : (
                  <p className="label-caps text-ink-500">{item.symbol}</p>
                )}
                {item.verdict && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TONE_STYLES[item.tone ?? "neutral"]}`}>
                    {item.verdict}
                  </span>
                )}
              </div>
              <p className="font-display text-lg text-ink-900">{item.headline}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          Every ticker, headline, and "verdict" above is generated for the StackUp simulator only — none of it
          describes real companies or real markets, and none of it is financial advice.
        </p>
      </main>
    </div>
  );
}
