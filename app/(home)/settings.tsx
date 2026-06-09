import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, AppState, Linking, Pressable, Platform, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { SectionCard } from "@/components/section-card";
import { Stepper } from "@/components/stepper";
import { getDayKey } from "@/lib/date";
import { computeStreak } from "@/lib/streak";
import { impactLight, impactMedium } from "@/lib/haptics";
import {
  cancelStreakAtRiskAlert,
  cancelWaterReminders,
  checkNotificationsPermission,
  requestNotificationsPermission,
  scheduleStreakAtRiskAlert,
  scheduleWaterReminders,
} from "@/lib/notifications";
import {
  requestAndroidPostNotificationsPermission,
  setAndroidPersistentNotificationEnabled,
  syncAndroidWaterWidgetFromStore,
} from "@/lib/widget";
import { useWaterStore, type QuickPreset } from "@/store/use-water-store";
import { useTranslation, type Language } from "@/lib/i18n";

const DRINK_ICONS: string[] = [
  "water-outline",
  "cafe-outline",
  "beer-outline",
  "wine-outline",
  "flask-outline",
  "nutrition-outline",
];

function formatHour(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour % 12 || 12;
  return `${h}:00 ${period}`;
}

export default function SettingsScreen() {
  const goalMl = useWaterStore((state) => state.goalMl);
  const glassMl = useWaterStore((state) => state.glassMl);
  const setGoalGlasses = useWaterStore((state) => state.setGoalGlasses);
  const setGlassMl = useWaterStore((state) => state.setGlassMl);
  const persistentNotificationEnabled = useWaterStore((state) => state.persistentNotificationEnabled);
  const setPersistentNotificationEnabled = useWaterStore((state) => state.setPersistentNotificationEnabled);
  const glassIcon = useWaterStore((state) => state.glassIcon);
  const setGlassIcon = useWaterStore((state) => state.setGlassIcon);
  const presets = useWaterStore((state) => state.presets);
  const setPresets = useWaterStore((state) => state.setPresets);
  const reminderEnabled = useWaterStore((state) => state.reminderEnabled);
  const reminderIntervalHours = useWaterStore((state) => state.reminderIntervalHours);
  const reminderStartHour = useWaterStore((state) => state.reminderStartHour);
  const reminderEndHour = useWaterStore((state) => state.reminderEndHour);
  const streakAlertEnabled = useWaterStore((state) => state.streakAlertEnabled);
  const setReminderEnabled = useWaterStore((state) => state.setReminderEnabled);
  const setReminderIntervalHours = useWaterStore((state) => state.setReminderIntervalHours);
  const setReminderStartHour = useWaterStore((state) => state.setReminderStartHour);
  const setReminderEndHour = useWaterStore((state) => state.setReminderEndHour);
  const setStreakAlertEnabled = useWaterStore((state) => state.setStreakAlertEnabled);
  const setLanguage = useWaterStore((state) => state.setLanguage);

  const { t, language } = useTranslation();

  const updatePreset = React.useCallback(
    (index: number, patch: Partial<QuickPreset>) => {
      const next = presets.map((p, i) => (i === index ? { ...p, ...patch } : p));
      setPresets(next);
    },
    [presets, setPresets],
  );

  const addPreset = React.useCallback(() => {
    if (presets.length >= 4) return;
    impactLight();
    setPresets([...presets, { amountMl: 250 }]);
  }, [presets, setPresets]);

  const removePreset = React.useCallback(
    (index: number) => {
      impactMedium();
      setPresets(presets.filter((_, i) => i !== index));
    },
    [presets, setPresets],
  );

  const [notifPermissionGranted, setNotifPermissionGranted] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (!reminderEnabled) return;
      checkNotificationsPermission().then(setNotifPermissionGranted);
    }, [reminderEnabled]),
  );

  React.useEffect(() => {
    if (!reminderEnabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkNotificationsPermission().then(setNotifPermissionGranted);
      }
    });
    return () => sub.remove();
  }, [reminderEnabled]);

  // Reschedule whenever any reminder setting changes while enabled
  React.useEffect(() => {
    if (!reminderEnabled) return;
    const key = getDayKey(new Date());
    const { logs, dailyTotals, goalMl: gMl, glassMl: glMl } = useWaterStore.getState();
    const lastDrink = logs.find((l) => getDayKey(new Date(l.timestamp)) === key);
    const todayMl = dailyTotals[key] ?? 0;
    const streak = computeStreak(dailyTotals, gMl);
    const remainingGlasses = Math.max(0, Math.ceil((gMl - todayMl) / glMl));
    void scheduleWaterReminders(
      reminderIntervalHours,
      reminderStartHour,
      reminderEndHour,
      lastDrink ? new Date(lastDrink.timestamp) : undefined,
      streakAlertEnabled ? { streak, remainingGlasses } : undefined,
    );
  }, [reminderEnabled, reminderIntervalHours, reminderStartHour, reminderEndHour, streakAlertEnabled]);

  const insets = useSafeAreaInsets();
  const horizontalPad = 20;
  const columnGap = 12;
  const goalGlasses = Math.round(goalMl / glassMl);
  const goalMlLabel = goalMl >= 1000
    ? `= ${Number.isInteger(goalMl / 1000) ? goalMl / 1000 : (goalMl / 1000).toFixed(1)} L`
    : `= ${goalMl} ml`;

  const handleReminderToggle = React.useCallback(
    async (next: boolean) => {
      impactLight();
      if (!next) {
        setReminderEnabled(false);
        await cancelWaterReminders();
        return;
      }
      const granted = await requestNotificationsPermission();
      if (!granted) {
        setNotifPermissionGranted(false);
        Alert.alert(
          t.notifBlockedTitle,
          t.notifBlockedBodyReminders,
          [
            { text: t.notNow, style: "cancel" },
            { text: t.openSettings, onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      setNotifPermissionGranted(true);
      setReminderEnabled(true);
      const key = getDayKey(new Date());
      const { dailyTotals, goalMl: gMl, glassMl: glMl } = useWaterStore.getState();
      const todayMl = dailyTotals[key] ?? 0;
      const streak = computeStreak(dailyTotals, gMl);
      const remainingGlasses = Math.max(0, Math.ceil((gMl - todayMl) / glMl));
      await scheduleWaterReminders(reminderIntervalHours, reminderStartHour, reminderEndHour, undefined, streakAlertEnabled ? { streak, remainingGlasses } : undefined);
    },
    [reminderIntervalHours, reminderStartHour, reminderEndHour, setReminderEnabled, streakAlertEnabled, t],
  );

  const handleStreakAlertToggle = React.useCallback(
    async (next: boolean) => {
      impactLight();
      if (!next) {
        setStreakAlertEnabled(false);
        await cancelStreakAtRiskAlert();
        return;
      }
      const granted = await requestNotificationsPermission();
      if (!granted) {
        Alert.alert(
          t.notifBlockedTitle,
          t.notifBlockedBodyStreak,
          [
            { text: t.notNow, style: "cancel" },
            { text: t.openSettings, onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      setStreakAlertEnabled(true);
      // When reminders are off, schedule the streak alert independently right now.
      // When reminders are on, the settings-change effect re-runs scheduleWaterReminders which includes it.
      if (!reminderEnabled) {
        const key = getDayKey(new Date());
        const { dailyTotals, goalMl: gMl, glassMl: glMl } = useWaterStore.getState();
        const todayMl = dailyTotals[key] ?? 0;
        const streak = computeStreak(dailyTotals, gMl);
        const remainingGlasses = Math.max(0, Math.ceil((gMl - todayMl) / glMl));
        await scheduleStreakAtRiskAlert(streak, remainingGlasses, reminderEndHour, reminderStartHour);
      }
    },
    [reminderEnabled, reminderEndHour, reminderStartHour, setStreakAlertEnabled, t],
  );

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
            label={t.dailyGoal}
            value={t.goalGlasses(goalGlasses)}
            subtitle={goalMlLabel}
            onIncrement={() => {
              impactLight();
              setGoalGlasses(goalGlasses + 1);
            }}
            onDecrement={() => {
              impactLight();
              setGoalGlasses(Math.max(1, goalGlasses - 1));
            }}
          />
        </SectionCard>

        <SectionCard variant="soft">
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
            {t.quickAdd}
          </Text>
          <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
            {t.customAmounts}
          </Text>

          <Stepper
            label={t.glassSize}
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
          <View style={{ flexDirection: "row", gap: 8 }}>
            {DRINK_ICONS.map((iconName) => {
              const isSelected = (glassIcon ?? DRINK_ICONS[0]) === iconName;
              return (
                <Pressable
                  key={iconName}
                  onPress={() => { impactLight(); setGlassIcon(glassIcon === iconName ? undefined : iconName); }}
                  style={({ pressed }) => ({
                    width: 40, height: 40, borderRadius: 12, borderCurve: "continuous",
                    backgroundColor: isSelected ? "#BFDBFE" : pressed ? "#E2E8F0" : "#F1F5F9",
                    borderWidth: 1,
                    borderColor: isSelected ? "#93C5FD" : "transparent",
                    alignItems: "center", justifyContent: "center",
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  })}
                >
                  <Ionicons name={iconName as any} size={20} color={isSelected ? "#1D4ED8" : "#94A3B8"} />
                </Pressable>
              );
            })}
          </View>
          <View style={{ height: 1, backgroundColor: "#E2E8F0" }} />

          {presets.map((preset, index) => (
            <View key={index} style={{ gap: 10 }}>
              {index > 0 && (
                <View style={{ height: 1, backgroundColor: "#E2E8F0", marginVertical: 2 }} />
              )}

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text selectable style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}>
                  {t.preset(index + 1)}
                </Text>
                <Pressable
                  onPress={() => removePreset(index)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    backgroundColor: pressed ? "#FECACA" : "#FFE4E6",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Ionicons name="close" size={14} color="#BE123C" />
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Pressable
                  onPress={() => { impactLight(); updatePreset(index, { amountMl: Math.max(25, preset.amountMl - 25) }); }}
                  style={({ pressed }) => ({
                    width: 36, height: 36, borderRadius: 14, borderCurve: "continuous",
                    backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 6px 12px rgba(15, 23, 42, 0.06)",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>-</Text>
                </Pressable>
                <View style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderCurve: "continuous",
                  backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
                }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A", fontVariant: ["tabular-nums"] }}>
                    {preset.amountMl} ml
                  </Text>
                </View>
                <Pressable
                  onPress={() => { impactLight(); updatePreset(index, { amountMl: preset.amountMl + 25 }); }}
                  style={({ pressed }) => ({
                    width: 36, height: 36, borderRadius: 14, borderCurve: "continuous",
                    backgroundColor: pressed ? "#A5F3FC" : "#CFFAFE", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 14px rgba(8, 145, 178, 0.16)",
                  })}
                >
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#0E7490" }}>+</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {DRINK_ICONS.map((iconName) => {
                  const isSelected = preset.icon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => { impactLight(); updatePreset(index, { icon: isSelected ? undefined : iconName }); }}
                      style={({ pressed }) => ({
                        width: 40, height: 40, borderRadius: 12, borderCurve: "continuous",
                        backgroundColor: isSelected ? "#FDE68A" : pressed ? "#E2E8F0" : "#F1F5F9",
                        borderWidth: 1,
                        borderColor: isSelected ? "#FBBF24" : "transparent",
                        alignItems: "center", justifyContent: "center",
                        transform: [{ scale: pressed ? 0.94 : 1 }],
                      })}
                    >
                      <Ionicons name={iconName as any} size={20} color={isSelected ? "#D97706" : "#94A3B8"} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {presets.length < 4 && (
            <Pressable
              onPress={addPreset}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 11,
                borderRadius: 999,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: pressed ? "#BAE6FD" : "#E2E8F0",
                backgroundColor: pressed ? "#E0F2FE" : "#F8FAFC",
                marginTop: presets.length > 0 ? 4 : 0,
              })}
            >
              <Ionicons name="add-circle-outline" size={16} color="#0891B2" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#0891B2" }}>
                {t.addPreset}
              </Text>
            </Pressable>
          )}
        </SectionCard>

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
              {t.reminders}
            </Text>
            <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
              {t.drinkReminders}
            </Text>
            <Text selectable style={{ fontSize: 14, lineHeight: 20, color: "#64748B" }}>
              {t.reminderDesc}
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
              {t.on}
            </Text>
            <Switch
              accessibilityLabel="Drink reminders"
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: "#CBD5E1", true: "#99F6E4" }}
              thumbColor={reminderEnabled ? "#0D9488" : "#F1F5F9"}
            />
          </View>
          {reminderEnabled && !notifPermissionGranted && (
            <Pressable
              onPress={() => Linking.openSettings()}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                borderCurve: "continuous",
                backgroundColor: pressed ? "#FDE68A" : "#FEF3C7",
                borderWidth: 1,
                borderColor: "#FCD34D",
              })}
            >
              <Ionicons name="warning-outline" size={16} color="#B45309" />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#92400E" }}>
                {t.notifBlocked}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#B45309" />
            </Pressable>
          )}
          {reminderEnabled && (
            <>
              <View style={{ height: 1, backgroundColor: "#E2E8F0" }} />
              <Stepper
                label={t.every}
                value={t.reminderHours(reminderIntervalHours)}
                onIncrement={() => {
                  impactLight();
                  setReminderIntervalHours(Math.min(4, reminderIntervalHours + 1));
                }}
                onDecrement={() => {
                  impactLight();
                  setReminderIntervalHours(Math.max(1, reminderIntervalHours - 1));
                }}
              />
              <Stepper
                label={t.from}
                value={formatHour(reminderStartHour)}
                onIncrement={() => {
                  impactLight();
                  setReminderStartHour(Math.min(reminderEndHour - reminderIntervalHours, reminderStartHour + 1));
                }}
                onDecrement={() => {
                  impactLight();
                  setReminderStartHour(Math.max(0, reminderStartHour - 1));
                }}
              />
              <Stepper
                label={t.until}
                value={formatHour(reminderEndHour)}
                onIncrement={() => {
                  impactLight();
                  setReminderEndHour(Math.min(23, reminderEndHour + 1));
                }}
                onDecrement={() => {
                  impactLight();
                  setReminderEndHour(Math.max(reminderStartHour + reminderIntervalHours, reminderEndHour - 1));
                }}
              />
            </>
          )}
        </SectionCard>

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
              {t.streakSection}
            </Text>
            <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
              {t.streakAtRiskAlert}
            </Text>
            <Text selectable style={{ fontSize: 14, lineHeight: 20, color: "#64748B" }}>
              {t.streakAlertDesc}
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
              {t.on}
            </Text>
            <Switch
              accessibilityLabel="Streak at risk alert"
              value={streakAlertEnabled}
              onValueChange={handleStreakAlertToggle}
              trackColor={{ false: "#CBD5E1", true: "#99F6E4" }}
              thumbColor={streakAlertEnabled ? "#0D9488" : "#F1F5F9"}
            />
          </View>
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
                {t.statusBar}
              </Text>
              <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
                {t.persistentNotif}
              </Text>
              <Text selectable style={{ fontSize: 14, lineHeight: 20, color: "#64748B" }}>
                {t.persistentNotifDesc}
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
                {t.on}
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
              {t.language}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(["en", "tr", "hi", "pt", "es", "ar", "id", "ru", "ja", "ko", "de", "fr", "zh", "bn", "vi", "th", "it"] as Language[]).map((lang) => {
              const selected = language === lang;
              const nativeNames: Record<Language, string> = {
                en: "English", tr: "Türkçe", hi: "हिन्दी",
                pt: "Português", es: "Español", ar: "العربية", id: "Indonesia",
                ru: "Русский", ja: "日本語", ko: "한국어", de: "Deutsch", fr: "Français",
                zh: "中文", bn: "বাংলা", vi: "Tiếng Việt", th: "ภาษาไทย", it: "Italiano",
              };
              return (
                <Pressable
                  key={lang}
                  onPress={() => { impactLight(); setLanguage(lang); }}
                  style={({ pressed }) => ({
                    width: "31%",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderCurve: "continuous",
                    borderWidth: 2,
                    borderColor: selected ? "#0891B2" : pressed ? "#BAE6FD" : "#E2E8F0",
                    backgroundColor: selected ? "#E0F2FE" : pressed ? "#F0F9FF" : "#F8FAFC",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: selected ? "#0891B2" : "#64748B",
                    }}
                  >
                    {nativeNames[lang]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

      </ScrollView>
    </View>
  );
}
