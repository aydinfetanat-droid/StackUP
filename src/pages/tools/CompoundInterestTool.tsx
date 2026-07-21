import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { CountUp } from "../../components/ui/CountUp";

function fmtUsd(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function simulate(principal: number, monthly: number, annualRatePercent: number, years: number) {
  const monthlyRate = annualRatePercent / 100 / 12;
  const points: { year: number; balance: number; contributed: number }[] = [{ year: 0, balance: principal, contributed: principal }];
  let balance = principal;
  let contributed = principal;

  for (let m = 1; m <= years * 12; m++) {
    balance = balance * (1 + monthlyRate) + monthly;
    contributed += monthly;
    if (m % 12 === 0) points.push({ year: m / 12, balance, contributed });
  }
  return { finalBalance: balance, totalContributed: contributed, points };
}

function LineChart({ points }: { points: { year: number; balance: number; contributed: number }[] }) {
  const width = 320;
  const height = 160;
  const pad = 8;
  const maxBalance = Math.max(...points.map((p) => p.balance), 1);
  const maxYear = Math.max(...points.map((p) => p.year), 1);

  const toXY = (year: number, balance: number) => {
    const x = pad + (year / maxYear) * (width - pad * 2);
    const y = height - pad - (balance / maxBalance) * (height - pad * 2);
    return [x, y];
  };

  const balancePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toXY(p.year, p.balance).join(",")}`).join(" ");
  const contributedPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toXY(p.year, p.contributed).join(",")}`).join(" ");
  const areaPath = `${balancePath} L ${toXY(points[points.length - 1].year, 0).join(",")} L ${toXY(0, 0).join(",")} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <path d={areaPath} fill="var(--color-forest-50)" />
      <path d={contributedPath} fill="none" stroke="var(--color-ink-300)" strokeWidth={2} strokeDasharray="4 3" />
      <path d={balancePath} fill="none" stroke="var(--color-forest-600)" strokeWidth={2.5} />
    </svg>
  );
}

export function CompoundInterestTool() {
  const navigate = useNavigate();
  const [principal, setPrincipal] = useState(500);
  const [monthly, setMonthly] = useState(50);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(15);

  const { finalBalance, totalContributed, points } = useMemo(() => simulate(principal, monthly, rate, years), [principal, monthly, rate, years]);
  const growth = finalBalance - totalContributed;

  return (
    <div className="min-h-screen bg-surface pb-12">
      <div className="flex items-center gap-3 px-5 pt-6">
        <button onClick={() => navigate(-1)} className="text-ink-500" aria-label="Close">
          <X size={22} />
        </button>
        <p className="label-caps">Interactive tool</p>
      </div>

      <div className="px-6 pt-4">
        <h1 className="font-display text-2xl text-ink-900">Compound interest</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
          Drag the sliders to see how a starting amount and a small monthly contribution grow over time — not because the money multiplies on its own, but because interest starts earning interest.
        </p>

        <div className="mt-6 rounded-lg border border-ink-200 p-4">
          <p className="text-xs text-ink-500">Estimated balance after {years} years</p>
          <p className="mt-0.5 font-display text-3xl text-ink-900">
            <CountUp value={finalBalance} prefix="$" decimals={0} />
          </p>
          <div className="mt-3">
            <LineChart points={points} />
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-forest-600" /> Total balance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-ink-300" /> What you put in
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-100 pt-3">
            <div>
              <p className="text-xs text-ink-500">You contributed</p>
              <p className="mt-0.5 font-semibold tabular-nums text-ink-900">{fmtUsd(totalContributed)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Growth from interest</p>
              <p className="mt-0.5 font-semibold tabular-nums text-forest-700">{fmtUsd(growth)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <SliderField label="Starting amount" value={principal} onChange={setPrincipal} min={0} max={5000} step={50} format={fmtUsd} />
          <SliderField label="Monthly contribution" value={monthly} onChange={setMonthly} min={0} max={500} step={10} format={fmtUsd} />
          <SliderField label="Annual return" value={rate} onChange={setRate} min={1} max={12} step={0.5} format={(n) => `${n}%`} />
          <SliderField label="Years" value={years} onChange={setYears} min={1} max={40} step={1} format={(n) => `${n}`} />
        </div>

        <p className="mt-6 text-xs text-ink-400">
          A simplified model for learning — assumes a steady return every year, which real markets never do. Educational only, not financial advice.
        </p>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink-700">{label}</span>
        <span className="font-semibold tabular-nums text-ink-900">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-forest-600"
      />
    </div>
  );
}
