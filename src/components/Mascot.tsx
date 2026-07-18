import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  quip: string;
  tone?: "positive" | "negative";
  size?: "sm" | "lg";
}

export function Mascot({ quip, tone = "positive", size = "sm" }: Props) {
  const Icon = tone === "positive" ? CheckCircle2 : XCircle;
  const iconColor = tone === "positive" ? "text-forest-600" : "text-rust-600";

  return (
    <div className="flex items-start gap-2">
      <Icon size={size === "lg" ? 20 : 17} className={`mt-0.5 shrink-0 ${iconColor}`} />
      <p className={size === "lg" ? "text-base font-medium text-ink-900" : "text-sm font-medium text-ink-900"}>{quip}</p>
    </div>
  );
}

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
