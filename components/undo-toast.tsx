import React from "react";
import { Pressable, Text, View } from "react-native";

type UndoToastProps = {
  label: string;
  onUndo: () => void;
  isComplete?: boolean;
};

export function UndoToast({ label, onUndo, isComplete }: UndoToastProps) {
  const bg = isComplete ? "#78350F" : "#0F172A";
  const shadow = isComplete
    ? "0 8px 20px rgba(120, 53, 15, 0.32)"
    : "0 8px 20px rgba(15, 23, 42, 0.28)";
  const labelColor = isComplete ? "#FEF9C3" : "#F8FAFC";
  const btnBg = isComplete ? "#92400E" : "#334155";
  const btnBgPressed = isComplete ? "#B45309" : "#1E293B";
  const btnText = isComplete ? "#FCD34D" : "#67E8F9";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: bg,
        borderRadius: 999,
        borderCurve: "continuous",
        paddingVertical: 10,
        paddingLeft: 18,
        paddingRight: 8,
        gap: 12,
        boxShadow: shadow,
      }}
    >
      <Text
        style={{ fontSize: 13, fontWeight: "600", color: labelColor, flex: 1 }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Pressable
        onPress={onUndo}
        hitSlop={8}
        style={({ pressed }) => ({
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          borderCurve: "continuous",
          backgroundColor: pressed ? btnBgPressed : btnBg,
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: btnText }}>Undo</Text>
      </Pressable>
    </View>
  );
}
