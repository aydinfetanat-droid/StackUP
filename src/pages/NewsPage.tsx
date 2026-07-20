import { useMemo, useState } from "react";
import { LineChart, Briefcase, Cpu, Globe2, Wallet, Bookmark, ArrowUpRight, ArrowDownRight, Minus, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { generateDailyNews, CATEGORIES } from "../lib/news";
import type { NewsItem, Category, Tone } from "../lib/news";
import { Chip } from "../components/ui/Chip";
import { Modal } from "../components/ui/Modal";
import { GlossaryText } from "../components/GlossaryText";
import { useBookmarks } from "../hooks/useBookmarks";
import { useToast } from "../components/ui/Toast";

const TONE_STYLES: Record<Tone, string> = {
  positive: "text-forest-700 bg-forest-50 border-forest-200",
  neutral: "text-ink-600 bg-ink-100 border-ink-200",
  negative: "text-rust-700 bg-rust-50 border-rust-200",
};

const CATEGORY_ICON: Record<Category, typeof LineChart> = {
  Markets: LineChart,
  Business: Briefcase,
  Tech: Cpu,
  Global: Globe2,
  "Everyday Money": Wallet,
};

function ToneIcon({ tone }: { tone?: Tone }) {
  if (tone === "positive") return <ArrowUpRight size={13} />;
  if (tone === "negative") return <ArrowDownRight size={13} />;
  return <Minus size={13} />;
}

function Monogram({ item, size = "lg" }: { item: NewsItem; size?: "lg" | "sm" }) {
  const Icon = CATEGORY_ICON[item.category];
  const mark = item.symbol ? item.symbol.slice(0, 2) : item.category.slice(0, 2).toUpperCase();
  const dims = size === "lg" ? "h-full min-h-[128px]" : "h-14 w-14 shrink-0";
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-md bg-ink-950 ${dims}`}>
      <span className={`font-display text-white/90 ${size === "lg" ? "text-4xl" : "text-lg"}`}>{mark}</span>
      <Icon size={size === "lg" ? 16 : 12} className="absolute right-2 top-2 text-white/40" />
    </div>
  );
}

function BookmarkButton({ id, isBookmarked, onToggle }: { id: string; isBookmarked: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(id);
      }}
      aria-label={isBookmarked ? "Remove bookmark" : "Save story"}
      className={`tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
        isBookmarked ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
      }`}
    >
      <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
    </button>
  );
}

function DetailBody({ item }: { item: NewsItem }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-ink-600">
        <GlossaryText text={item.body} />
      </p>
      <div className="rounded-md border border-ochre-200 bg-ochre-50 p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ochre-600">
          <Lightbulb size={13} /> What this could mean for your money
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
          <GlossaryText text={item.reflection} />
        </p>
      </div>
      {item.relatedLessonId && (
        <Link to={`/lesson/${item.relatedLessonId}`} className="text-sm font-semibold text-ink-900 underline underline-offset-2">
          Related lesson →
        </Link>
      )}
      <p className="text-xs text-ink-400">Educational only. Not financial advice.</p>
    </div>
  );
}

export function NewsPage() {
  const news = useMemo(() => generateDailyNews(), []);
  const { isBookmarked, toggle } = useBookmarks();
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [detailItem, setDetailItem] = useState<NewsItem | null>(null);

  function handleToggleBookmark(id: string) {
    const willBeBookmarked = !isBookmarked(id);
    toggle(id);
    showToast(willBeBookmarked ? "Saved to your Signals" : "Removed from saved");
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const filtered = activeCategory === "All" ? news : news.filter((i) => i.category === activeCategory);

  const heroItems = [...filtered].slice(0, 3);
  const heroIds = new Set(heroItems.map((i) => i.id));
  const rest = filtered.filter((i) => !heroIds.has(i.id));

  const sections = CATEGORIES.map((cat) => ({
    category: cat,
    items: rest.filter((i) => i.category === cat),
  })).filter((s) => s.items.length > 0 && (activeCategory === "All" || activeCategory === s.category));

  const tickerStrip = news.filter((i) => i.kind === "market").slice(0, 8);

  return (
    <div className="min-h-screen bg-ink-50 pb-8">
      <header className="bg-ink-950 px-5 pb-5 pt-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-caps text-white/50">{today}</p>
            <h1 className="mt-1 font-display text-2xl text-white">Signals</h1>
          </div>
        </div>
        <p className="mt-1.5 text-sm text-white/60">Clues to help you think about money — never instructions to act on.</p>

        <div className="no-scrollbar mt-4 -mx-5 flex gap-2 overflow-x-auto px-5">
          {tickerStrip.map((i) => (
            <span key={i.id} className={`flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium tabular-nums ${i.tone === "positive" ? "text-forest-300" : i.tone === "negative" ? "text-rust-300" : "text-white/70"}`}>
              {i.symbol}
              <ToneIcon tone={i.tone} />
            </span>
          ))}
        </div>
      </header>

      <div className="border-b border-ink-200 bg-white px-5 py-2.5 text-center text-xs text-ink-500">
        Educational only. Not financial advice — every story here is a prompt to think, not a directive to act.
      </div>

      <div className="no-scrollbar sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-ink-200 bg-ink-50/95 px-5 py-3 backdrop-blur">
        <Chip active={activeCategory === "All"} onClick={() => setActiveCategory("All")}>
          All
        </Chip>
        {CATEGORIES.map((cat) => (
          <Chip key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
            {cat}
          </Chip>
        ))}
      </div>

      <main className="px-5 pt-5">
        {/* Hero: lead stories */}
        <div className="flex flex-col gap-3">
          {heroItems.map((item) => (
            <button key={item.id} onClick={() => setDetailItem(item)} className="tap card overflow-hidden text-left">
              <div className="flex">
                <div className="w-24 shrink-0 sm:w-32">
                  <Monogram item={item} />
                </div>
                <div className="flex-1 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="label-caps">{item.category}</span>
                    {item.verdict && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TONE_STYLES[item.tone ?? "neutral"]}`}>{item.verdict}</span>
                    )}
                  </div>
                  <p className="mt-1 font-display text-lg leading-snug text-ink-900">{item.headline}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">{item.summary}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Category sections */}
        {sections.map(({ category, items }) => {
          const [lead, ...restItems] = items;
          return (
            <section key={category} className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-ink-900">{category}</h2>
                {activeCategory === "All" && (
                  <button onClick={() => setActiveCategory(category)} className="text-xs font-semibold text-ink-500 hover:text-ink-900">
                    See all
                  </button>
                )}
              </div>

              <button onClick={() => setDetailItem(lead)} className="tap card mt-3 flex w-full items-start gap-3 p-3.5 text-left">
                <Monogram item={lead} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base leading-snug text-ink-900">{lead.headline}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">{lead.summary}</p>
                </div>
                <BookmarkButton id={lead.id} isBookmarked={isBookmarked(lead.id)} onToggle={handleToggleBookmark} />
              </button>

              {restItems.length > 0 && (
                <div className="mt-2 divide-y divide-ink-100 rounded-lg border border-ink-200 bg-white">
                  {restItems.map((item) => (
                    <button key={item.id} onClick={() => setDetailItem(item)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-150 hover:bg-ink-50">
                      {item.symbol && <span className="label-caps w-10 shrink-0">{item.symbol}</span>}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">{item.headline}</span>
                      {item.tone && <ToneIcon tone={item.tone} />}
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <p className="mt-8 text-center text-xs text-ink-400">
          Every ticker, headline, and "verdict" above is generated for the StackUp simulator only — none of it describes real companies or real markets.
        </p>
      </main>

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem?.headline}>
        {detailItem && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="label-caps">{detailItem.category}</span>
              {detailItem.verdict && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TONE_STYLES[detailItem.tone ?? "neutral"]}`}>{detailItem.verdict}</span>
              )}
              <div className="ml-auto">
                <BookmarkButton id={detailItem.id} isBookmarked={isBookmarked(detailItem.id)} onToggle={handleToggleBookmark} />
              </div>
            </div>
            <DetailBody item={detailItem} />
          </div>
        )}
      </Modal>
    </div>
  );
}
