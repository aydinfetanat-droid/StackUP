import { supabase } from "./supabase";
import { streakWeekNumber } from "./streak";

export function weeklyBonusAmount(weekNumber: number): number {
  return Math.min(10 + 2 * (weekNumber - 1), 100);
}

// Grants any streak-week bonuses the user has earned but not yet received.
// Idempotent per (user, week_number) via the unique constraint on stack_grants.
// Returns the total newly-granted amount, if any.
export async function syncWeeklyStackGrants(userId: string, streakDays: number): Promise<number> {
  const maxWeek = streakWeekNumber(streakDays);
  if (maxWeek < 1) return 0;

  const { data: existing } = await supabase.from("stack_grants").select("week_number").eq("user_id", userId);
  const grantedWeeks = new Set((existing ?? []).map((r) => r.week_number as number));

  let totalNew = 0;
  for (let w = 1; w <= maxWeek; w++) {
    if (grantedWeeks.has(w)) continue;
    const amount = weeklyBonusAmount(w);
    const { error } = await supabase
      .from("stack_grants")
      .insert({ user_id: userId, week_number: w, amount_stacks: amount });
    if (!error) totalNew += amount;
  }

  if (totalNew > 0) {
    const { data: account } = await supabase
      .from("simulator_accounts")
      .select("cash_balance_stacks")
      .eq("user_id", userId)
      .maybeSingle();
    if (account) {
      await supabase
        .from("simulator_accounts")
        .update({ cash_balance_stacks: Number(account.cash_balance_stacks) + totalNew })
        .eq("user_id", userId);
    }
  }

  return totalNew;
}
