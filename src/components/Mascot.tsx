import { motion } from "framer-motion";

interface Props {
  quip: string;
  size?: "sm" | "lg";
}

export function Mascot({ quip, size = "sm" }: Props) {
  const avatarSize = size === "lg" ? "h-14 w-14 text-3xl" : "h-10 w-10 text-xl";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex items-start gap-2.5"
    >
      <div className={`flex shrink-0 items-center justify-center rounded-full bg-accent-400/20 ${avatarSize}`}>
        🐷
      </div>
      <div className="relative mt-1 rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 shadow-sm">
        <p className="text-sm font-semibold text-ink-900">{quip}</p>
      </div>
    </motion.div>
  );
}

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
