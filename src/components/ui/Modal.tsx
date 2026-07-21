import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-onyx-deep/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="elevate-lg relative z-10 max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-xl bg-surface p-5 sm:rounded-xl"
          >
            <div className="flex items-start justify-between gap-4">
              {title && <h3 className="font-display text-lg text-ink-900">{title}</h3>}
              <button onClick={onClose} className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-700" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={title ? "mt-2" : ""}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
