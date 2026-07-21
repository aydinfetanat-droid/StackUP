import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircleQuestion, X, Send, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

const FAQ: { question: string; answer: string }[] = [
  {
    question: "How do streaks work?",
    answer: "Complete at least one lesson each day to keep your streak alive. Miss a day and it resets to zero — but every lesson you've already finished stays counted.",
  },
  {
    question: "What's compound interest?",
    answer: "Interest calculated on both your original amount and the interest you've already earned, so it grows faster over time than a flat rate. There's a hands-on tool for this under Learn.",
  },
  {
    question: "Is this financial advice?",
    answer: "No. Nothing in StackUp — News, StackMarket, or lessons — is financial advice. It's all educational, and StackMarket trades with virtual currency only, never real money.",
  },
  {
    question: "How do I earn XP?",
    answer: "You earn XP by completing lessons and passing promotion exams. Your total shows up on your Profile as you level up toward Master Investor.",
  },
];

const FALLBACK = "I don't have an answer for that yet — try one of the questions above, or check the About page in Settings.";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return idCounter;
}

export function HelpChatbot() {
  const { session } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId(), from: "bot", text: "Hi! I'm the StackUp assistant. Ask me anything about how the app works." },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");

  if (!session) return null;
  if (location.pathname.startsWith("/lesson/") || location.pathname === "/promotion-exam" || location.pathname === "/placement-test") return null;

  function respond(answer: string) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { id: nextId(), from: "bot", text: answer }]);
    }, 700);
  }

  function askFaq(question: string, answer: string) {
    setMessages((prev) => [...prev, { id: nextId(), from: "user", text: question }]);
    respond(answer);
  }

  function submitFreeText() {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: nextId(), from: "user", text }]);
    setInput("");
    const match = FAQ.find((f) => text.toLowerCase().includes(f.question.toLowerCase().slice(0, 8)));
    respond(match ? match.answer : FALLBACK);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open help assistant"
        className="tap elevate-lg fixed right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-forest-600 text-white"
        style={{ bottom: "calc(80px + env(safe-area-inset-bottom, 0px))", height: 52, width: 52 }}
      >
        <MessageCircleQuestion size={22} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-onyx-deep/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="elevate-lg relative z-10 flex h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl bg-surface sm:h-[560px] sm:rounded-xl"
            >
              <div className="flex items-center gap-3 border-b border-ink-200 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-600 text-white">
                  <Sparkles size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">StackUp Assistant</p>
                  <p className="text-[11px] text-ink-500">Demo — full version coming soon</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.from === "user" ? "bg-onyx text-white" : "bg-ink-100 text-ink-800"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1 rounded-2xl bg-ink-100 px-3.5 py-3">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-ink-400"
                            style={{ animation: `typing-pulse 1s ease-in-out ${i * 0.15}s infinite` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {messages.length < 3 && (
                <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-ink-100 px-4 py-3">
                  {FAQ.map((f) => (
                    <button
                      key={f.question}
                      onClick={() => askFaq(f.question, f.answer)}
                      className="chip shrink-0"
                    >
                      {f.question}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-ink-200 p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitFreeText()}
                  placeholder="Ask a question…"
                  className="flex-1 rounded-full border border-ink-300 bg-surface px-4 py-2.5 text-sm outline-none focus:border-ink-900"
                />
                <button onClick={submitFreeText} aria-label="Send" className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
                  <Send size={15} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes typing-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
