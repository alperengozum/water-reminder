import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { AppState, Platform, Pressable, Text, UIManager, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MetricCard } from "@/components/metric-card";
import { PulseOnChange } from "@/components/pulse-on-change";
import { SectionCard } from "@/components/section-card";
import { ProgressWidget } from "@/components/progress-widget";
import { StreakCard } from "@/components/streak-card";
import { UndoToast } from "@/components/undo-toast";
import { addDays, getDayKey, getShortWeekday, startOfDay } from "@/lib/date";
import { formatGlasses, formatMl } from "@/lib/format";
import { computeStreak } from "@/lib/streak";
import { impactMedium, notifySuccess } from "@/lib/haptics";
import { cancelWaterReminders, scheduleWaterReminders } from "@/lib/notifications";
import { flushWidgetPendingAdds, setAndroidAppIconComplete, syncAndroidWaterWidgetFromStore } from "@/lib/widget";
import { useWaterStore, waitForWaterStoreHydration } from "@/store/use-water-store";

export default function HomeScreen() {
  const logs = useWaterStore((state) => state.logs);
  const goalMl = useWaterStore((state) => state.goalMl);
  const glassMl = useWaterStore((state) => state.glassMl);
  const addGlass = useWaterStore((state) => state.addGlass);
  const addCustom = useWaterStore((state) => state.addCustom);
  const removeLog = useWaterStore((state) => state.removeLog);
  const glassIcon = useWaterStore((state) => state.glassIcon);
  const presets = useWaterStore((state) => state.presets);
  const reminderEnabled = useWaterStore((state) => state.reminderEnabled);
  const reminderIntervalHours = useWaterStore((state) => state.reminderIntervalHours);
  const reminderStartHour = useWaterStore((state) => state.reminderStartHour);
  const reminderEndHour = useWaterStore((state) => state.reminderEndHour);

  const insets = useSafeAreaInsets();

  const [undoEntry, setUndoEntry] = React.useState<{ id: string; label: string } | null>(null);
  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUndo = React.useCallback((id: string, label: string) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoEntry({ id, label });
    undoTimerRef.current = setTimeout(() => setUndoEntry(null), 4000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const todayKey = getDayKey(new Date());
  const todayMl = React.useMemo(() => {
    return logs
      .filter((log) => getDayKey(new Date(log.timestamp)) === todayKey)
      .reduce((sum, log) => sum + log.amountMl, 0);
  }, [logs, todayKey]);

  const todayGlasses = todayMl / glassMl;
  const isComplete = todayMl >= goalMl && goalMl > 0;

  // 0–1 fraction of the drinking window elapsed; null when outside the window or complete
  const windowProgress = React.useMemo(() => {
    if (isComplete) return null;
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    if (hour <= reminderStartHour || hour >= reminderEndHour) return null;
    return (hour - reminderStartHour) / (reminderEndHour - reminderStartHour);
  }, [isComplete, reminderStartHour, reminderEndHour]);

  // Glasses behind schedule: positive = behind, negative = ahead
  const pacingBehindGlasses = React.useMemo(() => {
    if (windowProgress === null) return 0;
    const expectedMl = windowProgress * goalMl;
    return (expectedMl - todayMl) / glassMl;
  }, [windowProgress, todayMl, goalMl, glassMl]);

  const hoursLeftInWindow = React.useMemo(() => {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    if (hour >= reminderEndHour) return null;
    return Math.ceil(reminderEndHour - hour);
  }, [reminderEndHour]);

  const summary = React.useMemo(() => {
    const rounded = Math.round(todayGlasses * 10) / 10;
    const hour = new Date().getHours();
    if (rounded <= 0) {
      if (hour < 10) {
        return streak > 0
          ? `Good morning — day ${streak + 1} starts now.`
          : "Good morning — start your day with a glass.";
      }
      return "Let's start with a calm sip.";
    }
    if (pacingBehindGlasses >= 2) {
      const suffix = hoursLeftInWindow != null ? `${hoursLeftInWindow}h left today` : "drink up";
      return `${Math.round(pacingBehindGlasses)} glasses behind — ${suffix}.`;
    }
    if (pacingBehindGlasses >= 1) {
      const suffix = hoursLeftInWindow != null ? `${hoursLeftInWindow}h left today` : "nearly there";
      return `1 glass behind — ${suffix}.`;
    }
    if (pacingBehindGlasses <= -1) return "Ahead of schedule. Keep it up.";
    if (hour >= 20 && !isComplete) return "Last chance to hit your goal tonight.";
    if (rounded === 1) return "1 glass in. On pace.";
    return `${rounded} glasses in the tank.`;
  }, [todayGlasses, pacingBehindGlasses, hoursLeftInWindow, streak, isComplete]);

  const remainingGlasses = Math.max(0, Math.ceil((goalMl - todayMl) / glassMl));

  const isSprintMode = pacingBehindGlasses >= 2 && hoursLeftInWindow !== null && hoursLeftInWindow <= 3;

  const catchUpIntervalMinutes = React.useMemo(() => {
    if (remainingGlasses === 0 || hoursLeftInWindow === null) return null;
    return Math.round((hoursLeftInWindow * 60) / remainingGlasses);
  }, [remainingGlasses, hoursLeftInWindow]);

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

  const streak = React.useMemo(() => computeStreak(logs, goalMl), [logs, goalMl]);

  const handleAddGlass = React.useCallback(() => {
    addGlass();
    impactMedium();
    const id = useWaterStore.getState().logs[0]?.id;
    if (id) showUndo(id, `Added ${glassMl} ml`);
  }, [addGlass, glassMl, showUndo]);

  const handleAddCustom = React.useCallback((amountMl: number) => {
    addCustom(amountMl);
    notifySuccess();
    const id = useWaterStore.getState().logs[0]?.id;
    if (id) showUndo(id, `Added ${amountMl} ml`);
  }, [addCustom, showUndo]);

  const handleUndo = React.useCallback(() => {
    if (!undoEntry) return;
    removeLog(undoEntry.id);
    impactMedium();
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoEntry(null);
  }, [undoEntry, removeLog]);

  // On cold start: cancel reminders if goal is already hit (e.g. via widget while app
  // was closed), or reschedule if they were cancelled when the goal was hit yesterday.
  // Awaits hydration so we read real persisted state, not defaults.
  React.useEffect(() => {
    void waitForWaterStoreHydration().then(() => {
      const s = useWaterStore.getState();
      if (!s.reminderEnabled) return;
      const key = getDayKey(new Date());
      const ml = s.logs
        .filter((l) => getDayKey(new Date(l.timestamp)) === key)
        .reduce((sum, l) => sum + l.amountMl, 0);
      if (ml >= s.goalMl) {
        void cancelWaterReminders();
      } else {
        const lastDrink = s.logs.find((l) => getDayKey(new Date(l.timestamp)) === key);
        void scheduleWaterReminders(
          s.reminderIntervalHours,
          s.reminderStartHour,
          s.reminderEndHour,
          lastDrink ? new Date(lastDrink.timestamp) : undefined,
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only — intentional

  // Cancel reminders the moment the daily goal is hit; restore them if a log is
  // removed and the total drops back below the goal.
  const prevIsCompleteRef = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    const prev = prevIsCompleteRef.current;
    prevIsCompleteRef.current = isComplete;
    if (prev === null) return; // skip initial render
    if (!reminderEnabled) return;
    if (isComplete && !prev) {
      void cancelWaterReminders();
    } else if (!isComplete && prev) {
      const s = useWaterStore.getState();
      const key = getDayKey(new Date());
      const lastDrink = s.logs.find((l) => getDayKey(new Date(l.timestamp)) === key);
      void scheduleWaterReminders(
        reminderIntervalHours,
        reminderStartHour,
        reminderEndHour,
        lastDrink ? new Date(lastDrink.timestamp) : undefined,
      );
    }
  }, [isComplete, reminderEnabled, reminderIntervalHours, reminderStartHour, reminderEndHour]);

  // Drink-aware reschedule: push the next reminder out by intervalHours from each drink,
  // so a notification never fires shortly after the user already logged water.
  const lastRescheduledLogRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!reminderEnabled || isComplete) return;
    const todayLogs = logs.filter((l) => getDayKey(new Date(l.timestamp)) === todayKey);
    if (todayLogs.length === 0) return;
    const latestLog = todayLogs[0]; // logs are prepended, so [0] is most recent
    if (latestLog.id === lastRescheduledLogRef.current) return;
    lastRescheduledLogRef.current = latestLog.id;
    void scheduleWaterReminders(
      reminderIntervalHours,
      reminderStartHour,
      reminderEndHour,
      new Date(latestLog.timestamp),
    );
  }, [logs, reminderEnabled, isComplete, reminderIntervalHours, reminderStartHour, reminderEndHour, todayKey]);

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

  // Icon swap via setComponentEnabledSetting kills the app when called in the foreground.
  // Only apply it when the app goes to background — that's when the launcher reads the icon anyway.
  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        const { logs: l, goalMl: g } = useWaterStore.getState();
        const dk = getDayKey(new Date());
        const ml = l.filter((log) => getDayKey(new Date(log.timestamp)) === dk).reduce((s, log) => s + log.amountMl, 0);
        setAndroidAppIconComplete(ml >= g && g > 0);
      }
    });
    return () => sub.remove();
  }, []);

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
      <Pressable
        onPress={handleAddGlass}
        accessibilityLabel={`Log ${glassMl} ml`}
        accessibilityRole="button"
        style={({ pressed }) => ({
          flexShrink: 0,
          backgroundColor: heroBackground,
          borderRadius: 28,
          borderCurve: "continuous",
          padding: 16,
          gap: 8,
          overflow: "hidden",
          boxShadow: "0 16px 28px rgba(8, 145, 178, 0.12)",
          opacity: pressed ? 0.82 : 1,
        })}
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
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              borderCurve: "continuous",
              backgroundColor: heroTagBackground,
            }}
          >
            <Ionicons name={(glassIcon ?? "water-outline") as any} size={13} color={heroTagText} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: heroTagText }}>
              Log {glassMl} ml
            </Text>
          </View>
        </View>
      </Pressable>

      <StreakCard streak={streak} isComplete={isComplete} />

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
            label="Left today"
            value={isComplete ? "Done!" : `${remainingGlasses}`}
            subtitle={isComplete ? "goal reached" : `${remainingGlasses === 1 ? "glass" : "glasses"} to go`}
            tone={isComplete ? "warm" : "warm"}
            variant="outline"
          />
        </View>
      </View>

      {isSprintMode && (
        <Pressable
          onPress={handleAddGlass}
          hitSlop={4}
          style={({ pressed }) => ({
            backgroundColor: "#FEF2F2",
            borderRadius: 18,
            borderCurve: "continuous",
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: "#FCA5A5",
            flexShrink: 0,
            opacity: pressed ? 0.8 : 1,
          })}
          accessibilityLabel="Log a glass to catch up"
          accessibilityRole="button"
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Text selectable style={{ fontSize: 13, fontWeight: "700", color: "#DC2626" }}>
              Sprint time
            </Text>
            <Text selectable style={{ fontSize: 12, color: "#B91C1C" }}>
              {Math.round(pacingBehindGlasses)} glasses behind · {hoursLeftInWindow}h left — drink up
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#FCA5A5",
              borderRadius: 12,
              borderCurve: "continuous",
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#7F1D1D" }}>Log glass</Text>
          </View>
        </Pressable>
      )}

      {!isSprintMode && pacingBehindGlasses >= 1 && (
        <View
          style={{
            backgroundColor: "#FFF7ED",
            borderRadius: 18,
            borderCurve: "continuous",
            padding: 14,
            borderWidth: 1,
            borderColor: "#FED7AA",
            gap: 3,
            flexShrink: 0,
          }}
        >
          <Text selectable style={{ fontSize: 13, fontWeight: "700", color: "#C2410C" }}>
            {Math.round(pacingBehindGlasses) === 1 ? "1 glass behind" : `${Math.round(pacingBehindGlasses)} glasses behind`}
            {hoursLeftInWindow !== null ? ` · ${hoursLeftInWindow}h left` : ""}
          </Text>
          {catchUpIntervalMinutes !== null && (
            <Text selectable style={{ fontSize: 12, color: "#EA580C" }}>
              {"Aim for 1 glass every "}
              {catchUpIntervalMinutes < 60
                ? `${catchUpIntervalMinutes}m`
                : `${Math.round((catchUpIntervalMinutes / 60) * 10) / 10}h`}
              {" to catch up"}
            </Text>
          )}
        </View>
      )}

      <View style={{ flex: 1, minHeight: 0 }}>
        <SectionCard title="Daily flow" variant="soft">
          <View style={{ flexShrink: 1 }}>
            <ProgressWidget
              consumedMl={todayMl}
              goalMl={goalMl}
              glassMl={glassMl}
              pacingProgress={windowProgress ?? undefined}
              quickAdd={{
                glassLabel: `${glassMl} ml`,
                glassIcon,
                presets,
                onAddGlass: handleAddGlass,
                onAddCustom: handleAddCustom,
              }}
            />
          </View>
        </SectionCard>
      </View>

      {undoEntry && (
        <View
          style={{
            position: "absolute",
            bottom: Math.max(insets.bottom, 12) + 16 + 56,
            left: horizontalPad,
            right: horizontalPad,
          }}
        >
          <UndoToast label={undoEntry.label} onUndo={handleUndo} isComplete={isComplete} />
        </View>
      )}

      <Pressable
        onPress={() => router.push("/history")}
        hitSlop={12}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: Math.max(insets.bottom, 12) + 16,
          left: horizontalPad,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isComplete ? "#FEF3C7" : "#ECFEFF",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(8, 145, 178, 0.18)",
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityLabel="History"
        accessibilityRole="button"
      >
        <Ionicons name="bar-chart-outline" size={22} color={heroKicker} />
      </Pressable>

      <Pressable
        onPress={() => router.push("/settings")}
        hitSlop={12}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: Math.max(insets.bottom, 12) + 16,
          right: horizontalPad,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isComplete ? "#FEF3C7" : "#ECFEFF",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(8, 145, 178, 0.18)",
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityLabel="Settings"
        accessibilityRole="button"
      >
        <Ionicons name="settings-outline" size={22} color={heroKicker} />
      </Pressable>
    </View>
  );
}
