import React from "react";
import { Pressable, Text, View } from "react-native";
import { useWaterStore } from "@/store/use-water-store";
import { useTranslation } from "@/lib/i18n";
import { impactLight } from "@/lib/haptics";
import { requestNotificationsPermission, scheduleWaterReminders } from "@/lib/notifications";
import { computeStreak } from "@/lib/streak";

type Props = {
  onDismiss: () => void;
};

export function OnboardingWizard({ onDismiss }: Props) {
  const [step, setStep] = React.useState<0 | 1>(0);
  const { t } = useTranslation();

  const goalMl = useWaterStore((s) => s.goalMl);
  const glassMl = useWaterStore((s) => s.glassMl);
  const setGoalGlasses = useWaterStore((s) => s.setGoalGlasses);
  const setReminderEnabled = useWaterStore((s) => s.setReminderEnabled);
  const reminderIntervalHours = useWaterStore((s) => s.reminderIntervalHours);
  const reminderStartHour = useWaterStore((s) => s.reminderStartHour);
  const reminderEndHour = useWaterStore((s) => s.reminderEndHour);
  const streakAlertEnabled = useWaterStore((s) => s.streakAlertEnabled);
  const dailyTotals = useWaterStore((s) => s.dailyTotals);

  const goalGlasses = Math.round(goalMl / glassMl);
  const goalMlLabel =
    goalMl >= 1000
      ? `${Number.isInteger(goalMl / 1000) ? goalMl / 1000 : (goalMl / 1000).toFixed(1)} L`
      : `${goalMl} ml`;

  const handleEnableReminders = React.useCallback(async () => {
    const granted = await requestNotificationsPermission();
    if (granted) {
      setReminderEnabled(true);
      const streak = computeStreak(dailyTotals, goalMl);
      await scheduleWaterReminders(
        reminderIntervalHours,
        reminderStartHour,
        reminderEndHour,
        undefined,
        streakAlertEnabled ? { streak, remainingGlasses: goalGlasses } : undefined,
      );
    }
    onDismiss();
  }, [dailyTotals, goalMl, goalGlasses, reminderIntervalHours, reminderStartHour, reminderEndHour, setReminderEnabled, streakAlertEnabled, onDismiss]);

  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 340,
          backgroundColor: "#FFFFFF",
          borderRadius: 28,
          borderCurve: "continuous",
          padding: 24,
          gap: 20,
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.25)",
        }}
      >
        <View style={{ flexDirection: "row", gap: 6 }}>
          {([0, 1] as const).map((i) => (
            <View
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i <= step ? "#0891B2" : "#E2E8F0",
              }}
            />
          ))}
        </View>

        {step === 0 ? (
          <GoalStep
            goalGlasses={goalGlasses}
            goalMlLabel={goalMlLabel}
            onDecrement={() => { impactLight(); setGoalGlasses(Math.max(1, goalGlasses - 1)); }}
            onIncrement={() => { impactLight(); setGoalGlasses(goalGlasses + 1); }}
            onNext={() => setStep(1)}
            t={t}
          />
        ) : (
          <RemindersStep
            onEnable={handleEnableReminders}
            onSkip={onDismiss}
            t={t}
          />
        )}
      </View>
    </View>
  );
}

function GoalStep({
  goalGlasses,
  goalMlLabel,
  onDecrement,
  onIncrement,
  onNext,
  t,
}: {
  goalGlasses: number;
  goalMlLabel: string;
  onDecrement: () => void;
  onIncrement: () => void;
  onNext: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <>
      <View style={{ gap: 6 }}>
        <Text selectable style={{ fontSize: 22, fontWeight: "800", color: "#0F172A" }}>
          {t.wizardGoalTitle}
        </Text>
        <Text selectable style={{ fontSize: 14, color: "#64748B", lineHeight: 20 }}>
          {t.wizardGoalBody}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Pressable
          onPress={onDecrement}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 16,
            borderCurve: "continuous",
            backgroundColor: pressed ? "#E2E8F0" : "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#0F172A" }}>−</Text>
        </Pressable>
        <View style={{ alignItems: "center", minWidth: 90 }}>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "800",
              color: "#0F172A",
              fontVariant: ["tabular-nums"],
            }}
          >
            {goalGlasses}
          </Text>
          <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            {goalMlLabel}
          </Text>
        </View>
        <Pressable
          onPress={onIncrement}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 16,
            borderCurve: "continuous",
            backgroundColor: pressed ? "#A5F3FC" : "#CFFAFE",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#0E7490" }}>+</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#0E7490" : "#0891B2",
          borderRadius: 16,
          borderCurve: "continuous",
          paddingVertical: 14,
          alignItems: "center",
        })}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
          {t.wizardNext}
        </Text>
      </Pressable>
    </>
  );
}

function RemindersStep({
  onEnable,
  onSkip,
  t,
}: {
  onEnable: () => void;
  onSkip: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <>
      <View style={{ gap: 6 }}>
        <Text selectable style={{ fontSize: 22, fontWeight: "800", color: "#0F172A" }}>
          {t.wizardRemindersTitle}
        </Text>
        <Text selectable style={{ fontSize: 14, color: "#64748B", lineHeight: 20 }}>
          {t.wizardRemindersBody}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Pressable
          onPress={onEnable}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#0E7490" : "#0891B2",
            borderRadius: 16,
            borderCurve: "continuous",
            paddingVertical: 14,
            alignItems: "center",
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
            {t.wizardEnableReminders}
          </Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#F1F5F9" : "transparent",
            borderRadius: 16,
            borderCurve: "continuous",
            paddingVertical: 12,
            alignItems: "center",
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#64748B" }}>
            {t.wizardSkipReminders}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
