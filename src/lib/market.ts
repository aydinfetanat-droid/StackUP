import tickersData from "../data/market/tickers.json";
import { toLaDateString } from "./streak";

export interface TickerMeta {
  symbol: string;
  name: string;
  volatility: number;
  startPrice: number;
}

export const TICKERS: TickerMeta[] = tickersData.tickers;
export const INDEX_SYMBOL = tickersData.index.symbol;
export const INDEX_NAME = tickersData.index.name;

const GENESIS_MS = Date.UTC(2026, 0, 1);

function dayIndexForLaDate(laDateStr: string): number {
  const [y, m, d] = laDateStr.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  return Math.max(0, Math.round((target - GENESIS_MS) / 86400000));
}

// Deterministic hash -> [0, 1) float. Same (ticker, day) always produces the
// same value, so prices are a reproducible seeded random walk shared by every
// user — a single simulated market, computed on demand instead of stored.
function hashToUnitFloat(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

function dailyReturn(symbol: string, dayIndex: number, volatility: number): number {
  const u = hashToUnitFloat(`${symbol}:${dayIndex}`);
  const signed = (u - 0.5) * 2;
  return signed * volatility;
}

const priceCache = new Map<string, number>();

export function priceForTickerOnDate(ticker: TickerMeta, laDateStr: string): number {
  const cacheKey = `${ticker.symbol}:${laDateStr}`;
  const cached = priceCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const dayIndex = dayIndexForLaDate(laDateStr);
  let price = ticker.startPrice;
  for (let d = 0; d <= dayIndex; d++) {
    price *= 1 + dailyReturn(ticker.symbol, d, ticker.volatility);
  }
  const clamped = Math.max(0.1, price);
  priceCache.set(cacheKey, clamped);
  return clamped;
}

export function currentPriceForTicker(ticker: TickerMeta): number {
  return priceForTickerOnDate(ticker, toLaDateString(new Date()));
}

export function indexPriceOnDate(laDateStr: string): number {
  const sum = TICKERS.reduce((acc, t) => acc + priceForTickerOnDate(t, laDateStr), 0);
  return sum / TICKERS.length;
}

export function currentIndexPrice(): number {
  return indexPriceOnDate(toLaDateString(new Date()));
}

export function getTicker(symbol: string): TickerMeta | undefined {
  return TICKERS.find((t) => t.symbol === symbol);
}

export function priceOnDate(symbol: string, laDateStr: string): number {
  if (symbol === INDEX_SYMBOL) return indexPriceOnDate(laDateStr);
  const ticker = getTicker(symbol);
  return ticker ? priceForTickerOnDate(ticker, laDateStr) : 0;
}
