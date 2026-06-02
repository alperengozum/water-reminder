import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PulseOnChange } from "@/components/pulse-on-change";

type StreakCardProps = {
  streak: number;
  /** Last 7 days oldest-first; true = goal was met that day */
  recentDays: boolean[];
};

function message(streak: number): string {
  if (streak === 0) return "Hit your goal today to start a streak.";
  if (streak === 1) return "Great start — come back tomorrow.";
  if (streak < 7) return `${streak} days strong. Keep going.`;
  if (streak < 30) return "Serious consistency. Don't break it.";
  return "You're unstoppable.";
}

export function StreakCard({ streak, recentDays }: StreakCardProps) {
  const isActive = streak > 0;

  const bg = isActive ? "#FFFBEB" : "#F8FAFC";
  const border = isActive ? "#FDE68A" : "#E2E8F0";
  const iconBg = isActive ? "#FDE68A" : "#E2E8F0";
  const iconColor = isActive ? "#D97706" : "#94A3B8";
  const labelColor = isActive ? "#B45309" : "#94A3B8";
  const msgColor = isActive ? "#92400E" : "#64748B";
  const dotFilled = isActive ? "#FBBF24" : "#BAE6FD";
  const dotEmpty = isActive ? "#FEF3C7" : "#E2E8F0";

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
      {/* decorative bubble */}
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

      {/* top row: icon + text */}
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
            name={isActive ? "flame" : "flame-outline"}
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
            Streak
          </Text>
          <PulseOnChange watch={streak}>
            <Text
              selectable
              style={{ fontSize: 26, fontWeight: "800", color: "#0F172A", lineHeight: 30 }}
            >
              {streak}{" "}
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#334155" }}>
                {streak === 1 ? "day" : "days"}
              </Text>
            </Text>
          </PulseOnChange>
          <Text selectable style={{ fontSize: 12, color: msgColor }}>
            {message(streak)}
          </Text>
        </View>
      </View>

      {/* 7-day dots — today on the left, 6 days ago on the right */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {[...recentDays].reverse().map((hit, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              backgroundColor: hit ? dotFilled : dotEmpty,
            }}
          />
        ))}
      </View>
    </View>
  );
}
