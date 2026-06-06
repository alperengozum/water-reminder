import { addDays, getDayKey } from "@/lib/date";

export function computeStreak(dailyTotals: Record<string, number>, goalMl: number): number {
  if (goalMl <= 0) return 0;

  const today = new Date();
  const todayKey = getDayKey(today);
  const startDaysBack = (dailyTotals[todayKey] ?? 0) >= goalMl ? 0 : 1;
  let streak = 0;

  for (let i = startDaysBack; i < 366; i++) {
    const key = getDayKey(addDays(today, -i));
    if ((dailyTotals[key] ?? 0) >= goalMl) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
