import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useWaterStore, waitForWaterStoreHydration } from "@/store/use-water-store";

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export default function WidgetDeepLinkScreen() {
  const { action, amount } = useLocalSearchParams<{ action?: string | string[]; amount?: string | string[] }>();

  React.useEffect(() => {
    const ac = new AbortController();
    const raw = normalizeParam(action);
    const rawAmount = normalizeParam(amount);

    void waitForWaterStoreHydration().then(() => {
      if (ac.signal.aborted) {
        return;
      }
      switch (raw) {
        case "add-glass":
          useWaterStore.getState().addGlass();
          break;
        case "add-quick": {
          const ml = rawAmount ? Math.round(Number(rawAmount)) : 0;
          if (ml > 0) {
            useWaterStore.getState().addCustom(ml);
          } else {
            const { presets } = useWaterStore.getState();
            useWaterStore.getState().addCustom(presets?.[0]?.amountMl ?? 100);
          }
          break;
        }
        case "analyze":
          if (!ac.signal.aborted) {
            router.replace("/history");
          }
          return;
        default:
          break;
      }
      if (!ac.signal.aborted) {
        router.replace("/");
      }
    });

    return () => ac.abort();
  }, [action, amount]);

  return null;
}
