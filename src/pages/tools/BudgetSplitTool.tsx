import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface Category {
  id: string;
  label: string;
  color: string;
  value: number;
}

const INITIAL: Category[] = [
  { id: "needs", label: "Needs", color: "var(--color-ink-900)", value: 50 },
  { id: "wants", label: "Wants", color: "var(--color-forest-500)", value: 30 },
  { id: "savings", label: "Savings", color: "var(--color-ochre-400)", value: 20 },
];

function Donut({ categories }: { categories: Category[] }) {
  const size = 160;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetSoFar = 0;
  const total = categories.reduce((sum, c) => sum + c.value, 0) || 1;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-ink-100)" strokeWidth={stroke} />
      {categories.map((c) => {
        const fraction = c.value / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={c.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={c.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offsetSoFar}
            style={{ transition: "stroke-dasharray 300ms ease-out" }}
          />
        );
        offsetSoFar += dash;
        return el;
      })}
    </svg>
  );
}

export function BudgetSplitTool() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(INITIAL);
  const monthlyIncome = 1200;

  const total = categories.reduce((sum, c) => sum + c.value, 0);
  const isValid = total === 100;

  function setValue(id: string, value: number) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, value } : c)));
  }

  return (
    <div className="min-h-screen bg-surface pb-12">
      <div className="flex items-center gap-3 px-5 pt-6">
        <button onClick={() => navigate(-1)} className="text-ink-500" aria-label="Close">
          <X size={22} />
        </button>
        <p className="label-caps">Interactive tool</p>
      </div>

      <div className="px-6 pt-4">
        <h1 className="font-display text-2xl text-ink-900">Budget split visualizer</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
          A common starting rule is 50% needs, 30% wants, 20% savings. Drag the sliders on a sample ${monthlyIncome.toLocaleString()} monthly income and watch the split change.
        </p>

        <div className="mt-6 flex flex-col items-center rounded-lg border border-ink-200 p-6">
          <div className="relative">
            <Donut categories={categories} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={`font-display text-2xl ${isValid ? "text-ink-900" : "text-rust-600"}`}>{total}%</p>
              <p className="text-xs text-ink-500">allocated</p>
            </div>
          </div>

          <div className="mt-6 grid w-full grid-cols-3 gap-2 text-center">
            {categories.map((c) => (
              <div key={c.id}>
                <div className="mx-auto h-2 w-8 rounded-full" style={{ backgroundColor: c.color }} />
                <p className="mt-1.5 text-xs text-ink-500">{c.label}</p>
                <p className="font-semibold tabular-nums text-ink-900">${Math.round((c.value / 100) * monthlyIncome)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {categories.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-ink-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.label}
                </span>
                <span className="font-semibold tabular-nums text-ink-900">{c.value}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={c.value}
                onChange={(e) => setValue(c.id, Number(e.target.value))}
                className="mt-2 w-full"
                style={{ accentColor: c.color }}
              />
            </div>
          ))}
        </div>

        {!isValid && <p className="mt-4 text-center text-sm font-medium text-rust-600">Adjust the sliders so everything adds up to 100%.</p>}

        <p className="mt-6 text-xs text-ink-400">A simplified model for learning. Real budgets vary a lot by income, location, and life stage.</p>
      </div>
    </div>
  );
}
