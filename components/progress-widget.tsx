import React from "react";
import { Animated, Text, useWindowDimensions, View } from "react-native";
import { formatGlasses, formatMl } from "@/lib/format";
import { QuickAddRow } from "@/components/quick-add-row";
import { PulseOnChange } from "@/components/pulse-on-change";
import type { QuickPreset } from "@/store/use-water-store";
import { useTranslation } from "@/lib/i18n";

type ProgressWidgetProps = {
  consumedMl: number;
  goalMl: number;
  glassMl: number;
  /** 0–1 fraction of the reminder window elapsed; renders a pace marker when set */
  pacingProgress?: number;
  quickAdd?: {
    glassLabel: string;
    glassIcon?: string;
    presets: QuickPreset[];
    onAddGlass: () => void;
    onAddCustom: (amountMl: number) => void;
  };
};

export function ProgressWidget({ consumedMl, goalMl, glassMl, pacingProgress, quickAdd }: ProgressWidgetProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const trackWidth = Math.max(240, width - 72);
  const progress = Math.min(consumedMl / goalMl, 1);

  const animatedProgress = React.useRef(new Animated.Value(progress)).current;
  React.useEffect(() => {
    animatedProgress.stopAnimation();
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  const glasses = consumedMl / glassMl;
  const isComplete = consumedMl >= goalMl && goalMl > 0;
  const isBehindPace = pacingProgress !== undefined && progress < pacingProgress;
  const fillColor = isComplete ? "#FBBF24" : isBehindPace ? "#FB923C" : "#22D3EE";
  const pacingMarkerLeft = pacingProgress !== undefined
    ? Math.max(2, Math.min(trackWidth - 4, trackWidth * pacingProgress)) - 1
    : 0;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text selectable style={{ fontSize: 14, fontWeight: "600", color: "#0F172A" }}>
          {t.progressLabel}
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
            {t.glassesUnit(formatGlasses(glasses))}
          </Text>
        </View>
      </View>
      <View style={{ position: "relative" }}>
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
          <Animated.View
            style={{
              width: animatedProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, trackWidth],
                extrapolate: "clamp",
              }),
              height: 14,
              borderRadius: 999,
              borderCurve: "continuous",
              backgroundColor: fillColor,
            }}
          />
        </View>
        {pacingProgress !== undefined && !isComplete && (
          <View
            style={{
              position: "absolute",
              left: pacingMarkerLeft,
              top: -4,
              width: 3,
              height: 22,
              borderRadius: 2,
              backgroundColor: isBehindPace ? "#F97316" : "rgba(14, 116, 144, 0.7)",
            }}
          />
        )}
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
            {t.goalReachedTitle}
          </Text>
          <Text selectable style={{ fontSize: 12, color: "#B45309" }}>
            {t.goalReachedDesc}
          </Text>
        </View>
      ) : null}
      <PulseOnChange watch={consumedMl}>
        <Text selectable style={{ fontSize: 13, color: "#64748B" }}>
          {t.ofLabel(formatMl(consumedMl), formatMl(goalMl))}
        </Text>
      </PulseOnChange>
      {quickAdd ? (
        <View style={isComplete ? { opacity: 0.92 } : undefined}>
          <QuickAddRow
            glassLabel={quickAdd.glassLabel}
            glassIcon={quickAdd.glassIcon}
            presets={quickAdd.presets}
            onAddGlass={quickAdd.onAddGlass}
            onAddCustom={quickAdd.onAddCustom}
            isComplete={isComplete}
          />
        </View>
      ) : null}
    </View>
  );
}
