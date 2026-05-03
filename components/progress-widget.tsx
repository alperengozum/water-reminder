import React from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { formatGlasses, formatMl } from "@/lib/format";
import { QuickAddRow } from "@/components/quick-add-row";
import { PulseOnChange } from "@/components/pulse-on-change";

type ProgressWidgetProps = {
  consumedMl: number;
  goalMl: number;
  glassMl: number;
  quickAdd?: {
    glassLabel: string;
    onAddGlass: () => void;
    onAddCustom: () => void;
  };
};

export function ProgressWidget({ consumedMl, goalMl, glassMl, quickAdd }: ProgressWidgetProps) {
  const { width } = useWindowDimensions();
  const trackWidth = Math.max(240, width - 72);
  const progress = Math.min(consumedMl / goalMl, 1);
  const glasses = consumedMl / glassMl;
  const isComplete = consumedMl >= goalMl && goalMl > 0;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text selectable style={{ fontSize: 14, fontWeight: "600", color: "#0F172A" }}>
          Progress
        </Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            borderCurve: "continuous",
            backgroundColor: isComplete ? "#FDE68A" : "#E0F2FE",
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 12,
              color: isComplete ? "#92400E" : "#0E7490",
              fontWeight: "700",
            }}
          >
            {formatGlasses(glasses)} glasses
          </Text>
        </View>
      </View>
      <View
        style={{
          height: 14,
          width: trackWidth,
          borderRadius: 999,
          borderCurve: "continuous",
          backgroundColor: isComplete ? "#FEF9C3" : "#CFFAFE",
          overflow: "hidden",
          boxShadow: isComplete ? "0 10px 18px rgba(234, 179, 8, 0.25)" : "none",
        }}
      >
        <View
          style={{
            width: trackWidth * progress,
            height: 14,
            borderRadius: 999,
            borderCurve: "continuous",
            backgroundColor: isComplete ? "#FBBF24" : "#22D3EE",
          }}
        />
      </View>
      {isComplete ? (
        <View
          style={{
            backgroundColor: "#FEF3C7",
            borderRadius: 18,
            borderCurve: "continuous",
            padding: 12,
            gap: 8,
            borderWidth: 1,
            borderColor: "#FDE68A",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 60,
              height: 60,
              borderRadius: 999,
              borderCurve: "continuous",
              backgroundColor: "#FDE68A",
              top: -20,
              right: -10,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 36,
              height: 36,
              borderRadius: 999,
              borderCurve: "continuous",
              backgroundColor: "#FECACA",
              bottom: -12,
              left: 14,
            }}
          />
          <Text selectable style={{ fontSize: 14, fontWeight: "800", color: "#92400E" }}>
            Goal reached
          </Text>
          <Text selectable style={{ fontSize: 12, color: "#B45309" }}>
            You hit today’s target. Celebrate the streak.
          </Text>
        </View>
      ) : null}
      <PulseOnChange watch={consumedMl}>
        <Text selectable style={{ fontSize: 13, color: "#64748B" }}>
          {formatMl(consumedMl)} of {formatMl(goalMl)}
        </Text>
      </PulseOnChange>
      {quickAdd ? (
        <View style={isComplete ? { opacity: 0.92 } : undefined}>
          <QuickAddRow
            glassLabel={quickAdd.glassLabel}
            onAddGlass={quickAdd.onAddGlass}
            onAddCustom={quickAdd.onAddCustom}
          />
        </View>
      ) : null}
    </View>
  );
}
