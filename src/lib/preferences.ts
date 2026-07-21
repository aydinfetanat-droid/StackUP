// Lightweight local-only user preferences — sound/haptics and daily-goal
// target don't need to sync across devices, so localStorage is enough.

const SOUND_KEY = "stackup:pref:sound";
const HAPTICS_KEY = "stackup:pref:haptics";
const DAILY_GOAL_KEY = "stackup:pref:daily-goal-lessons";

export function isSoundEnabled(): boolean {
  return localStorage.getItem(SOUND_KEY) !== "off";
}
export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
}

export function isHapticsEnabled(): boolean {
  return localStorage.getItem(HAPTICS_KEY) !== "off";
}
export function setHapticsEnabled(enabled: boolean) {
  localStorage.setItem(HAPTICS_KEY, enabled ? "on" : "off");
}

export function triggerHaptic() {
  if (!isHapticsEnabled()) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
}

export function getDailyGoalLessons(): number {
  const raw = localStorage.getItem(DAILY_GOAL_KEY);
  const n = raw ? Number(raw) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}
export function setDailyGoalLessons(n: number) {
  localStorage.setItem(DAILY_GOAL_KEY, String(n));
}
