import { addDays, getDayKey } from "@/lib/date";
import type { WaterLog } from "@/store/use-water-store";

export function computeDailyTotals(logs: WaterLog[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const log of logs) {
    const key = getDayKey(new Date(log.timestamp));
    totals.set(key, (totals.get(key) ?? 0) + log.amountMl);
  }
  return totals;
}

export function computeAllTimeBestStreak(dailyTotals: Map<string, number>, goalMl: number): number {
  if (goalMl <= 0 || dailyTotals.size === 0) return 0;
  const days = Array.from(dailyTotals.keys()).sort();
  let best = 0;
  let current = 0;
  let prevHitDate: Date | null = null;

  for (const key of days) {
    const hit = (dailyTotals.get(key) ?? 0) >= goalMl;
    if (!hit) {
      prevHitDate = null;
      current = 0;
    } else {
      const date = new Date(key);
      if (
        prevHitDate !== null &&
        Math.round((date.getTime() - prevHitDate.getTime()) / 86400000) === 1
      ) {
        current++;
      } else {
        current = 1;
      }
      prevHitDate = date;
      if (current > best) best = current;
    }
  }

  return best;
}

export function computeAvgLast30Days(dailyTotals: Map<string, number>): number {
  const today = new Date();
  let sum = 0;
  for (let i = 0; i < 30; i++) {
    sum += dailyTotals.get(getDayKey(addDays(today, -i))) ?? 0;
  }
  return sum / 30;
}

export function computeGoalDaysLast30(dailyTotals: Map<string, number>, goalMl: number): number {
  const today = new Date();
  let count = 0;
  for (let i = 0; i < 30; i++) {
    if ((dailyTotals.get(getDayKey(addDays(today, -i))) ?? 0) >= goalMl) count++;
  }
  return count;
}

export function computeBestDayEver(dailyTotals: Map<string, number>): number {
  let best = 0;
  for (const ml of dailyTotals.values()) {
    if (ml > best) best = ml;
  }
  return best;
}

export type CalendarCell =
  | { type: "empty" }
  | {
      type: "day";
      date: Date;
      dayKey: string;
      ml: number;
      pct: number;
      isFuture: boolean;
      isToday: boolean;
    };

export function computeMonthCalendar(
  year: number,
  month: number,
  dailyTotals: Map<string, number>,
  goalMl: number,
): CalendarCell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const todayKey = getDayKey(new Date());

  const cells: CalendarCell[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ type: "empty" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayKey = getDayKey(date);
    const ml = dailyTotals.get(dayKey) ?? 0;
    cells.push({
      type: "day",
      date,
      dayKey,
      ml,
      pct: goalMl > 0 ? ml / goalMl : 0,
      isFuture: dayKey > todayKey,
      isToday: dayKey === todayKey,
    });
  }
  return cells;
}

export function computeLast30Days(
  dailyTotals: Map<string, number>,
): { value: number; dayKey: string; dateNum: number }[] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const day = addDays(today, i - 29);
    const key = getDayKey(day);
    return { value: dailyTotals.get(key) ?? 0, dayKey: key, dateNum: day.getDate() };
  });
}
