import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "stackup:bookmarked-signals";

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function useBookmarks() {
  const [bookmarked, setBookmarked] = useState<Set<string>>(() => load());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarked]));
  }, [bookmarked]);

  const toggle = useCallback((id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => bookmarked.has(id), [bookmarked]);

  return { isBookmarked, toggle, count: bookmarked.size };
}
