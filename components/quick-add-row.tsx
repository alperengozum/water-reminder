import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { QuickPreset } from "@/store/use-water-store";
import { useTranslation } from "@/lib/i18n";

type QuickAddRowProps = {
  glassLabel: string;
  glassIcon?: string;
  presets: QuickPreset[];
  onAddGlass: () => void;
  onAddCustom: (amountMl: number) => void;
  isComplete?: boolean;
};

export function QuickAddRow({ glassLabel, glassIcon, presets, onAddGlass, onAddCustom, isComplete }: QuickAddRowProps) {
  const { t } = useTranslation();
  const glassBg = isComplete ? "#FDE68A" : "#BAE6FD";
  const glassBgPressed = isComplete ? "#FCD34D" : "#CFFAFE";
  const glassIconColor = isComplete ? "#92400E" : "#0C4A6E";
  const glassShadow = isComplete
    ? "0 12px 20px rgba(234, 179, 8, 0.25)"
    : "0 12px 20px rgba(8, 145, 178, 0.2)";

  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={onAddGlass}
        style={({ pressed }) => ({
          paddingVertical: 13,
          borderRadius: 999,
          borderCurve: "continuous",
          backgroundColor: pressed ? glassBgPressed : glassBg,
          alignItems: "center",
          boxShadow: glassShadow,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          gap: 2,
        })}
      >
        {glassIcon ? (
          <>
            <Ionicons name={glassIcon as any} size={20} color={glassIconColor} />
            <Text selectable style={{ fontSize: 11, fontWeight: "700", color: glassIconColor }}>
              {glassLabel}
            </Text>
          </>
        ) : (
          <Text selectable style={{ fontSize: 14, fontWeight: "700", color: glassIconColor }}>
            {t.addGlassLabel(glassLabel)}
          </Text>
        )}
      </Pressable>

      {presets.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {presets.map((preset, i) => (
            <Pressable
              key={i}
              onPress={() => onAddCustom(preset.amountMl)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 10,
                borderRadius: 999,
                borderCurve: "continuous",
                backgroundColor: pressed ? "#FDE68A" : "#FFF7ED",
                borderWidth: 1,
                borderColor: pressed ? "#FBBF24" : "#FED7AA",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              {preset.icon ? (
                <>
                  <Ionicons name={preset.icon as any} size={16} color="#9A3412" />
                  <Text selectable style={{ fontSize: 10, fontWeight: "700", color: "#9A3412" }}>
                    +{preset.amountMl} ml
                  </Text>
                </>
              ) : (
                <Text selectable style={{ fontSize: 13, fontWeight: "700", color: "#9A3412" }}>
                  +{preset.amountMl} ml
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
