import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PulseOnChange } from "@/components/pulse-on-change";
import { useTranslation } from "@/lib/i18n";

type StreakCardProps = {
  streak: number;
  /** Whether today's goal has been fully met */
  isComplete: boolean;
  /** Glasses still needed today; shown when streak > 0 and goal not complete */
  remainingGlasses?: number;
};

export function StreakCard({ streak, isComplete, remainingGlasses }: StreakCardProps) {
  const { t } = useTranslation();
  const hasStreak = streak > 0;
  const isActive = isComplete;

  const bg = isActive ? "#FFFBEB" : "#F8FAFC";
  const border = isActive ? "#FDE68A" : "#E2E8F0";
  const iconBg = hasStreak ? "#FDE68A" : "#E2E8F0";
  const iconColor = hasStreak ? "#D97706" : "#94A3B8";
  const labelColor = isActive ? "#B45309" : "#94A3B8";
  const msgColor = isActive ? "#92400E" : "#64748B";
  const dotFilled = isActive ? "#FBBF24" : "#BAE6FD";
  const dotEmpty = isActive ? "#FEF3C7" : "#E2E8F0";

  function message(s: number): string {
    if (s === 0) return t.streakMsg0;
    if (s === 1) return t.streakMsg1;
    if (s < 7) return t.streakMsgWeek(s);
    if (s < 30) return t.streakMsgMonth;
    return t.streakMsgLong;
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 22,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: border,
        padding: 16,
        gap: 14,
        overflow: "hidden",
        boxShadow: isActive
          ? "0 8px 20px rgba(217, 119, 6, 0.14)"
          : "0 8px 18px rgba(15, 23, 42, 0.05)",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 100,
          height: 100,
          borderRadius: 999,
          backgroundColor: isActive ? "#FDE68A" : "#E2E8F0",
          top: -30,
          right: -20,
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 54,
          height: 54,
          borderRadius: 999,
          backgroundColor: isActive ? "#FED7AA" : "#F1F5F9",
          bottom: -16,
          right: 60,
          opacity: 0.5,
        }}
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            borderCurve: "continuous",
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Ionicons
            name={hasStreak ? "flame" : "flame-outline"}
            size={28}
            color={iconColor}
          />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            selectable
            style={{
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              color: labelColor,
              textTransform: "uppercase",
            }}
          >
            {t.streakLabel}
          </Text>
          <PulseOnChange watch={streak}>
            <Text
              selectable
              style={{ fontSize: 26, fontWeight: "800", color: "#0F172A", lineHeight: 30 }}
            >
              {streak}{" "}
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#334155" }}>
                {streak === 1 ? t.streakDay : t.streakDays}
              </Text>
            </Text>
          </PulseOnChange>
          <Text selectable style={{ fontSize: 12, color: msgColor }}>
            {message(streak)}
          </Text>
          {streak > 0 && !isComplete && remainingGlasses !== undefined && remainingGlasses > 0 && (
            <Text selectable style={{ fontSize: 12, color: "#B45309", fontWeight: "600", marginTop: 2 }}>
              {t.streakGlassesLeft(remainingGlasses)}
            </Text>
          )}
        </View>
      </View>

      {(() => {
        // Milestone tiers: [prevMilestone, nextMilestone]
        const milestones = [7, 14, 30, 60, 100];
        const nextMilestone = milestones.find((m) => m > streak) ?? milestones[milestones.length - 1];
        const prevMilestone = milestones[milestones.indexOf(nextMilestone) - 1] ?? 0;
        const dotsTotal = 7;
        const dotsFilled = streak >= nextMilestone
          ? dotsTotal
          : Math.floor(((streak - prevMilestone) / (nextMilestone - prevMilestone)) * dotsTotal);
        const milestoneLabel = streak >= 100
          ? t.streakMilestoneReached(100)
          : t.streakMilestoneNext(nextMilestone);
        return (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {Array.from({ length: dotsTotal }, (_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: i < dotsFilled ? dotFilled : dotEmpty,
                  }}
                />
              ))}
            </View>
            <Text selectable style={{ fontSize: 11, color: labelColor, fontWeight: "600" }}>
              {milestoneLabel}
            </Text>
          </>
        );
      })()}
    </View>
  );
}
