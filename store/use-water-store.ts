import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type WaterLog = {
  id: string;
  amountMl: number;
  timestamp: string;
  source: "glass" | "quick";
};

type WaterState = {
  goalMl: number;
  glassMl: number;
  logs: WaterLog[];
  persistentNotificationEnabled: boolean;
  addGlass: () => void;
  addCustom: (amountMl: number) => void;
  removeLog: (id: string) => void;
  setGoalGlasses: (glasses: number) => void;
  setGlassMl: (ml: number) => void;
  setPersistentNotificationEnabled: (enabled: boolean) => void;
};

const defaultGlassMl = 250;
const defaultGoalGlasses = 8;
const defaultGoalMl = defaultGlassMl * defaultGoalGlasses;

const creator: StateCreator<WaterState> = (set, get) => ({
  goalMl: defaultGoalMl,
  glassMl: defaultGlassMl,
  logs: [],
  persistentNotificationEnabled: false,
  addGlass: () => {
    const { glassMl } = get();
    const log: WaterLog = {
      id: `${Date.now()}`,
      amountMl: glassMl,
      timestamp: new Date().toISOString(),
      source: "glass",
    };
    set((state) => ({ logs: [log, ...state.logs] }));
  },
  addCustom: (amountMl: number) => {
    const log: WaterLog = {
      id: `${Date.now()}`,
      amountMl,
      timestamp: new Date().toISOString(),
      source: "quick",
    };
    set((state) => ({ logs: [log, ...state.logs] }));
  },
  removeLog: (id: string) => {
    set((state) => ({ logs: state.logs.filter((log) => log.id !== id) }));
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
