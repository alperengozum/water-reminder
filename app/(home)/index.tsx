import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { AppState, Platform, Pressable, ScrollView, Text, UIManager, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MetricCard } from "@/components/metric-card";
import { PulseOnChange } from "@/components/pulse-on-change";
import { SectionCard } from "@/components/section-card";
import { ProgressWidget } from "@/components/progress-widget";
import { StreakCard } from "@/components/streak-card";
import { WeeklyChart } from "@/components/weekly-chart";
import { UndoToast } from "@/components/undo-toast";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { addDays, getDayKey, getShortWeekday, startOfDay } from "@/lib/date";
import { formatGlasses, formatMl } from "@/lib/format";
import { computeStreak } from "@/lib/streak";
import { impactMedium, notifySuccess } from "@/lib/haptics";
import { cancelStreakAtRiskAlert, cancelWaterReminders, scheduleStreakAtRiskAlert, scheduleWaterReminders } from "@/lib/notifications";
import { flushWidgetPendingAdds, setAndroidAppIconComplete, syncAndroidWaterWidgetFromStore } from "@/lib/widget";
import { useIsHydrated, useWaterStore, waitForWaterStoreHydration } from "@/store/use-water-store";
import { useTranslation } from "@/lib/i18n";

export default function HomeScreen() {
  const logs = useWaterStore((state) => state.logs);
  const dailyTotals = useWaterStore((state) => state.dailyTotals);
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
  const streakAlertEnabled = useWaterStore((state) => state.streakAlertEnabled);
  const hasSeenOnboarding = useWaterStore((state) => state.hasSeenOnboarding);
  const setHasSeenOnboarding = useWaterStore((state) => state.setHasSeenOnboarding);

  const isHydrated = useIsHydrated();
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();

  const [undoEntry, setUndoEntry] = React.useState<{ id: string; label: string } | null>(null);
  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetSyncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const todayMl = dailyTotals[todayKey] ?? 0;

  const todayGlasses = todayMl / glassMl;
  const isComplete = todayMl >= goalMl && goalMl > 0;

  // 0–1 fraction of the drinking window elapsed; null when outside the window or complete
  const windowProgress = React.useMemo(() => {
    if (isComplete) return null;
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour < reminderStartHour || hour >= reminderEndHour) return null;
    return (hour - reminderStartHour) / (reminderEndHour - reminderStartHour);
  }, [isComplete, reminderStartHour, reminderEndHour]);

  // Glasses behind schedule: positive = behind, negative = ahead
  const pacingBehindGlasses = React.useMemo(() => {
    if (windowProgress === null) return 0;
    const expectedMl = windowProgress * goalMl;
    return (expectedMl - todayMl) / glassMl;
  }, [windowProgress, todayMl, goalMl, glassMl]);

  const hoursLeftInWindow = React.useMemo(() => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour >= reminderEndHour) return null;
    return Math.floor(reminderEndHour - hour);
  }, [reminderEndHour]);

  const streak = React.useMemo(() => computeStreak(dailyTotals, goalMl), [dailyTotals, goalMl]);

  const summary = React.useMemo(() => {
    const rounded = Math.round(todayGlasses * 10) / 10;
    const hour = new Date().getHours();
    if (rounded <= 0) {
      if (logs.length === 0) return t.summaryDayZero;
      if (hour < 10) {
        return streak > 0
          ? t.summaryMorningStreak(streak + 1)
          : t.summaryMorningStart;
      }
      return t.summaryCalmSip;
    }
    if (pacingBehindGlasses >= 2) {
      const suffix = hoursLeftInWindow != null ? t.hLeftToday(hoursLeftInWindow) : t.drinkUp;
      return t.summaryBehindMany(Math.round(pacingBehindGlasses), suffix);
    }
    if (pacingBehindGlasses >= 1) {
      const suffix = hoursLeftInWindow != null ? t.hLeftToday(hoursLeftInWindow) : t.nearlyThere;
      return t.summaryBehind1(suffix);
    }
    if (pacingBehindGlasses <= -1) return t.summaryAhead;
    if (hour >= 20 && !isComplete) return t.summaryLastChance;
    if (rounded === 1) return t.summary1Glass;
    return t.summaryGlasses(rounded);
  }, [logs, todayGlasses, pacingBehindGlasses, hoursLeftInWindow, streak, isComplete, t]);

  const remainingGlasses = Math.max(0, Math.ceil((goalMl - todayMl) / glassMl));

  const isSprintMode = pacingBehindGlasses >= 2 && hoursLeftInWindow !== null && hoursLeftInWindow <= 3;

  const catchUpIntervalMinutes = React.useMemo(() => {
    if (remainingGlasses === 0 || hoursLeftInWindow === null) return null;
    return Math.round((hoursLeftInWindow * 60) / remainingGlasses);
  }, [remainingGlasses, hoursLeftInWindow]);

  // "Next drink" hint — derived from last drink + interval, or window start if no drinks today
  const nextDrinkHint = React.useMemo(() => {
    if (isComplete || !reminderEnabled) return null;
    const now = new Date();
    const nowHour = now.getHours() + now.getMinutes() / 60;
    if (nowHour >= reminderEndHour) return null;
    const lastTodayLog = logs.find((l) => getDayKey(new Date(l.timestamp)) === todayKey);
    let nextMs: number;
    if (lastTodayLog) {
      nextMs = new Date(lastTodayLog.timestamp).getTime() + reminderIntervalHours * 3600_000;
    } else {
      const windowStart = new Date(now);
      windowStart.setHours(reminderStartHour, 0, 0, 0);
      nextMs = windowStart.getTime();
    }
    const next = new Date(nextMs);
    if (next <= now) return t.drinkNow;
    const h = next.getHours();
    const m = next.getMinutes();
    const period = h < 12 ? "AM" : "PM";
    const displayH = h % 12 || 12;
    const displayM = m === 0 ? "" : `:${String(m).padStart(2, "0")}`;
    return t.nextDrinkAt(`${displayH}${displayM} ${period}`);
  }, [isComplete, reminderEnabled, logs, todayKey, reminderIntervalHours, reminderStartHour, reminderEndHour, t]);

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
      return {
        label: getShortWeekday(day, language),
        value: dailyTotals[dayKey] ?? 0,
      };
    });
  }, [dailyTotals, language]);

  const weeklyPaceMl = React.useMemo(
    () => weeklyData.reduce((sum, item) => sum + item.value, 0) / weeklyData.length,
    [weeklyData],
  );

  const handleAddGlass = React.useCallback(() => {
    addGlass();
    impactMedium();
    const id = useWaterStore.getState().logs[0]?.id;
    if (id) showUndo(id, t.addedAmount(formatMl(glassMl)));
  }, [addGlass, glassMl, showUndo, t]);

  const handleAddCustom = React.useCallback((amountMl: number) => {
    addCustom(amountMl);
    notifySuccess();
    const id = useWaterStore.getState().logs[0]?.id;
    if (id) showUndo(id, t.addedAmount(formatMl(amountMl)));
  }, [addCustom, showUndo, t]);

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
      const ml = s.dailyTotals[key] ?? 0;
      if (ml >= s.goalMl) {
        void cancelWaterReminders();
      } else {
        const lastDrink = s.logs.find((l) => getDayKey(new Date(l.timestamp)) === key);
        const streakVal = computeStreak(s.dailyTotals, s.goalMl);
        const remainingGlasses = Math.max(0, Math.ceil((s.goalMl - ml) / s.glassMl));
        void scheduleWaterReminders(
          s.reminderIntervalHours,
          s.reminderStartHour,
          s.reminderEndHour,
          lastDrink ? new Date(lastDrink.timestamp) : undefined,
          s.streakAlertEnabled ? { streak: streakVal, remainingGlasses } : undefined,
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
        streakAlertEnabled ? { streak, remainingGlasses } : undefined,
      );
    }
  }, [isComplete, reminderEnabled, reminderIntervalHours, reminderStartHour, reminderEndHour, streakAlertEnabled, streak, remainingGlasses]);

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
      streakAlertEnabled ? { streak, remainingGlasses } : undefined,
    );
  }, [logs, reminderEnabled, isComplete, reminderIntervalHours, reminderStartHour, reminderEndHour, todayKey, streak, remainingGlasses, streakAlertEnabled]);

  // When reminders are off but streak alert is on, manage the streak notification independently.
  React.useEffect(() => {
    if (reminderEnabled) return; // scheduleWaterReminders handles it
    if (!streakAlertEnabled || isComplete || streak === 0 || remainingGlasses === 0) {
      void cancelStreakAtRiskAlert();
      return;
    }
    void scheduleStreakAtRiskAlert(streak, remainingGlasses, reminderEndHour, reminderStartHour);
  }, [reminderEnabled, streakAlertEnabled, isComplete, streak, remainingGlasses, reminderEndHour, reminderStartHour]);

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
      if (cancelled) return;
      if (widgetSyncTimerRef.current) clearTimeout(widgetSyncTimerRef.current);
      widgetSyncTimerRef.current = setTimeout(syncAndroidWaterWidgetFromStore, 150);
    });
    return () => {
      cancelled = true;
      if (widgetSyncTimerRef.current) {
        clearTimeout(widgetSyncTimerRef.current);
        widgetSyncTimerRef.current = null;
      }
    };
  }, [todayMl, goalMl, glassMl, weeklyPaceMl, dailyTotals]);

  // Icon swap via setComponentEnabledSetting kills the app when called in the foreground.
  // Only apply it when the app goes to background — that's when the launcher reads the icon anyway.
  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        const { dailyTotals: dt, goalMl: g } = useWaterStore.getState();
        const dk = getDayKey(new Date());
        setAndroidAppIconComplete((dt[dk] ?? 0) >= g && g > 0);
      }
    });
    return () => sub.remove();
  }, []);

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: "#F8FAFC" }} />;
  }

  const horizontalPad = 20;
  const columnGap = 12;

  return (
    <View style={{ flex: 1, backgroundColor: pageBackground }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 72,
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
          {t.today}
        </Text>
        <Text selectable style={{ fontSize: 28, fontWeight: "800", color: "#0F172A" }}>
          {t.hydrationCheckIn}
        </Text>
        <Text selectable style={{ fontSize: 14, color: heroSummary }}>
          {summary}
        </Text>
        {nextDrinkHint && (
          <Text selectable style={{ fontSize: 12, color: heroKicker, fontWeight: "600" }}>
            {nextDrinkHint}
          </Text>
        )}
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
              {t.soFarGoal(formatMl(todayMl), formatMl(goalMl))}
            </Text>
          </PulseOnChange>
        </View>
      </View>

      {(streak > 0 || isComplete) && (
        <StreakCard streak={streak} isComplete={isComplete} remainingGlasses={remainingGlasses} />
      )}

      <View style={{ flexDirection: "row", gap: 12, flexShrink: 0 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            label={t.soFarLabel}
            value={formatMl(todayMl)}
            subtitle={t.glassesUnit(formatGlasses(todayGlasses))}
            tone={isComplete ? "warm" : "cool"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <MetricCard
            label={t.leftTodayLabel}
            value={isComplete ? t.doneLabel : `${remainingGlasses}`}
            subtitle={isComplete ? t.goalReachedSubtitle : t.glassesToGoSubtitle(remainingGlasses)}
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
          accessibilityLabel={t.logGlassToCatchUp}
          accessibilityRole="button"
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Text selectable style={{ fontSize: 13, fontWeight: "700", color: "#DC2626" }}>
              {t.sprintTime}
            </Text>
            <Text selectable style={{ fontSize: 12, color: "#B91C1C" }}>
              {t.sprintBehindLine(Math.round(pacingBehindGlasses), hoursLeftInWindow ?? 0)}
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
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#7F1D1D" }}>{t.logGlass}</Text>
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
            {t.glassesBehindCount(Math.round(pacingBehindGlasses))}
            {hoursLeftInWindow !== null ? t.hLeftLabel(hoursLeftInWindow) : ""}
          </Text>
          {catchUpIntervalMinutes !== null && (
            <Text selectable style={{ fontSize: 12, color: "#EA580C" }}>
              {t.catchUpLabel(
                catchUpIntervalMinutes < 60
                  ? `${catchUpIntervalMinutes}m`
                  : `${Math.round((catchUpIntervalMinutes / 60) * 10) / 10}h`
              )}
            </Text>
          )}
        </View>
      )}

      <SectionCard title={t.dailyFlow} variant="soft">
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
          <View style={{ height: 1, backgroundColor: "#E2E8F0", marginVertical: 4 }} />
          <WeeklyChart data={weeklyData} goalMl={goalMl} />
        </SectionCard>
      </ScrollView>

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

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          bottom: Math.max(insets.bottom, 12) + 12,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        {logs.length === 0 && hasSeenOnboarding && (
          <Text
            selectable={false}
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#0891B2",
              marginBottom: 8,
              letterSpacing: 0.2,
            }}
          >
            {t.firstLogHint}
          </Text>
        )}
        <Pressable
          onPress={handleAddGlass}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: isComplete ? "#D97706" : "#0891B2",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isComplete
              ? "0 4px 18px rgba(217, 119, 6, 0.40)"
              : "0 4px 18px rgba(8, 145, 178, 0.40)",
            opacity: pressed ? 0.8 : 1,
          })}
          accessibilityLabel={t.addGlassLabel(`${glassMl} ml`)}
          accessibilityRole="button"
        >
          <Ionicons name={(glassIcon ?? "water-outline") as any} size={26} color="#FFFFFF" />
        </Pressable>
      </View>

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
        accessibilityLabel={t.screenHistory}
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
        accessibilityLabel={t.screenSettings}
        accessibilityRole="button"
      >
        <Ionicons name="settings-outline" size={22} color={heroKicker} />
      </Pressable>

      {!hasSeenOnboarding && isHydrated && (
        <OnboardingWizard onDismiss={() => setHasSeenOnboarding(true)} />
      )}
    </View>
  );
}
