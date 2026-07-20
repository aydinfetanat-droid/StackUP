type Tone = "neutral" | "positive" | "negative" | "highlight";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  positive: "bg-forest-50 text-forest-700",
  negative: "bg-rust-50 text-rust-700",
  highlight: "bg-ochre-50 text-ochre-600",
};

interface Props {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className = "" }: Props) {
  return <span className={`badge ${TONE_CLASSES[tone]} ${className}`}>{children}</span>;
}
