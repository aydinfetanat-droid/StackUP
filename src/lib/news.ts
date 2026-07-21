import { TICKERS, INDEX_SYMBOL, INDEX_NAME, priceOnDate } from "./market";
import { toLaDateString } from "./streak";

export type Tone = "positive" | "neutral" | "negative";
export type Category = "Markets" | "Business" | "Tech" | "Global" | "Everyday Money";

export const CATEGORIES: Category[] = ["Markets", "Business", "Tech", "Global", "Everyday Money"];

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  body: string;
  reflection: string;
  verdict?: string;
  tone?: Tone;
  symbol?: string;
  assetName?: string;
  /** Signed same-day price move for `symbol`, when this story is tied to a
   *  specific StackMarket asset. Powers the news→market "moved X%" line. */
  changePercent?: number;
  category: Category;
  relatedLessonId?: string;
  kind: "market" | "tip";
}

// Each ticker gets a fixed category so the magazine sections have something
// real to group by, independent of that day's price move.
const TICKER_CATEGORY: Record<string, Category> = {
  [INDEX_SYMBOL]: "Markets",
  NOVA: "Tech",
  BYTF: "Tech",
  VRTX: "Tech",
  BRGT: "Business",
  PULS: "Business",
  SOLF: "Business",
  CRLB: "Markets",
  GRFL: "Global",
  AERL: "Global",
  LUMN: "Global",
};

interface Bucket {
  headlines: ((name: string) => string)[];
  summaries: ((name: string, abs: string) => string)[];
  bodies: ((name: string, abs: string) => string)[];
  reflections: ((name: string) => string)[];
  verdict: string;
  tone: Tone;
  relatedLessonId: string;
}

const BIG_GAIN: Bucket = {
  headlines: [
    (name) => `${name} surges on strong demand`,
    (name) => `${name} jumps as investors pile in`,
  ],
  summaries: [(name, abs) => `${name} jumped ${abs}% today — a sudden rush of buying interest all at once.`],
  bodies: [
    (name, abs) =>
      `${name} jumped ${abs}% today — the kind of move that grabs headlines. Big single-day gains like this are usually driven by a sudden rush of buying interest all at once, sometimes on real news, sometimes just momentum feeding on itself.`,
  ],
  reflections: [
    (name) =>
      `It's tempting to chase a stock right after a big jump, but the price you'd pay today already has today's excitement baked in. If you added ${name} to your simulator portfolio right now, would you still want it at this price if the excitement faded tomorrow?`,
  ],
  verdict: "Building interest",
  tone: "positive",
  relatedLessonId: "unit1-lesson1",
};

const SMALL_GAIN: Bucket = {
  headlines: [
    (name) => `${name} edges higher in quiet trading`,
    (name) => `${name} ticks up slightly today`,
  ],
  summaries: [(name, abs) => `${name} nudged up ${abs}% — a quiet, unremarkable day by most measures.`],
  bodies: [
    (name, abs) =>
      `${name} nudged up ${abs}% — a quiet, unremarkable day by most measures. Small, steady gains like this are exactly what a lot of long-term holdings look like day to day.`,
  ],
  reflections: [
    () =>
      `"Not exciting" is often a feature, not a bug, when you're holding something for years instead of days. What would it feel like to own something that never makes headlines but slowly compounds anyway?`,
  ],
  verdict: "Steady as it goes",
  tone: "positive",
  relatedLessonId: "unit4-lesson1",
};

const FLAT: Bucket = {
  headlines: [
    (name) => `${name} holds steady`,
    (name) => `${name} barely moves today`,
  ],
  summaries: [(name, abs) => `${name} moved just ${abs}% today, essentially flat.`],
  bodies: [
    (name, abs) =>
      `${name} moved just ${abs}% today, essentially flat. Flat days are the majority of days for most stocks — the drama in financial headlines is the exception, not the norm.`,
  ],
  reflections: [
    (name) => `If ${name} were sitting in your simulator portfolio, is a quiet day like this something worth reacting to at all?`,
  ],
  verdict: "No action needed",
  tone: "neutral",
  relatedLessonId: "unit4-lesson1",
};

const SMALL_LOSS: Bucket = {
  headlines: [
    (name) => `${name} dips slightly amid quiet trading`,
    (name) => `${name} slips a little today`,
  ],
  summaries: [(name, abs) => `${name} moved down ${abs}% today — a small, routine dip.`],
  bodies: [
    (name, abs) =>
      `${name} moved down ${abs}% today — a small, routine dip. Dips like this happen to good companies constantly, for all kinds of reasons that have nothing to do with what the business is actually worth.`,
  ],
  reflections: [
    () => `The most common new-investor mistake is treating every red day as a signal to sell. What's the difference between a stock being "down" and something real actually changing about it?`,
  ],
  verdict: "Worth watching",
  tone: "negative",
  relatedLessonId: "unit4-lesson2",
};

const BIG_LOSS: Bucket = {
  headlines: [
    (name) => `${name} tumbles on heavy selling`,
    (name) => `${name} drops sharply today`,
  ],
  summaries: [(name, abs) => `${name} dropped ${abs}% today — a sharp move that would get any investor's attention.`],
  bodies: [
    (name, abs) =>
      `${name} dropped ${abs}% today — a sharp move that would definitely get investors' attention. Big drops tend to trigger panic, and panic is usually the most expensive reaction available.`,
  ],
  reflections: [
    () => `Selling into a big loss locks it in permanently, while holding leaves the door open for a recovery. Before reacting to a move like this, what would you actually want to know first?`,
  ],
  verdict: "Stay calm, don't panic-sell",
  tone: "negative",
  relatedLessonId: "unit4-lesson2",
};

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

interface Tip {
  headline: string;
  summary: string;
  body: string;
  reflection: string;
  relatedLessonId: string;
}

const TIPS: Tip[] = [
  {
    headline: "Reminder: the index fund exists to smooth out days like this",
    summary: "A diversified index fund is designed to move less than any single company inside it.",
    body: "When individual tickers swing hard in either direction, a diversified index fund is designed to move less — that's the entire point of not betting everything on one company. The index fund (STIX) tracks the average of every ticker in the simulator.",
    reflection: "Before adding an individual pick to your simulator portfolio, is it actually worth the extra risk over just holding the whole market?",
    relatedLessonId: "unit4-lesson1",
  },
  {
    headline: "Time in the market usually beats timing the market",
    summary: "Guessing the exact best day to buy or sell is hard even for professionals.",
    body: "Trying to guess the exact best day to buy or sell is genuinely hard, even for people who do it full-time with far more information than any headline gives you. A steady, long-term approach tends to outperform frantic day-to-day trading over any meaningful stretch of time.",
    reflection: "What would change about your simulator strategy if you assumed you'd never be able to time the market perfectly?",
    relatedLessonId: "unit4-lesson1",
  },
  {
    headline: "Volatility isn't the same as risk of losing everything",
    summary: "A stock bouncing around day to day is normal, even for solid companies.",
    body: "A stock bouncing around day to day is normal, even for solid companies. What matters more for real risk is whether you're diversified across multiple holdings and whether you can stay invested through a rough stretch without panic-selling.",
    reflection: "A stock that swings 5% in a day but trends up over years — is that the same kind of risk as a stock that quietly goes to zero?",
    relatedLessonId: "unit4-lesson2",
  },
  {
    headline: "Fees quietly eat returns over time",
    summary: "A 1% fee versus a 0.05% fee sounds small — until it compounds for decades.",
    body: "A fund charging 1% a year versus 0.05% might not sound like much in the moment, but compounded over decades, that difference can cost a huge chunk of the final balance. In the simulator, fees are simplified away specifically so you can focus on strategy first.",
    reflection: "If two funds hold roughly the same things, what would justify one of them charging 20x more in fees?",
    relatedLessonId: "unit4-lesson1",
  },
  {
    headline: "Diversification isn't about owning more stocks — it's about owning different ones",
    summary: "Ten tickers that all move together aren't actually diversified.",
    body: "Ten tickers that all move in the same direction on the same days aren't actually diversified, even though it looks like a lot of stocks. Real diversification means holding things that don't all react the same way to the same news.",
    reflection: "Check your own simulator holdings — if they're all green or all red on the same day, what does that tell you about how correlated they really are?",
    relatedLessonId: "unit4-lesson2",
  },
  {
    headline: "A falling price alone doesn't tell you if something is \"cheap\"",
    summary: "Price alone doesn't tell you value — a stock can fall 50% and still be overpriced.",
    body: "It's easy to assume a stock that's dropped a lot must now be a bargain, but price alone doesn't tell you value. A stock can fall 50% and still be overpriced, or barely move and still be a great deal.",
    reflection: "What's actually being measured when someone calls a stock \"cheap\" — the price, or something else?",
    relatedLessonId: "unit1-lesson1",
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

function bucketFor(change: number): Bucket {
  if (change >= 2) return BIG_GAIN;
  if (change >= 0.3) return SMALL_GAIN;
  if (change > -0.3) return FLAT;
  if (change > -2) return SMALL_LOSS;
  return BIG_LOSS;
}

export function generateDailyNews(): NewsItem[] {
  const today = toLaDateString(new Date());
  const items: NewsItem[] = [];

  const instruments = [{ symbol: INDEX_SYMBOL, name: INDEX_NAME }, ...TICKERS.map((t) => ({ symbol: t.symbol, name: t.name }))];

  for (const inst of instruments) {
    const change = dayChangePercent(inst.symbol, today);
    const abs = Math.abs(change).toFixed(2);
    const bucket = bucketFor(change);
    const headlineFn = pick(bucket.headlines, `${inst.symbol}:${today}:h`);
    const summaryFn = pick(bucket.summaries, `${inst.symbol}:${today}:s`);
    const bodyFn = pick(bucket.bodies, `${inst.symbol}:${today}:b`);
    const reflectionFn = pick(bucket.reflections, `${inst.symbol}:${today}:r`);

    items.push({
      id: `${inst.symbol}-${today}`,
      headline: headlineFn(inst.name),
      summary: summaryFn(inst.name, abs),
      body: bodyFn(inst.name, abs),
      reflection: reflectionFn(inst.name),
      verdict: bucket.verdict,
      tone: bucket.tone,
      symbol: inst.symbol,
      assetName: inst.name,
      changePercent: change,
      category: TICKER_CATEGORY[inst.symbol] ?? "Markets",
      relatedLessonId: bucket.relatedLessonId,
      kind: "market",
    });
  }

  items.sort((a, b) => {
    const ca = a.symbol ? Math.abs(dayChangePercent(a.symbol, today)) : 0;
    const cb = b.symbol ? Math.abs(dayChangePercent(b.symbol, today)) : 0;
    return cb - ca;
  });

  // Weave in two tips (Everyday Money category), spaced through the feed.
  const tipA = pick(TIPS, `${today}:tipA`);
  let tipB = pick(TIPS, `${today}:tipB`);
  if (tipB.headline === tipA.headline) {
    tipB = TIPS[(TIPS.indexOf(tipA) + 1) % TIPS.length];
  }

  const toTipItem = (tip: Tip, id: string): NewsItem => ({
    id,
    headline: tip.headline,
    summary: tip.summary,
    body: tip.body,
    reflection: tip.reflection,
    category: "Everyday Money",
    relatedLessonId: tip.relatedLessonId,
    kind: "tip",
  });

  items.splice(2, 0, toTipItem(tipA, `tip-a-${today}`));
  items.splice(7, 0, toTipItem(tipB, `tip-b-${today}`));

  return items;
}
