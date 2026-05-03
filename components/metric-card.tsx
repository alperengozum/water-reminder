import React from "react";
import { Text, View } from "react-native";
import { PulseOnChange } from "@/components/pulse-on-change";

type MetricCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "cool" | "warm";
  variant?: "solid" | "outline";
};

export function MetricCard({
  label,
  value,
  subtitle,
  tone = "cool",
  variant = "solid",
}: MetricCardProps) {
  const surface = tone === "warm" ? "#FFE9D2" : "#E6F2FF";
  const accent = tone === "warm" ? "#B45309" : "#1D4ED8";
  const outline = tone === "warm" ? "#FDBA74" : "#93C5FD";
  const isOutline = variant === "outline";
  const labelSurface = tone === "warm" ? "#FDE68A" : "#BFDBFE";

  return (
    <View
      style={{
        backgroundColor: isOutline ? "#FFFFFF" : surface,
        borderRadius: isOutline ? 22 : 20,
        borderCurve: "continuous",
        borderWidth: isOutline ? 1 : 0,
        borderColor: isOutline ? outline : "transparent",
        padding: 16,
        gap: 6,
        boxShadow: isOutline
          ? "0 6px 16px rgba(15, 23, 42, 0.06)"
          : "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      <View
        style={{
          alignSelf: "flex-start",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          borderCurve: "continuous",
          backgroundColor: isOutline ? "#F8FAFC" : labelSurface,
        }}
      >
        <Text selectable style={{ fontSize: 12, color: accent, fontWeight: "700" }}>
          {label}
        </Text>
      </View>
      <PulseOnChange watch={value}>
        <Text
          selectable
          style={{
            fontSize: 30,
            fontWeight: "800",
            color: "#0F172A",
            fontVariant: ["tabular-nums"],
          }}
        >
          {value}
        </Text>
      </PulseOnChange>
      {subtitle ? (
        <Text selectable style={{ fontSize: 13, color: "#475569" }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
