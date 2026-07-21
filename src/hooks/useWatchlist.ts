import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "stackup:watchlist";

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function useWatchlist() {
  const [watched, setWatched] = useState<Set<string>>(() => load());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...watched]));
  }, [watched]);

  const toggle = useCallback((symbol: string) => {
    setWatched((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }, []);

  const isWatched = useCallback((symbol: string) => watched.has(symbol), [watched]);

  return { isWatched, toggle, count: watched.size };
}
