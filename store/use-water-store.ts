import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Language } from "@/lib/i18n";
import { getDayKey } from "@/lib/date";

export type WaterLog = {
  id: string;
  amountMl: number;
  timestamp: string;
  source: "glass" | "quick";
};

export type QuickPreset = {
  amountMl: number;
  icon?: string;
};

type WaterState = {
  goalMl: number;
  glassMl: number;
  logs: WaterLog[];
  dailyTotals: Record<string, number>;
  persistentNotificationEnabled: boolean;
  glassIcon?: string;
  presets: QuickPreset[];
  reminderEnabled: boolean;
  reminderIntervalHours: number;
  reminderStartHour: number;
  reminderEndHour: number;
  language: Language;
  addGlass: () => void;
  addCustom: (amountMl: number) => void;
  removeLog: (id: string) => void;
  restoreLog: (log: WaterLog) => void;
  setGoalGlasses: (glasses: number) => void;
  setGlassMl: (ml: number) => void;
  setPersistentNotificationEnabled: (enabled: boolean) => void;
  setGlassIcon: (icon: string | undefined) => void;
  setPresets: (presets: QuickPreset[]) => void;
  streakAlertEnabled: boolean;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderIntervalHours: (hours: number) => void;
  setReminderStartHour: (hour: number) => void;
  setReminderEndHour: (hour: number) => void;
  setStreakAlertEnabled: (enabled: boolean) => void;
  setLanguage: (lang: Language) => void;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
};

const defaultGlassMl = 250;
const defaultGoalGlasses = 8;
const defaultGoalMl = defaultGlassMl * defaultGoalGlasses;
const defaultPresets: QuickPreset[] = [
  { amountMl: 100 },
  { amountMl: 330 },
  { amountMl: 500 },
];

function buildDailyTotals(logs: WaterLog[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const log of logs) {
    const key = getDayKey(new Date(log.timestamp));
    totals[key] = (totals[key] ?? 0) + log.amountMl;
  }
  return totals;
}

const creator: StateCreator<WaterState> = (set, get) => ({
  goalMl: defaultGoalMl,
  glassMl: defaultGlassMl,
  logs: [],
  dailyTotals: {},
  persistentNotificationEnabled: false,
  glassIcon: "water-outline",
  presets: defaultPresets,
  reminderEnabled: false,
  reminderIntervalHours: 2,
  reminderStartHour: 8,
  reminderEndHour: 22,
  streakAlertEnabled: true,
  language: "en",
  hasSeenOnboarding: false,
  addGlass: () => {
    const { glassMl } = get();
    const log: WaterLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amountMl: glassMl,
      timestamp: new Date().toISOString(),
      source: "glass",
    };
    set((state) => {
      const key = getDayKey(new Date(log.timestamp));
      return {
        logs: [log, ...state.logs],
        dailyTotals: { ...state.dailyTotals, [key]: (state.dailyTotals[key] ?? 0) + glassMl },
      };
    });
  },
  addCustom: (amountMl: number) => {
    const log: WaterLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amountMl,
      timestamp: new Date().toISOString(),
      source: "quick",
    };
    set((state) => {
      const key = getDayKey(new Date(log.timestamp));
      return {
        logs: [log, ...state.logs],
        dailyTotals: { ...state.dailyTotals, [key]: (state.dailyTotals[key] ?? 0) + amountMl },
      };
    });
  },
  removeLog: (id: string) => {
    set((state) => {
      const removed = state.logs.find((l) => l.id === id);
      if (!removed) return {};
      const key = getDayKey(new Date(removed.timestamp));
      return {
        logs: state.logs.filter((log) => log.id !== id),
        dailyTotals: { ...state.dailyTotals, [key]: Math.max(0, (state.dailyTotals[key] ?? 0) - removed.amountMl) },
      };
    });
  },
  restoreLog: (log: WaterLog) => {
    set((state) => {
      // Insert in descending timestamp order
      const idx = state.logs.findIndex((l) => l.timestamp < log.timestamp);
      const next = [...state.logs];
      next.splice(idx === -1 ? next.length : idx, 0, log);
      const key = getDayKey(new Date(log.timestamp));
      return {
        logs: next,
        dailyTotals: { ...state.dailyTotals, [key]: (state.dailyTotals[key] ?? 0) + log.amountMl },
      };
    });
  },
  setGoalGlasses: (glasses: number) => {
    const { glassMl } = get();
    set({ goalMl: Math.max(glassMl, Math.round(glasses) * glassMl) });
  },
  setGlassMl: (ml: number) => {
    const nextMl = Math.max(100, Math.round(ml));
    set((state) => ({
      glassMl: nextMl,
      goalMl: Math.max(nextMl, Math.round(state.goalMl / state.glassMl) * nextMl),
    }));
  },
  setPersistentNotificationEnabled: (enabled: boolean) => {
    set({ persistentNotificationEnabled: enabled });
  },
  setGlassIcon: (icon) => set({ glassIcon: icon }),
  setPresets: (presets) => set({ presets }),
  setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
  setReminderIntervalHours: (hours) => set({ reminderIntervalHours: hours }),
  setReminderStartHour: (hour) => set({ reminderStartHour: hour }),
  setReminderEndHour: (hour) => set({ reminderEndHour: hour }),
  setStreakAlertEnabled: (enabled) => set({ streakAlertEnabled: enabled }),
  setLanguage: (lang) => set({ language: lang }),
  setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
});

export const useWaterStore = create<WaterState>()(
  persist(creator, {
    name: "water-reminder-storage",
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({
      goalMl: state.goalMl,
      glassMl: state.glassMl,
      logs: state.logs,
      persistentNotificationEnabled: state.persistentNotificationEnabled,
      glassIcon: state.glassIcon,
      presets: state.presets,
      reminderEnabled: state.reminderEnabled,
      reminderIntervalHours: state.reminderIntervalHours,
      reminderStartHour: state.reminderStartHour,
      reminderEndHour: state.reminderEndHour,
      streakAlertEnabled: state.streakAlertEnabled,
      language: state.language,
      hasSeenOnboarding: state.hasSeenOnboarding,
      // dailyTotals intentionally excluded — rebuilt from logs on hydration
    }),
    onRehydrateStorage: () => (state) => {
      if (state) {
        state.dailyTotals = buildDailyTotals(state.logs);
        if (!state.hasSeenOnboarding) {
          try {
            const raw = Intl.DateTimeFormat().resolvedOptions().locale;
            const tag = raw.split("-")[0].toLowerCase() as Language;
            const supported: Language[] = ["en","tr","hi","pt","es","ar","id","ru","ja","ko","de","fr","zh","bn","vi","th","it"];
            if (supported.includes(tag)) {
              state.language = tag;
            }
          } catch {}
        }
      }
    },
  }),
);

export function useIsHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(() => useWaterStore.persist.hasHydrated());
  React.useEffect(() => {
    if (hydrated) return;
    const unsub = useWaterStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, [hydrated]);
  return hydrated;
}

export function waitForWaterStoreHydration(): Promise<void> {
  if (useWaterStore.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = useWaterStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}
