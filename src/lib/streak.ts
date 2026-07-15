const LA_TIME_ZONE = "America/Los_Angeles";

const laDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: LA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Formats a timestamp as its America/Los_Angeles calendar date, e.g. "2026-07-11".
export function toLaDateString(date: Date): string {
  return laDateFormatter.format(date);
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export interface StreakInfo {
  current: number;
  completedToday: boolean;
  atRisk: boolean;
}

// Derives the user's current streak from lesson_completions timestamps, bucketed
// into America/Los_Angeles calendar days. A streak day requires >=1 completion
// that day; the streak counts consecutive days walking back from today.
export function computeStreak(completedAtTimestamps: string[]): StreakInfo {
  const activeDays = new Set(completedAtTimestamps.map((ts) => toLaDateString(new Date(ts))));

  const today = toLaDateString(new Date());
  const yesterday = addDays(today, -1);

  const completedToday = activeDays.has(today);

  // The streak is still "alive" if today or yesterday has activity; otherwise it's broken.
  let cursor = completedToday ? today : activeDays.has(yesterday) ? yesterday : null;

  let current = 0;
  while (cursor && activeDays.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    current,
    completedToday,
    atRisk: current > 0 && !completedToday,
  };
}

// Number of full consecutive weeks (7-day blocks) represented by a streak length.
export function streakWeekNumber(streakDays: number): number {
  return Math.floor(streakDays / 7);
}
