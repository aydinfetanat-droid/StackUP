import { supabase } from "./supabase";

export type AnalyticsEventType =
  | "signup"
  | "login"
  | "lesson_started"
  | "lesson_completed"
  | "streak_day_recorded"
  | "sim_trade";

export async function logEvent(
  eventType: AnalyticsEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("analytics_events").insert({
    user_id: user?.id ?? null,
    event_type: eventType,
    metadata,
  });

  if (error) {
    console.error(`Failed to log analytics event "${eventType}":`, error.message);
  }
}
