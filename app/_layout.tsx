import React from "react";
import { Stack } from "expo-router/stack";
import { AppState, DeviceEventEmitter, Platform } from "react-native";
import "@/lib/notifications";
import {
  flushWidgetPendingAdds,
  setAndroidPersistentNotificationEnabled,
  syncAndroidWaterWidgetFromStore,
} from "@/lib/widget";
import { useWaterStore } from "@/store/use-water-store";

export default function RootLayout() {
  const headerTitleColor = Platform.OS === "ios" ? "#0F172A" : "#111827";

  React.useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    void flushWidgetPendingAdds().then(() => {
      const enabled = useWaterStore.getState().persistentNotificationEnabled;
      setAndroidPersistentNotificationEnabled(enabled);
      syncAndroidWaterWidgetFromStore();
    });

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void flushWidgetPendingAdds().then(() => {
          syncAndroidWaterWidgetFromStore();
        });
      }
    });

    const eventSub = DeviceEventEmitter.addListener("waterWidgetPendingAdd", () => {
      void flushWidgetPendingAdds().then(() => {
        syncAndroidWaterWidgetFromStore();
      });
    });

    return () => {
      appStateSub.remove();
      eventSub.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerLargeTitle: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerTitleStyle: { color: headerTitleColor },
        headerBackButtonDisplayMode: "minimal",
      }}
    />
  );
}
