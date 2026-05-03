import React from "react";
import { Platform, Pressable, Text, UIManager, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MetricCard } from "@/components/metric-card";
import { PulseOnChange } from "@/components/pulse-on-change";
import { SectionCard } from "@/components/section-card";
import { ProgressWidget } from "@/components/progress-widget";
import { addDays, getDayKey, getShortWeekday, startOfDay } from "@/lib/date";
import { formatGlasses, formatMl } from "@/lib/format";
import { impactMedium, notifySuccess } from "@/lib/haptics";
import { flushWidgetPendingAdds, syncAndroidWaterWidgetFromStore } from "@/lib/widget";
import { useWaterStore } from "@/store/use-water-store";

const dailySummary = (glasses: number) => {
  const rounded = Math.round(glasses * 10) / 10;
  if (rounded <= 0) {
    return "Let’s start with a calm sip.";
  }
  if (rounded === 1) {
    return "1 glass in. Smooth start.";
  }
  return `${rounded} glasses in the tank.`;
};

export default function HomeScreen() {
  const logs = useWaterStore((state) => state.logs);
  const goalMl = useWaterStore((state) => state.goalMl);
  const glassMl = useWaterStore((state) => state.glassMl);
  const addGlass = useWaterStore((state) => state.addGlass);
  const addCustom = useWaterStore((state) => state.addCustom);

  const insets = useSafeAreaInsets();

  const todayKey = getDayKey(new Date());
  const todayMl = React.useMemo(() => {
    return logs
      .filter((log) => getDayKey(new Date(log.timestamp)) === todayKey)
      .reduce((sum, log) => sum + log.amountMl, 0);
  }, [logs, todayKey]);

  const todayGlasses = todayMl / glassMl;
  const summary = dailySummary(todayGlasses);
  const isComplete = todayMl >= goalMl && goalMl > 0;

  const pageBackground = isComplete ? "#FFFBEB" : "#F8FAFC";
  const heroBackground = isComplete ? "#FEF3C7" : "#ECFEFF";
  const heroBubble = isComplete ? "#FDE68A" : "#CFFAFE";
  const heroBubbleAlt = isComplete ? "#FECACA" : "#BAE6FD";
  const heroBubbleLight = isComplete ? "#FFE4E6" : "#E0F2FE";
  const heroTagBackground = isComplete ? "#FDE68A" : "#A5F3FC";
  const heroTagText = isComplete ? "#92400E" : "#0E7490";
  const heroKicker = isComplete ? "#B45309" : "#0891B2";
  const heroSummary = isComplete ? "#B45309" : "#0E7490";

  const weeklyData = React.useMemo(() => {
    const start = startOfDay(addDays(new Date(), -6));
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(start, index);
      const dayKey = getDayKey(day);
      const total = logs
        .filter((log) => getDayKey(new Date(log.timestamp)) === dayKey)
        .reduce((sum, log) => sum + log.amountMl, 0);
      return {
        label: getShortWeekday(day),
        value: total,
      };
    });
  }, [logs]);

  const weeklyPaceMl = React.useMemo(
    () => weeklyData.reduce((sum, item) => sum + item.value, 0) / weeklyData.length,
    [weeklyData],
  );

  const handleAddGlass = React.useCallback(() => {
    addGlass();
    impactMedium();
  }, [addGlass]);

  const handleAddCustom = React.useCallback(() => {
    addCustom(100);
    notifySuccess();
  }, [addCustom]);

  React.useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    let cancelled = false;
    void flushWidgetPendingAdds().then(() => {
      if (!cancelled) {
        syncAndroidWaterWidgetFromStore();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [todayMl, goalMl, glassMl, weeklyPaceMl, logs]);

  const horizontalPad = 20;
  const columnGap = 12;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: pageBackground,
        paddingTop: insets.top + 8,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingHorizontal: horizontalPad,
        gap: columnGap,
      }}
    >
      <View
        style={{
          flexShrink: 0,
          backgroundColor: heroBackground,
          borderRadius: 28,
          borderCurve: "continuous",
          padding: 16,
          gap: 8,
          overflow: "hidden",
          boxShadow: "0 16px 28px rgba(8, 145, 178, 0.12)",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: 999,
            borderCurve: "continuous",
            backgroundColor: heroBubble,
            top: -36,
            right: -22,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            borderRadius: 999,
            borderCurve: "continuous",
            backgroundColor: heroBubbleAlt,
            bottom: -18,
            right: 40,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 44,
            height: 44,
            borderRadius: 999,
            borderCurve: "continuous",
            backgroundColor: heroBubbleLight,
            top: 24,
            left: -16,
          }}
        />
        <Text selectable style={{ fontSize: 12, fontWeight: "700", color: heroKicker }}>
          Today
        </Text>
        <Text selectable style={{ fontSize: 28, fontWeight: "800", color: "#0F172A" }}>
          Hydration check-in
        </Text>
        <Text selectable style={{ fontSize: 14, color: heroSummary }}>
          {summary}
        </Text>
        <View
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            borderCurve: "continuous",
            backgroundColor: heroTagBackground,
          }}
        >
          <PulseOnChange watch={todayMl}>
            <Text selectable style={{ fontSize: 12, fontWeight: "700", color: heroTagText }}>
              {formatMl(todayMl)} so far · Goal {formatMl(goalMl)}
            </Text>
          </PulseOnChange>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, flexShrink: 0 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            label="So far"
            value={formatMl(todayMl)}
            subtitle={`${formatGlasses(todayGlasses)} glasses`}
            tone={isComplete ? "warm" : "cool"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <MetricCard
            label="Weekly pace"
            value={formatMl(weeklyPaceMl)}
            subtitle="7-day avg"
            tone={isComplete ? "warm" : "warm"}
            variant="outline"
          />
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 0 }}>
        <SectionCard title="Daily flow" variant="soft">
          <View style={{ flexShrink: 1 }}>
            <ProgressWidget
              consumedMl={todayMl}
              goalMl={goalMl}
              glassMl={glassMl}
              quickAdd={{
                glassLabel: `${glassMl} ml`,
                onAddGlass: handleAddGlass,
                onAddCustom: handleAddCustom,
              }}
            />
          </View>
        </SectionCard>
      </View>

      <Pressable
        onPress={() => router.push("/settings")}
        style={({ pressed }) => ({
          flexShrink: 0,
          backgroundColor: pressed ? "#EEF2F6" : "#F8FAFC",
          borderRadius: 20,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: "#E2E8F0",
          padding: 16,
          boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
          opacity: pressed ? 0.96 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text selectable style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>
              Settings
            </Text>
            <Text selectable style={{ fontSize: 13, color: "#64748B" }}>
              Daily goal · Glass size ·{" "}
              <Text
                accessibilityRole="link"
                accessibilityLabel="Recent logs — open expanded"
                suppressHighlighting={false}
                onPress={() =>
                  router.push({ pathname: "/settings", params: { view: "recent-logs" } })
                }
                style={{ fontSize: 13, color: "#64748B" }}
              >
                Recent logs
              </Text>
            </Text>
          </View>
          <Text style={{ fontSize: 22, color: "#94A3B8", fontWeight: "600" }}>›</Text>
        </View>
      </Pressable>
    </View>
  );
}
