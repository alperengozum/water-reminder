import React from "react";
import { Stack } from "expo-router/stack";
import { Platform } from "react-native";
import { useTranslation } from "@/lib/i18n";

export default function HomeLayout() {
  const headerTitleColor = Platform.OS === "ios" ? "#0F172A" : "#111827";
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerTitleStyle: { color: headerTitleColor } }}>
      <Stack.Screen name="index" options={{ title: t.screenWater, headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          title: t.screenSettings,
          headerShown: true,
          headerBackTitle: t.screenWater,
          headerTintColor: "#0891B2",
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: t.screenHistory,
          headerShown: true,
          headerBackTitle: t.screenWater,
          headerTintColor: "#0891B2",
        }}
      />
    </Stack>
  );
}
