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
  const { action } = useLocalSearchParams<{ action?: string | string[] }>();

  React.useEffect(() => {
    const ac = new AbortController();
    const raw = normalizeParam(action);

    void waitForWaterStoreHydration().then(() => {
      if (ac.signal.aborted) {
        return;
      }
      switch (raw) {
        case "add-glass":
          useWaterStore.getState().addGlass();
          break;
        case "add-quick":
          useWaterStore.getState().addCustom(100);
          break;
        case "analyze":
        default:
          break;
      }
      if (!ac.signal.aborted) {
        router.replace("/");
      }
    });

    return () => ac.abort();
  }, [action]);

  return null;
}
