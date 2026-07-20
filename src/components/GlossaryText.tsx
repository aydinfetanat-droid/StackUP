import { useMemo, useState } from "react";
import { glossaryTermsForMatching, findGlossaryTerm } from "../data/glossary";
import { Modal } from "./ui/Modal";

interface Props {
  text: string;
  className?: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const pattern = new RegExp(`\\b(${glossaryTermsForMatching().map((t) => escapeRegExp(t.term)).join("|")})\\b`, "gi");

export function GlossaryText({ text, className }: Props) {
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const parts = useMemo(() => text.split(pattern), [text]);
  const active = openTerm ? findGlossaryTerm(openTerm) : undefined;

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = findGlossaryTerm(part);
        if (!match) return <span key={i}>{part}</span>;
        return (
          <button
            key={i}
            onClick={() => setOpenTerm(part)}
            className="rounded border-b border-dashed border-ink-400 font-medium text-ink-900 transition-colors duration-150 hover:bg-ink-100"
          >
            {part}
          </button>
        );
      })}

      <Modal open={!!active} onClose={() => setOpenTerm(null)} title={active?.term}>
        <p className="text-sm leading-relaxed text-ink-600">{active?.definition}</p>
      </Modal>
    </span>
  );
}
