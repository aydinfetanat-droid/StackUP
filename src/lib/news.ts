import { TICKERS, INDEX_SYMBOL, INDEX_NAME, priceOnDate } from "./market";
import { toLaDateString } from "./streak";

export interface NewsItem {
  id: string;
  headline: string;
  body: string;
  symbol?: string;
  kind: "market" | "tip";
}

const BIG_GAIN = [
  (name: string) => `${name} surges on strong demand`,
  (name: string) => `${name} jumps as investors pile in`,
];
const SMALL_GAIN = [
  (name: string) => `${name} edges higher in quiet trading`,
  (name: string) => `${name} ticks up slightly today`,
];
const FLAT = [
  (name: string) => `${name} holds steady`,
  (name: string) => `${name} barely moves today`,
];
const SMALL_LOSS = [
  (name: string) => `${name} dips slightly amid quiet trading`,
  (name: string) => `${name} slips a little today`,
];
const BIG_LOSS = [
  (name: string) => `${name} tumbles on heavy selling`,
  (name: string) => `${name} drops sharply today`,
];

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function bodyForChange(name: string, changePercent: number): string {
  const abs = Math.abs(changePercent).toFixed(2);
  if (changePercent >= 0) {
    return `${name} moved up ${abs}% today. Remember: a single day's move doesn't tell you much on its own — it's the pattern over weeks and months that matters.`;
  }
  return `${name} moved down ${abs}% today. Dips happen to every stock sometimes, even good companies — that's exactly why diversification and a long time horizon matter.`;
}

const TIPS: { headline: string; body: string }[] = [
  {
    headline: "Reminder: the index fund exists to smooth out days like this",
    body: "When individual tickers swing hard in either direction, a diversified index fund is designed to move less — that's the whole point of not betting on just one company.",
  },
  {
    headline: "Time in the market usually beats timing the market",
    body: "Trying to guess the exact best day to buy or sell is really hard, even for professionals. A steady, long-term approach tends to outperform frantic day-to-day trading.",
  },
  {
    headline: "Volatility isn't the same as risk of losing everything",
    body: "A stock bouncing around day to day is normal. What matters more for real risk is whether you're diversified and whether you can stay invested for the long haul without panic-selling.",
  },
  {
    headline: "Fees quietly eat returns over time",
    body: "A fund charging 1% a year versus 0.05% might not sound like much, but compounded over decades, it can cost you a huge chunk of your final balance. Always check the expense ratio.",
  },
];

function dayChangePercent(symbol: string, laDate: string): number {
  const yesterday = new Date(laDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const y = toLaDateString(yesterday);
  const today = priceOnDate(symbol, laDate);
  const prev = priceOnDate(symbol, y);
  return ((today - prev) / prev) * 100;
}

export function generateDailyNews(): NewsItem[] {
  const today = toLaDateString(new Date());
  const items: NewsItem[] = [];

  const instruments = [{ symbol: INDEX_SYMBOL, name: INDEX_NAME }, ...TICKERS.map((t) => ({ symbol: t.symbol, name: t.name }))];

  for (const inst of instruments) {
    const change = dayChangePercent(inst.symbol, today);
    let templates: ((name: string) => string)[];
    if (change >= 2) templates = BIG_GAIN;
    else if (change >= 0.3) templates = SMALL_GAIN;
    else if (change > -0.3) templates = FLAT;
    else if (change > -2) templates = SMALL_LOSS;
    else templates = BIG_LOSS;

    const headlineFn = pick(templates, `${inst.symbol}:${today}`);
    items.push({
      id: `${inst.symbol}-${today}`,
      headline: headlineFn(inst.name),
      body: bodyForChange(inst.name, change),
      symbol: inst.symbol,
      kind: "market",
    });
  }

  items.sort((a, b) => {
    const ca = a.symbol ? Math.abs(dayChangePercent(a.symbol, today)) : 0;
    const cb = b.symbol ? Math.abs(dayChangePercent(b.symbol, today)) : 0;
    return cb - ca;
  });

  const tip = pick(TIPS, today);
  items.splice(2, 0, { id: `tip-${today}`, headline: tip.headline, body: tip.body, kind: "tip" });

  return items;
}
