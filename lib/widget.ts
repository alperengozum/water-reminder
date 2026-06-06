import { NativeModules, PermissionsAndroid, Platform } from "react-native";
import { addDays, getDayKey, startOfDay } from "@/lib/date";
import { computeStreak } from "@/lib/streak";
import { useWaterStore, waitForWaterStoreHydration, type WaterLog } from "@/store/use-water-store";
import type { Language } from "@/lib/i18n";

type WaterWidgetPayload = {
  todayMl: number;
  goalMl: number;
  glassMl: number;
  glassIcon?: string;
  weeklyPaceMl: number;
  /** Local calendar yyyy-MM-dd; must match today's logs bucket in getDayKey. */
  dayKey: string;
  weeklyDayTotals?: Record<string, number>;
  presets?: Array<{ amountMl: number; icon?: string }>;
  streakDays?: number;
  language?: Language;
};

type WaterWidgetNativeModule = {
  syncWidget?: (payload: WaterWidgetPayload) => void;
  updateWidget?: (todayMl: number, goalMl: number, glassMl: number) => void;
  consumePendingWidgetAdds?: () => Promise<string>;
  setPersistentNotificationEnabled?: (enabled: boolean) => void;
  setIconComplete?: (isComplete: boolean) => void;
};

const moduleRef = NativeModules.WaterWidget as WaterWidgetNativeModule | undefined;

let flushChain: Promise<void> | null = null;

function todayMlFromLogs(logs: WaterLog[], dayKey: string): number {
  return logs
    .filter((log) => getDayKey(new Date(log.timestamp)) === dayKey)
    .reduce((sum, log) => sum + log.amountMl, 0);
}

function weeklyPaceFromLogs(logs: WaterLog[]): number {
  const start = startOfDay(addDays(new Date(), -6));
  const totals = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    const key = getDayKey(day);
    return logs
      .filter((log) => getDayKey(new Date(log.timestamp)) === key)
      .reduce((sum, log) => sum + log.amountMl, 0);
  });
  return totals.reduce((s, v) => s + v, 0) / totals.length;
}

function weeklyDayTotalsFromLogs(logs: WaterLog[]): Record<string, number> {
  const start = startOfDay(addDays(new Date(), -6));
  const out: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    const key = getDayKey(day);
    out[key] = todayMlFromLogs(logs, key);
  }
  return out;
}

export function updateWaterWidget(
  todayMl: number,
  goalMl: number,
  glassMl: number,
  weeklyPaceMl: number,
  weeklyDayTotals?: Record<string, number>,
  dayKey: string = getDayKey(new Date()),
  glassIcon?: string,
  presets?: Array<{ amountMl: number; icon?: string }>,
  streakDays?: number,
  language?: Language,
) {
  if (process.env.EXPO_OS !== "android") {
    return;
  }
  if (!moduleRef) {
    return;
  }
  if (moduleRef.syncWidget) {
    const payload: WaterWidgetPayload = { todayMl, goalMl, glassMl, weeklyPaceMl, dayKey };
    if (weeklyDayTotals !== undefined) payload.weeklyDayTotals = weeklyDayTotals;
    if (glassIcon !== undefined) payload.glassIcon = glassIcon;
    if (presets !== undefined) payload.presets = presets;
    if (streakDays !== undefined) payload.streakDays = streakDays;
    if (language !== undefined) payload.language = language;
    moduleRef.syncWidget(payload);
    return;
  }
  moduleRef.updateWidget?.(todayMl, goalMl, glassMl);
}

export function flushWidgetPendingAdds(): Promise<void> {
  if (process.env.EXPO_OS !== "android") {
    return Promise.resolve();
  }
  if (!flushChain) {
    flushChain = (async () => {
      await waitForWaterStoreHydration();
      if (!moduleRef?.consumePendingWidgetAdds) {
        return;
      }
      const json = await moduleRef.consumePendingWidgetAdds();
      if (!json || json === "[]") {
        return;
      }
      let items: { amountMl: number }[];
      try {
        items = JSON.parse(json) as { amountMl: number }[];
      } catch {
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }
      for (const item of items) {
        const ml = Math.round(Number(item.amountMl));
        if (ml > 0) {
          useWaterStore.getState().addCustom(ml);
        }
      }
    })().finally(() => {
      flushChain = null;
    });
  }
  return flushChain;
}

export function syncAndroidWaterWidgetFromStore(): void {
  if (process.env.EXPO_OS !== "android") {
    return;
  }
  const { logs, goalMl, glassMl, glassIcon, presets, language } = useWaterStore.getState();
  const dayKey = getDayKey(new Date());
  const todayMl = todayMlFromLogs(logs, dayKey);
  const weeklyPaceMl = weeklyPaceFromLogs(logs);
  const weeklyDayTotals = weeklyDayTotalsFromLogs(logs);
  const streakDays = computeStreak(logs, goalMl);
  updateWaterWidget(todayMl, goalMl, glassMl, weeklyPaceMl, weeklyDayTotals, dayKey, glassIcon, presets, streakDays, language);
}

export function setAndroidPersistentNotificationEnabled(enabled: boolean): void {
  if (process.env.EXPO_OS !== "android") {
    return;
  }
  moduleRef?.setPersistentNotificationEnabled?.(enabled);
}

export function setAndroidAppIconComplete(isComplete: boolean): void {
  if (process.env.EXPO_OS !== "android") {
    return;
  }
  moduleRef?.setIconComplete?.(isComplete);
}

export async function requestAndroidPostNotificationsPermission(): Promise<boolean> {
  if (process.env.EXPO_OS !== "android") {
    return true;
  }
  if (Platform.Version < 33) {
    return true;
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
