import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Language } from "@/lib/i18n";

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

const creator: StateCreator<WaterState> = (set, get) => ({
  goalMl: defaultGoalMl,
  glassMl: defaultGlassMl,
  logs: [],
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
    set((state) => ({ logs: [log, ...state.logs] }));
  },
  addCustom: (amountMl: number) => {
    const log: WaterLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amountMl,
      timestamp: new Date().toISOString(),
      source: "quick",
    };
    set((state) => ({ logs: [log, ...state.logs] }));
  },
  removeLog: (id: string) => {
    set((state) => ({ logs: state.logs.filter((log) => log.id !== id) }));
  },
  restoreLog: (log: WaterLog) => {
    set((state) => {
      // Insert in descending timestamp order
      const idx = state.logs.findIndex((l) => l.timestamp < log.timestamp);
      const next = [...state.logs];
      next.splice(idx === -1 ? next.length : idx, 0, log);
      return { logs: next };
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
    }),
  }),
);

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
