import React from "react";
import { Pressable, Text, View } from "react-native";
import { PulseOnChange } from "@/components/pulse-on-change";

type StepperProps = {
  label: string;
  value: string;
  subtitle?: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function Stepper({ label, value, subtitle, onIncrement, onDecrement }: StepperProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ fontSize: 13, color: "#64748B", fontWeight: "600" }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={onDecrement}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 14,
            borderCurve: "continuous",
            backgroundColor: pressed ? "#E2E8F0" : "#E2E8F0",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 12px rgba(15, 23, 42, 0.06)",
          })}
        >
          <Text selectable style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>
            -
          </Text>
        </Pressable>
        <PulseOnChange watch={value}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              borderCurve: "continuous",
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <Text
              selectable
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: "#0F172A",
                fontVariant: ["tabular-nums"],
              }}
            >
              {value}
            </Text>
          </View>
        </PulseOnChange>
        <Pressable
          onPress={onIncrement}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 14,
            borderCurve: "continuous",
            backgroundColor: pressed ? "#A5F3FC" : "#CFFAFE",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 14px rgba(8, 145, 178, 0.16)",
          })}
        >
          <Text selectable style={{ fontSize: 18, fontWeight: "700", color: "#0E7490" }}>
            +
          </Text>
        </Pressable>
      </View>
      {subtitle ? (
        <Text selectable style={{ fontSize: 12, color: "#94A3B8", fontWeight: "500" }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
