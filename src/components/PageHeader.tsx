import { useNavigate } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";

interface Props {
  title: string;
  eyebrow?: string;
  mode?: "back" | "close";
  onBack?: () => void;
  action?: React.ReactNode;
}

export function PageHeader({ title, eyebrow, mode = "back", onBack, action }: Props) {
  const navigate = useNavigate();

  function handleBack() {
    if (onBack) return onBack();
    navigate(-1);
  }

  return (
    <div className="flex items-center gap-3 px-5 pt-6">
      <button onClick={handleBack} aria-label={mode === "close" ? "Close" : "Back"} className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors duration-150 hover:bg-ink-100">
        {mode === "close" ? <X size={20} /> : <ChevronLeft size={20} />}
      </button>
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="label-caps truncate">{eyebrow}</p>}
        <h1 className="truncate font-display text-lg text-ink-900">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
