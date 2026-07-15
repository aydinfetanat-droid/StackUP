import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const IDLE_TIMEOUT_MS = 60_000;
const FLUSH_INTERVAL_MS = 20_000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "touchstart", "scroll"] as const;

// Internal-only engaged-time tracker for pilot analytics (/admin). Accumulates
// one second per tick while the tab is visible and there's been input activity
// within the last 60s, then periodically flushes to Supabase via an atomic
// increment function. Never rendered anywhere in student-facing UI.
export function useEngagedTime() {
  const { user } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    function markActive() {
      lastActivityRef.current = Date.now();
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const tick = setInterval(() => {
      const isVisible = document.visibilityState === "visible";
      const isActive = isVisible && Date.now() - lastActivityRef.current < IDLE_TIMEOUT_MS;
      if (isActive) accumulatedRef.current += 1;
    }, 1000);

    async function flush() {
      const seconds = accumulatedRef.current;
      if (seconds > 0) {
        accumulatedRef.current = 0;
        await supabase.rpc("increment_engaged_seconds", { p_seconds: seconds });
      }
    }

    const flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
    window.addEventListener("beforeunload", flush);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
      window.removeEventListener("beforeunload", flush);
      clearInterval(tick);
      clearInterval(flushTimer);
      flush();
    };
  }, [user]);
}
