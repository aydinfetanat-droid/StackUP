import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Star, HelpCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { Chip } from "../components/ui/Chip";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { useWatchlist } from "../hooks/useWatchlist";
import { supabase } from "../lib/supabase";
import { TICKERS, INDEX_SYMBOL, INDEX_NAME, currentPriceForTicker, currentIndexPrice, priceOnDate, getTicker } from "../lib/market";
import { toLaDateString, computeStreak } from "../lib/streak";
import { syncWeeklyStackGrants } from "../lib/stacks";
import { generateDailyNews } from "../lib/news";

interface Holding {
  ticker: string;
  shares: number;
  avg_cost_stacks: number;
}

const CHART_DAYS = 14;

function yesterdayLaDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLaDateString(d);
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

function PortfolioChart({ cash, holdings }: { cash: number; holdings: Holding[] }) {
  const points = useMemo(() => {
    const days = Array.from({ length: CHART_DAYS }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (CHART_DAYS - 1 - i));
      return toLaDateString(d);
    });
    return days.map((laDate) => cash + holdings.reduce((sum, h) => sum + h.shares * priceOnDate(h.ticker, laDate), 0));
  }, [cash, holdings]);

  const width = 320;
  const height = 88;
  const pad = 4;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const toXY = (i: number, v: number) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y];
  };

  const linePath = points.map((v, i) => `${i === 0 ? "M" : "L"} ${toXY(i, v).join(",")}`).join(" ");
  const areaPath = `${linePath} L ${toXY(points.length - 1, min).join(",")} L ${toXY(0, min).join(",")} Z`;
  const trendUp = points[points.length - 1] >= points[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <path d={areaPath} fill={trendUp ? "rgba(34,147,92,0.12)" : "rgba(173,70,50,0.12)"} />
      <path d={linePath} fill="none" stroke={trendUp ? "var(--color-forest-400)" : "var(--color-rust-400)"} strokeWidth={2} />
    </svg>
  );
}

export function SimulatorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isWatched, toggle: toggleWatch } = useWatchlist();

  const [cash, setCash] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [amountInput, setAmountInput] = useState("");
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [justGranted, setJustGranted] = useState(0);
  const [filter, setFilter] = useState<"all" | "watchlist">("all");

  const todaysNews = useMemo(() => generateDailyNews(), []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let { data: account } = await supabase
        .from("simulator_accounts")
        .select("cash_balance_stacks")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!account) {
        // Upsert (not insert) so a concurrent mount — e.g. React StrictMode's
        // double effect invocation in dev, or two tabs — can't race into a
        // duplicate-key conflict on this first-visit account creation.
        const { data: created } = await supabase
          .from("simulator_accounts")
          .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true })
          .select("cash_balance_stacks")
          .maybeSingle();
        account = created;

        if (!account) {
          const { data: refetched } = await supabase
            .from("simulator_accounts")
            .select("cash_balance_stacks")
            .eq("user_id", user.id)
            .single();
          account = refetched;
        }
      }

      const { data: completions } = await supabase
        .from("lesson_completions")
        .select("completed_at")
        .eq("user_id", user.id);
      const streak = computeStreak((completions ?? []).map((r) => r.completed_at as string));
      const granted = await syncWeeklyStackGrants(user.id, streak.current);
      setJustGranted(granted);

      const { data: refreshedAccount } = await supabase
        .from("simulator_accounts")
        .select("cash_balance_stacks")
        .eq("user_id", user.id)
        .single();

      const { data: holdingsData } = await supabase
        .from("holdings")
        .select("ticker, shares, avg_cost_stacks")
        .eq("user_id", user.id)
        .gt("shares", 0);

      setCash(Number(refreshedAccount?.cash_balance_stacks ?? account?.cash_balance_stacks ?? 10));
      setHoldings((holdingsData ?? []) as Holding[]);
      setLoading(false);
    })();
  }, [user]);

  const portfolioValue = useMemo(() => {
    const holdingsValue = holdings.reduce((sum, h) => sum + h.shares * priceOnDate(h.ticker, toLaDateString(new Date())), 0);
    return (cash ?? 0) + holdingsValue;
  }, [cash, holdings]);

  const totalGainLoss = useMemo(() => {
    const costBasis = holdings.reduce((sum, h) => sum + h.shares * h.avg_cost_stacks, 0);
    const currentHoldingsValue = holdings.reduce((sum, h) => sum + h.shares * priceOnDate(h.ticker, toLaDateString(new Date())), 0);
    return currentHoldingsValue - costBasis;
  }, [holdings]);

  function dayChangePercent(symbol: string): number {
    const today = priceOnDate(symbol, toLaDateString(new Date()));
    const yesterday = priceOnDate(symbol, yesterdayLaDate());
    return ((today - yesterday) / yesterday) * 100;
  }

  const mostVolatileToday = useMemo(() => {
    let worst = TICKERS[0];
    let worstAbs = 0;
    for (const t of TICKERS) {
      const abs = Math.abs(dayChangePercent(t.symbol));
      if (abs > worstAbs) {
        worstAbs = abs;
        worst = t;
      }
    }
    return worst;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function executeTrade(symbol: string) {
    setTradeError(null);
    const amount = Number(amountInput);
    if (!user || !amount || amount <= 0 || cash === null) {
      setTradeError("Enter a valid amount.");
      return;
    }
    const price = symbol === INDEX_SYMBOL ? currentIndexPrice() : currentPriceForTicker(getTicker(symbol)!);
    const existing = holdings.find((h) => h.ticker === symbol);

    if (tradeSide === "buy") {
      if (amount > cash) {
        setTradeError("Not enough stacks.");
        return;
      }
      const shares = amount / price;
      const newShares = (existing?.shares ?? 0) + shares;
      const newAvgCost = existing
        ? (existing.shares * existing.avg_cost_stacks + amount) / newShares
        : price;

      await supabase.from("holdings").upsert(
        { user_id: user.id, ticker: symbol, shares: newShares, avg_cost_stacks: newAvgCost },
        { onConflict: "user_id,ticker" },
      );
      await supabase.from("simulator_accounts").update({ cash_balance_stacks: cash - amount }).eq("user_id", user.id);
      await supabase.from("trades").insert({ user_id: user.id, ticker: symbol, side: "buy", shares, price_stacks: price });

      setCash(cash - amount);
      setHoldings((prev) => {
        const others = prev.filter((h) => h.ticker !== symbol);
        return [...others, { ticker: symbol, shares: newShares, avg_cost_stacks: newAvgCost }];
      });
      showToast(`Bought ${fmt(shares)} shares of ${symbol}`);
    } else {
      const sharesToSell = amount / price;
      if (!existing || sharesToSell > existing.shares + 0.0001) {
        setTradeError("You don't own that many shares.");
        return;
      }
      const proceeds = amount;
      const remainingShares = existing.shares - sharesToSell;

      if (remainingShares <= 0.0001) {
        await supabase.from("holdings").delete().eq("user_id", user.id).eq("ticker", symbol);
      } else {
        await supabase
          .from("holdings")
          .update({ shares: remainingShares })
          .eq("user_id", user.id)
          .eq("ticker", symbol);
      }
      await supabase.from("simulator_accounts").update({ cash_balance_stacks: cash + proceeds }).eq("user_id", user.id);
      await supabase.from("trades").insert({ user_id: user.id, ticker: symbol, side: "sell", shares: sharesToSell, price_stacks: price });

      setCash(cash + proceeds);
      setHoldings((prev) =>
        remainingShares <= 0.0001
          ? prev.filter((h) => h.ticker !== symbol)
          : prev.map((h) => (h.ticker === symbol ? { ...h, shares: remainingShares } : h)),
      );
      showToast(`Sold ${fmt(sharesToSell)} shares of ${symbol}`);
    }

    setAmountInput("");
    setExpandedSymbol(null);
  }

  if (loading || cash === null) {
    return (
      <div className="min-h-screen bg-ink-50">
        <div className="bg-onyx-deep px-6 pb-6 pt-8">
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-7 w-48 animate-pulse rounded bg-white/10" />
          <div className="mt-5 h-24 w-full animate-pulse rounded-md bg-white/10" />
        </div>
        <div className="flex flex-col gap-2 px-5 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const allInstruments = [
    { symbol: INDEX_SYMBOL, name: INDEX_NAME, price: currentIndexPrice(), isIndex: true },
    ...TICKERS.map((t) => ({ symbol: t.symbol, name: t.name, price: currentPriceForTicker(t), isIndex: false })),
  ];
  const visibleInstruments = filter === "watchlist" ? allInstruments.filter((i) => isWatched(i.symbol)) : allInstruments;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-onyx-deep px-6 pb-6 pt-8 text-white">
        <div className="flex items-center justify-between">
          <p className="label-caps text-white/50">StackMarket</p>
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-white/60">
            Simulated — no real money
          </span>
        </div>
        <h1 className="mt-1 font-display text-2xl text-white">{fmt(portfolioValue)} stacks</h1>
        <div className="mt-1 flex gap-4 text-sm tabular-nums">
          <span className="text-white/50">Cash: {fmt(cash)} stacks</span>
          <span className={totalGainLoss >= 0 ? "text-forest-400" : "text-rust-400"}>
            {totalGainLoss >= 0 ? "+" : ""}
            {fmt(totalGainLoss)} gain/loss
          </span>
        </div>

        <div className="mt-4 rounded-md border border-white/15 p-3">
          <PortfolioChart cash={cash} holdings={holdings} />
        </div>

        {justGranted > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-ochre-400/40 bg-ochre-400/10 px-4 py-3 text-sm text-ochre-100">
            <Flame size={15} className="shrink-0 text-ochre-400" />
            Streak bonus — +{justGranted} stacks added to your cash.
          </div>
        )}
      </header>

      <main className="px-5 pt-6">
        <div className="card mb-4 p-4">
          <p className="text-sm text-ink-600">
            {INDEX_NAME} moved {fmt(Math.abs(dayChangePercent(INDEX_SYMBOL)))}% today, while {mostVolatileToday.name}{" "}
            moved {fmt(Math.abs(dayChangePercent(mostVolatileToday.symbol)))}% — that's diversification in action.
          </p>
        </div>

        <div className="mb-3 flex gap-2">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            All assets
          </Chip>
          <Chip active={filter === "watchlist"} onClick={() => setFilter("watchlist")}>
            Watchlist
          </Chip>
        </div>

        {filter === "watchlist" && visibleInstruments.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-500">Star an asset to add it to your watchlist.</p>
        )}

        <div className="flex flex-col gap-2">
          {visibleInstruments.map((inst) => {
            const change = dayChangePercent(inst.symbol);
            const held = holdings.find((h) => h.ticker === inst.symbol);
            const isExpanded = expandedSymbol === inst.symbol;
            const relatedStory = todaysNews.find((n) => n.symbol === inst.symbol);

            return (
              <div key={inst.symbol} className="card p-4">
                <div className="flex w-full items-center gap-3">
                  <button
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => {
                      setExpandedSymbol(isExpanded ? null : inst.symbol);
                      setTradeSide("buy");
                      setAmountInput("");
                      setTradeError(null);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-900">
                        {inst.symbol} {inst.isIndex && <span className="ml-1.5 text-xs font-normal text-ink-500">Index Fund</span>}
                      </p>
                      <p className="truncate text-sm text-ink-500">{inst.name}</p>
                      {held && <p className="mt-0.5 text-xs font-medium text-ink-500 tabular-nums">{fmt(held.shares)} shares held</p>}
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <p className="font-semibold text-ink-900">{fmt(inst.price)} stacks</p>
                      <p className={`text-sm font-medium ${change >= 0 ? "text-forest-600" : "text-rust-600"}`}>
                        {change >= 0 ? "+" : ""}
                        {fmt(change)}%
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleWatch(inst.symbol)}
                    aria-label={isWatched(inst.symbol) ? "Remove from watchlist" : "Add to watchlist"}
                    className="tap shrink-0 text-ink-300 hover:text-ochre-400"
                  >
                    <Star size={17} className={isWatched(inst.symbol) ? "fill-ochre-400 text-ochre-400" : ""} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-ink-100 pt-4">
                    {relatedStory && (
                      <button
                        onClick={() => navigate("/news", { state: { openStoryId: relatedStory.id } })}
                        className="tap mb-3 flex w-full items-start gap-2 rounded-md border border-ink-200 bg-ink-50 p-3 text-left"
                      >
                        <HelpCircle size={15} className="mt-0.5 shrink-0 text-ink-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold uppercase tracking-[0.04em] text-ink-500">Why did this move?</span>
                          <span className="mt-0.5 block text-sm font-medium text-ink-800">{relatedStory.headline}</span>
                        </span>
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setTradeSide("buy")}
                        className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors duration-150 ${
                          tradeSide === "buy" ? "bg-onyx text-white" : "bg-ink-100 text-ink-700"
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setTradeSide("sell")}
                        disabled={!held}
                        className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-40 ${
                          tradeSide === "sell" ? "bg-onyx text-white" : "bg-ink-100 text-ink-700"
                        }`}
                      >
                        Sell
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder="Amount in stacks"
                        className="flex-1 rounded-md border border-ink-300 bg-surface px-3 py-2.5 text-base outline-none focus:border-ink-900"
                      />
                      <button onClick={() => executeTrade(inst.symbol)} className="btn btn-primary tap flex items-center gap-1.5">
                        <CheckCircle2 size={15} />
                        {tradeSide === "buy" ? "Buy" : "Sell"}
                      </button>
                    </div>
                    {tradeError && <p className="mt-2 text-xs font-medium text-rust-600">{tradeError}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
