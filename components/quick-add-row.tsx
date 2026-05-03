import React from "react";
import { Pressable, Text, View } from "react-native";

type QuickAddRowProps = {
  glassLabel: string;
  onAddGlass: () => void;
  onAddCustom: () => void;
};

export function QuickAddRow({ glassLabel, onAddGlass, onAddCustom }: QuickAddRowProps) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Pressable
        onPress={onAddGlass}
        style={({ pressed }) => ({
          flex: 1,
          paddingVertical: 12,
          borderRadius: 999,
          borderCurve: "continuous",
          backgroundColor: pressed ? "#CFFAFE" : "#BAE6FD",
          alignItems: "center",
          boxShadow: "0 12px 20px rgba(8, 145, 178, 0.2)",
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <Text selectable style={{ fontSize: 14, fontWeight: "700", color: "#0C4A6E" }}>
          Add a glass ({glassLabel})
        </Text>
      </Pressable>
      <Pressable
        onPress={onAddCustom}
        style={({ pressed }) => ({
          flex: 1,
          paddingVertical: 12,
          borderRadius: 999,
          borderCurve: "continuous",
          backgroundColor: pressed ? "#FDE68A" : "#FED7AA",
          alignItems: "center",
          boxShadow: "0 12px 20px rgba(217, 119, 6, 0.22)",
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <Text selectable style={{ fontSize: 14, fontWeight: "700", color: "#9A3412" }}>
          Quick add 100 ml
        </Text>
      </Pressable>
    </View>
  );
}
