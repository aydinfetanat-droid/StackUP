import { TICKERS, INDEX_SYMBOL, INDEX_NAME, priceOnDate } from "./market";
import { toLaDateString } from "./streak";

export interface NewsItem {
  id: string;
  headline: string;
  body: string;
  verdict?: string;
  tone?: Tone;
  symbol?: string;
  kind: "market" | "tip";
}

export type Tone = "positive" | "neutral" | "negative";

interface Bucket {
  headlines: ((name: string) => string)[];
  bodies: ((name: string, abs: string) => string)[];
  verdict: string;
  tone: Tone;
}

const BIG_GAIN: Bucket = {
  headlines: [
    (name) => `${name} surges on strong demand`,
    (name) => `${name} jumps as investors pile in`,
  ],
  bodies: [
    (name, abs) =>
      `${name} jumped ${abs}% today — the kind of move that grabs headlines. Big single-day gains like this are usually driven by a sudden rush of buying interest all at once, sometimes on real news, sometimes just momentum feeding on itself. Practice take: it's tempting to chase a stock right after a big jump, but the price you'd pay today already has today's excitement baked into it. Before adding ${name} to your simulator portfolio because of one green day, ask whether you'd still want it at this price if the excitement fades tomorrow.`,
  ],
  verdict: "Building interest",
  tone: "positive",
};

const SMALL_GAIN: Bucket = {
  headlines: [
    (name) => `${name} edges higher in quiet trading`,
    (name) => `${name} ticks up slightly today`,
  ],
  bodies: [
    (name, abs) =>
      `${name} nudged up ${abs}% — a quiet, unremarkable day by most measures. Practice take: small, steady gains like this are exactly what you want from a long-term holding. It's not exciting, and that's fine — "not exciting" is often a feature, not a bug, when you're investing for years instead of days. The stocks that compound the most are rarely the ones making headlines every week.`,
  ],
  verdict: "Steady as it goes",
  tone: "positive",
};

const FLAT: Bucket = {
  headlines: [
    (name) => `${name} holds steady`,
    (name) => `${name} barely moves today`,
  ],
  bodies: [
    (name, abs) =>
      `${name} moved just ${abs}% today, essentially flat. Practice take: flat days are the majority of days for most stocks — the drama you see in financial headlines is the exception, not the norm. If ${name} is sitting in your simulator portfolio, a quiet day like this is nothing to react to. Reacting to every tiny wiggle is a fast way to trade yourself into worse decisions than just holding still.`,
  ],
  verdict: "No action needed",
  tone: "neutral",
};

const SMALL_LOSS: Bucket = {
  headlines: [
    (name) => `${name} dips slightly amid quiet trading`,
    (name) => `${name} slips a little today`,
  ],
  bodies: [
    (name, abs) =>
      `${name} moved down ${abs}% today — a small, routine dip. Practice take: the most common mistake new investors make is treating every red day as a signal to sell. A stock's underlying value doesn't usually change because of one slightly-off afternoon. Dips like this happen to good companies constantly; the question worth asking isn't "is it down?" but "did anything real actually change?"`,
  ],
  verdict: "Worth watching",
  tone: "negative",
};

const BIG_LOSS: Bucket = {
  headlines: [
    (name) => `${name} tumbles on heavy selling`,
    (name) => `${name} drops sharply today`,
  ],
  bodies: [
    (name, abs) =>
      `${name} dropped ${abs}% today — a sharp move that would definitely get investors' attention. Practice take: big drops trigger panic, and panic is expensive. Selling into a big loss locks it in permanently, while holding at least leaves the door open for a recovery if the underlying reason to own it hasn't changed. Before reacting to a move like this, ask whether anything about the actual business changed today, or if this is just the market's mood swinging harder than usual.`,
  ],
  verdict: "Stay calm, don't panic-sell",
  tone: "negative",
};

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

const TIPS: { headline: string; body: string }[] = [
  {
    headline: "Reminder: the index fund exists to smooth out days like this",
    body: "When individual tickers swing hard in either direction, a diversified index fund is designed to move less — that's the entire point of not betting everything on one company. If you're building your simulator portfolio, the index fund (STIX) is a useful baseline to compare every trade against: is this individual pick actually worth the extra risk over just holding the whole market?",
  },
  {
    headline: "Time in the market usually beats timing the market",
    body: "Trying to guess the exact best day to buy or sell is genuinely hard, even for professionals who do it full-time with far more information than any headline gives you. A steady, long-term approach — buying consistently and holding through the noise — tends to outperform frantic day-to-day trading over any meaningful stretch of time. The traders chasing every headline usually underperform the ones who barely check their portfolio.",
  },
  {
    headline: "Volatility isn't the same as risk of losing everything",
    body: "A stock bouncing around day to day is normal, even for solid companies. What matters more for real risk is whether you're diversified across multiple holdings and whether you can stay invested for the long haul without panic-selling during a rough stretch. A stock that swings 5% in a day but trends up over years is a very different animal from a stock that quietly goes to zero.",
  },
  {
    headline: "Fees quietly eat returns over time",
    body: "A fund charging 1% a year versus 0.05% might not sound like much in the moment, but compounded over decades, that difference can cost you a huge chunk of your final balance — sometimes tens of thousands of dollars on a long-term account. Always check the expense ratio before choosing a real fund, and remember that in the simulator, fees are simplified away specifically so you can focus on the strategy first.",
  },
  {
    headline: "Diversification isn't about owning more stocks — it's about owning different ones",
    body: "Ten tickers that all move together in the same direction on the same days aren't actually diversified, even though it looks like you own \"a lot\" of stocks. Real diversification means holding things that don't all react the same way to the same news — different sectors, different volatility levels, a mix of steady and higher-risk names. Check your simulator holdings: if they're all green or all red on the same day, that's a clue they're more correlated than they look.",
  },
  {
    headline: "A falling price alone doesn't tell you if something is \"cheap\"",
    body: "It's easy to assume a stock that's dropped a lot must now be a bargain, but price alone doesn't tell you value — a stock can fall 50% and still be overpriced, or barely move and still be a great deal. Professional investors look at what a company actually earns and owns relative to its price, not just how far the sticker price has fallen from its high.",
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
    const bodyFn = pick(bucket.bodies, `${inst.symbol}:${today}:b`);

    items.push({
      id: `${inst.symbol}-${today}`,
      headline: headlineFn(inst.name),
      body: bodyFn(inst.name, abs),
      verdict: bucket.verdict,
      tone: bucket.tone,
      symbol: inst.symbol,
      kind: "market",
    });
  }

  items.sort((a, b) => {
    const ca = a.symbol ? Math.abs(dayChangePercent(a.symbol, today)) : 0;
    const cb = b.symbol ? Math.abs(dayChangePercent(b.symbol, today)) : 0;
    return cb - ca;
  });

  // Weave in two tips, spaced through the feed rather than bunched together.
  const tipA = pick(TIPS, `${today}:tipA`);
  let tipB = pick(TIPS, `${today}:tipB`);
  if (tipB.headline === tipA.headline) {
    tipB = TIPS[(TIPS.indexOf(tipA) + 1) % TIPS.length];
  }

  items.splice(2, 0, { id: `tip-a-${today}`, headline: tipA.headline, body: tipA.body, kind: "tip" });
  items.splice(7, 0, { id: `tip-b-${today}`, headline: tipB.headline, body: tipB.body, kind: "tip" });

  return items;
}
