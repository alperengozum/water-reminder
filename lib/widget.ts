import { NativeModules, PermissionsAndroid, Platform } from "react-native";
import { addDays, getDayKey, startOfDay } from "@/lib/date";
import { useWaterStore, waitForWaterStoreHydration, type WaterLog } from "@/store/use-water-store";

type WaterWidgetPayload = {
  todayMl: number;
  goalMl: number;
  glassMl: number;
  weeklyPaceMl: number;
  weeklyDayTotals?: Record<string, number>;
};

type WaterWidgetNativeModule = {
  syncWidget?: (payload: WaterWidgetPayload) => void;
  updateWidget?: (todayMl: number, goalMl: number, glassMl: number) => void;
  consumePendingWidgetAdds?: () => Promise<string>;
  setPersistentNotificationEnabled?: (enabled: boolean) => void;
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
) {
  if (process.env.EXPO_OS !== "android") {
    return;
  }
  if (!moduleRef) {
    return;
  }
  if (moduleRef.syncWidget) {
    const payload: WaterWidgetPayload = { todayMl, goalMl, glassMl, weeklyPaceMl };
    if (weeklyDayTotals !== undefined) {
      payload.weeklyDayTotals = weeklyDayTotals;
    }
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
  const { logs, goalMl, glassMl } = useWaterStore.getState();
  const dayKey = getDayKey(new Date());
  const todayMl = todayMlFromLogs(logs, dayKey);
  const weeklyPaceMl = weeklyPaceFromLogs(logs);
  const weeklyDayTotals = weeklyDayTotalsFromLogs(logs);
  updateWaterWidget(todayMl, goalMl, glassMl, weeklyPaceMl, weeklyDayTotals);
}

export function setAndroidPersistentNotificationEnabled(enabled: boolean): void {
  if (process.env.EXPO_OS !== "android") {
    return;
  }
  moduleRef?.setPersistentNotificationEnabled?.(enabled);
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
