import React from "react";
import { Pressable, Platform, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { LogList } from "@/components/log-list";
import { SectionCard } from "@/components/section-card";
import { Stepper } from "@/components/stepper";
import { impactLight, impactMedium } from "@/lib/haptics";
import {
  requestAndroidPostNotificationsPermission,
  setAndroidPersistentNotificationEnabled,
  syncAndroidWaterWidgetFromStore,
} from "@/lib/widget";
import { useWaterStore } from "@/store/use-water-store";

export default function SettingsScreen() {
  const rawView = useLocalSearchParams<{ view?: string | string[] }>().view;
  const viewParam = React.useMemo(
    () => (Array.isArray(rawView) ? rawView[0] : rawView),
    [rawView]
  );

  const logs = useWaterStore((state) => state.logs);
  const goalMl = useWaterStore((state) => state.goalMl);
  const glassMl = useWaterStore((state) => state.glassMl);
  const removeLog = useWaterStore((state) => state.removeLog);
  const setGoalGlasses = useWaterStore((state) => state.setGoalGlasses);
  const setGlassMl = useWaterStore((state) => state.setGlassMl);
  const persistentNotificationEnabled = useWaterStore((state) => state.persistentNotificationEnabled);
  const setPersistentNotificationEnabled = useWaterStore((state) => state.setPersistentNotificationEnabled);

  const [recentLogsExpanded, setRecentLogsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (viewParam === "recent-logs") {
      setRecentLogsExpanded(true);
    }
  }, [viewParam]);

  const insets = useSafeAreaInsets();
  const horizontalPad = 20;
  const columnGap = 12;
  const goalGlasses = Math.round(goalMl / glassMl);

  const handleRemoveLog = React.useCallback(
    (id: string) => {
      impactMedium();
      removeLog(id);
    },
    [removeLog]
  );

  const toggleRecentLogs = React.useCallback(() => {
    impactLight();
    setRecentLogsExpanded((open) => !open);
  }, []);

  const onPersistentNotificationChange = React.useCallback(
    async (next: boolean) => {
      impactLight();
      switch (next) {
        case false:
          setPersistentNotificationEnabled(false);
          setAndroidPersistentNotificationEnabled(false);
          return;
        default: {
          const ok = await requestAndroidPostNotificationsPermission();
          if (!ok) {
            return;
          }
          setPersistentNotificationEnabled(true);
          setAndroidPersistentNotificationEnabled(true);
          syncAndroidWaterWidgetFromStore();
        }
      }
    },
    [setPersistentNotificationEnabled],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 20),
          gap: columnGap,
        }}
      >
        <SectionCard variant="soft">
          <Stepper
            label="Daily goal"
            value={`${goalGlasses} glasses`}
            onIncrement={() => {
              impactLight();
              setGoalGlasses(goalGlasses + 1);
            }}
            onDecrement={() => {
              impactLight();
              setGoalGlasses(Math.max(1, goalGlasses - 1));
            }}
          />
          <Stepper
            label="Glass size"
            value={`${glassMl} ml`}
            onIncrement={() => {
              impactLight();
              setGlassMl(glassMl + 25);
            }}
            onDecrement={() => {
              impactLight();
              setGlassMl(Math.max(100, glassMl - 25));
            }}
          />
        </SectionCard>

        {Platform.OS === "android" ? (
          <SectionCard variant="soft">
            <View style={{ gap: 6 }}>
              <Text
                selectable
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.6,
                  color: "#0891B2",
                  textTransform: "uppercase",
                }}
              >
                Status bar
              </Text>
              <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
                Persistent notification
              </Text>
              <Text selectable style={{ fontSize: 14, lineHeight: 20, color: "#64748B" }}>
                Always-on summary in the shade; tap actions to add your glass size or +100 ml (same
                as the home screen widget).
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                paddingTop: 4,
              }}
            >
              <Text selectable style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#334155" }}>
                On
              </Text>
              <Switch
                accessibilityLabel="Persistent notification"
                value={persistentNotificationEnabled}
                onValueChange={onPersistentNotificationChange}
                trackColor={{ false: "#CBD5E1", true: "#99F6E4" }}
                thumbColor={persistentNotificationEnabled ? "#0D9488" : "#F1F5F9"}
              />
            </View>
          </SectionCard>
        ) : null}

        <SectionCard variant="soft">
          <Pressable
            testID="recent-logs"
            accessibilityRole="button"
            accessibilityLabel="Recent logs"
            accessibilityState={{ expanded: recentLogsExpanded }}
            onPress={toggleRecentLogs}
            style={({ pressed }) => ({
              gap: 4,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Text selectable style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>
                Recent logs
              </Text>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  width: 26,
                  height: 26,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    color: "#94A3B8",
                    fontWeight: "600",
                    includeFontPadding: false,
                    ...(recentLogsExpanded && {
                      transform: [{ translateX: -1 }, { translateY: 2 }, { rotate: "90deg" }],
                    }),
                  }}
                >
                  ›
                </Text>
              </View>
            </View>
            <Text selectable style={{ fontSize: 13, color: "#64748B" }}>
              {recentLogsExpanded
                ? "Tap header to collapse"
                : `${logs.length === 0 ? "No entries yet — " : ""}Tap to show`}
            </Text>
          </Pressable>

          {recentLogsExpanded ? <LogList logs={logs} onRemove={handleRemoveLog} /> : null}
        </SectionCard>
      </ScrollView>
    </View>
  );
}
