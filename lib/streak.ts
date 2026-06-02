import { addDays, getDayKey } from "@/lib/date";
import type { WaterLog } from "@/store/use-water-store";

export function computeStreak(logs: WaterLog[], goalMl: number): number {
  if (goalMl <= 0 || logs.length === 0) return 0;

  const totals = new Map<string, number>();
  for (const log of logs) {
    const key = getDayKey(new Date(log.timestamp));
    totals.set(key, (totals.get(key) ?? 0) + log.amountMl);
  }

  const today = new Date();
  const todayKey = getDayKey(today);
  // If today's goal is already met, count from today; otherwise start from yesterday
  // so an in-progress day doesn't break a running streak.
  const startDaysBack = (totals.get(todayKey) ?? 0) >= goalMl ? 0 : 1;
  let streak = 0;

  for (let i = startDaysBack; i < 366; i++) {
    const key = getDayKey(addDays(today, -i));
    if ((totals.get(key) ?? 0) >= goalMl) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
