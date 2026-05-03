import React from "react";
import { Text, View } from "react-native";

type SectionCardProps = {
  title?: string;
  variant?: "solid" | "soft";
  children: React.ReactNode;
};

export function SectionCard({ title, variant = "solid", children }: SectionCardProps) {
  const isSoft = variant === "soft";
  return (
    <View
      style={{
        backgroundColor: isSoft ? "#F8FAFC" : "#FFFFFF",
        borderRadius: isSoft ? 20 : 24,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: isSoft ? "#E2E8F0" : "#E5E7EB",
        padding: isSoft ? 16 : 18,
        gap: 14,
        boxShadow: isSoft
          ? "0 8px 18px rgba(15, 23, 42, 0.06)"
          : "0 12px 24px rgba(15, 23, 42, 0.08)",
      }}
    >
      {title ? (
        <Text selectable style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
