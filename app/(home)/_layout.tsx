import React from "react";
import { Stack } from "expo-router/stack";
import { Platform } from "react-native";

export default function HomeLayout() {
  const headerTitleColor = Platform.OS === "ios" ? "#0F172A" : "#111827";

  return (
    <Stack screenOptions={{ headerTitleStyle: { color: headerTitleColor } }}>
      <Stack.Screen name="index" options={{ title: "Water", headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: true,
          headerBackTitle: "Water",
          headerTintColor: "#0891B2",
        }}
      />
    </Stack>
  );
}
