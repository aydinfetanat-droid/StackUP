import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getLesson } from "../data/lessons";
import { CardRenderer } from "../components/cards/CardRenderer";
import type { LessonCard } from "../types/lesson";

const MAX_REVIEW_CARDS = 8;
const HISTORY_SCAN_LIMIT = 150;

interface ReviewItem {
  lessonId: string;
  cardIndex: number;
  card: LessonCard;
}

export function ReviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("missed_card_answers")
      .select("lesson_id, card_index, correct, answered_at")
      .eq("user_id", user.id)
      .order("answered_at", { ascending: false })
      .limit(HISTORY_SCAN_LIMIT)
      .then(({ data }) => {
        const seen = new Set<string>();
        const reviewItems: ReviewItem[] = [];
        for (const row of data ?? []) {
          const key = `${row.lesson_id}:${row.card_index}`;
          if (seen.has(key)) continue;
          seen.add(key);
          // Only the most recent answer for this card counts (dedup by latest);
          // if that most recent answer was correct, it's no longer "missed".
          if (row.correct) continue;

          const lesson = getLesson(row.lesson_id as string);
          const card = lesson?.cards[row.card_index as number];
          if (!card) continue;

          reviewItems.push({ lessonId: row.lesson_id as string, cardIndex: row.card_index as number, card });
          if (reviewItems.length >= MAX_REVIEW_CARDS) break;
        }
        setItems(reviewItems);
      });
  }, [user]);

  if (items === null) {
    return <div className="min-h-screen bg-ink-100" />;
  }

  if (items.length === 0 || done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-600 px-6 text-center text-white">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-4xl"
        >
          🧠
        </motion.div>
        <p className="text-lg font-bold">{items.length === 0 ? "Nothing to review right now" : "Review complete!"}</p>
        <p className="max-w-xs text-sm text-brand-100">
          {items.length === 0
            ? "You're all caught up on past mistakes. Keep going!"
            : "Great refresh — those should stick better now."}
        </p>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-4 w-full max-w-xs rounded-xl bg-white py-4 text-base font-bold text-brand-700 shadow-sm transition active:scale-[0.98]"
        >
          Back home
        </button>
      </div>
    );
  }

  const current = items[index];
  const progress = (index / items.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex items-center gap-3 px-5 pt-6">
        <span className="text-xs font-bold uppercase tracking-wide text-brand-600">Quick Review</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="h-full"
        >
          <CardRenderer
            card={current.card}
            onComplete={async (correct) => {
              if (user) {
                await supabase.from("missed_card_answers").insert({
                  user_id: user.id,
                  lesson_id: current.lessonId,
                  card_index: current.cardIndex,
                  correct,
                });
              }
              if (index + 1 >= items.length) {
                setDone(true);
              } else {
                setIndex(index + 1);
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
