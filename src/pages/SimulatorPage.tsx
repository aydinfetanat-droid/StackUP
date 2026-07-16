import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { TICKERS, INDEX_SYMBOL, INDEX_NAME, currentPriceForTicker, currentIndexPrice, priceOnDate, getTicker } from "../lib/market";
import { toLaDateString, computeStreak } from "../lib/streak";
import { syncWeeklyStackGrants } from "../lib/stacks";

interface Holding {
  ticker: string;
  shares: number;
  avg_cost_stacks: number;
}

function yesterdayLaDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLaDateString(d);
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

export function SimulatorPage() {
  const { user } = useAuth();

  const [cash, setCash] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [amountInput, setAmountInput] = useState("");
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [justGranted, setJustGranted] = useState(0);

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
    }

    setAmountInput("");
    setExpandedSymbol(null);
  }

  if (loading || cash === null) {
    return <div className="min-h-screen bg-ink-100" />;
  }

  const allInstruments = [
    { symbol: INDEX_SYMBOL, name: INDEX_NAME, price: currentIndexPrice(), isIndex: true },
    ...TICKERS.map((t) => ({ symbol: t.symbol, name: t.name, price: currentPriceForTicker(t), isIndex: false })),
  ];

  return (
    <div className="min-h-screen bg-ink-100">
      <header className="bg-brand-600 px-6 pb-6 pt-8 text-white">
        <h1 className="text-2xl font-extrabold">StackMarket</h1>
        <p className="mt-0.5 text-sm text-brand-100">Trade with your stacks, risk-free.</p>

        <div className="mt-5 rounded-2xl bg-white/10 p-4">
          <p className="text-xs text-brand-100">Portfolio value</p>
          <p className="text-3xl font-extrabold">{fmt(portfolioValue)} stacks</p>
          <div className="mt-2 flex gap-4 text-sm">
            <span className="text-brand-100">Cash: {fmt(cash)} stacks</span>
            <span className={totalGainLoss >= 0 ? "text-brand-200" : "text-accent-300"}>
              {totalGainLoss >= 0 ? "+" : ""}
              {fmt(totalGainLoss)} stacks gain/loss
            </span>
          </div>
        </div>

        {justGranted > 0 && (
          <div className="mt-3 rounded-2xl bg-accent-500/90 px-4 py-3 text-sm font-semibold">
            🔥 Streak bonus! +{justGranted} stacks added to your cash.
          </div>
        )}
      </header>

      <main className="px-5 pt-6">
        <div className="mb-4 rounded-2xl border border-ink-300 bg-white p-4">
          <p className="text-sm text-ink-700">
            {INDEX_NAME} moved {fmt(Math.abs(dayChangePercent(INDEX_SYMBOL)))}% today, while {mostVolatileToday.name}{" "}
            moved {fmt(Math.abs(dayChangePercent(mostVolatileToday.symbol)))}% — that's diversification in action.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {allInstruments.map((inst) => {
            const change = dayChangePercent(inst.symbol);
            const held = holdings.find((h) => h.ticker === inst.symbol);
            const isExpanded = expandedSymbol === inst.symbol;

            return (
              <div key={inst.symbol} className="rounded-2xl border border-ink-300 bg-white p-4">
                <button
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => {
                    setExpandedSymbol(isExpanded ? null : inst.symbol);
                    setTradeSide("buy");
                    setAmountInput("");
                    setTradeError(null);
                  }}
                >
                  <div>
                    <p className="font-bold text-ink-900">
                      {inst.symbol} {inst.isIndex && <span className="text-xs font-normal text-ink-500">Index Fund</span>}
                    </p>
                    <p className="text-sm text-ink-500">{inst.name}</p>
                    {held && <p className="mt-0.5 text-xs text-brand-600">{fmt(held.shares)} shares held</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink-900">{fmt(inst.price)} stacks</p>
                    <p className={`text-sm font-semibold ${change >= 0 ? "text-brand-600" : "text-accent-600"}`}>
                      {change >= 0 ? "+" : ""}
                      {fmt(change)}%
                    </p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 border-t border-ink-100 pt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTradeSide("buy")}
                        className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                          tradeSide === "buy" ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700"
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setTradeSide("sell")}
                        disabled={!held}
                        className={`flex-1 rounded-lg py-2 text-sm font-bold disabled:opacity-40 ${
                          tradeSide === "sell" ? "bg-accent-500 text-white" : "bg-ink-100 text-ink-700"
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
                        className="flex-1 rounded-lg border border-ink-300 px-3 py-2 text-base outline-none focus:border-brand-500"
                      />
                      <button
                        onClick={() => executeTrade(inst.symbol)}
                        className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-bold text-white active:scale-[0.98]"
                      >
                        {tradeSide === "buy" ? "Buy" : "Sell"}
                      </button>
                    </div>
                    {tradeError && <p className="mt-2 text-xs font-semibold text-accent-600">{tradeError}</p>}
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
