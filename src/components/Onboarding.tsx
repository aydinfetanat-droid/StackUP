import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { House, GraduationCap, LineChart, Newspaper } from "lucide-react";

const STORAGE_KEY = "stackup:onboarding-seen";

const SLIDES = [
  {
    Icon: House,
    title: "Welcome to StackUp",
    body: "Real money skills, taught in minutes a day. Streaks, progress, and a clear path — no fluff.",
  },
  {
    Icon: GraduationCap,
    title: "Learn",
    body: "Climb from Intern to Master Investor through bite-sized lessons. Each one ends with a quick recap to lock it in.",
  },
  {
    Icon: LineChart,
    title: "Market",
    body: "Practice investing with virtual currency in StackMarket. Zero real risk — it's all simulated.",
  },
  {
    Icon: Newspaper,
    title: "News",
    body: "Daily stories about money and markets, framed as clues to think about — never as advice to follow.",
  },
];

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-onyx-deep px-6 py-10 text-center text-white">
      <button onClick={finish} className="ml-auto text-sm font-medium text-white/50 underline underline-offset-2">
        Skip
      </button>

      <div className="flex flex-1 flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-forest-600/15">
              <slide.Icon size={26} className="text-forest-400" />
            </div>
            <h1 className="mt-6 font-display text-2xl text-white">{slide.title}</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i === step ? "w-6 bg-forest-400" : "w-1.5 bg-white/20"}`} />
        ))}
      </div>

      <button
        onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
        className="btn btn-invert w-full"
      >
        {isLast ? "Get started" : "Next"}
      </button>
    </div>
  );
}
