import React from "react";
import { LayoutAnimation, Pressable, Text, View } from "react-native";
import { WaterLog } from "@/store/use-water-store";
import { formatMl } from "@/lib/format";

type LogListProps = {
  logs: WaterLog[];
  onRemove: (id: string) => void;
  /** When set, only the first `maxItems` logs are listed. When omitted, all logs render. */
  maxItems?: number;
};

export function LogList({ logs, onRemove, maxItems }: LogListProps) {
  const displayed =
    maxItems !== undefined ? logs.slice(0, Math.max(0, maxItems)) : logs;

  if (logs.length === 0) {
    return (
      <Text selectable style={{ fontSize: 13, color: "#94A3B8" }}>
        No logs yet. Add your first glass.
      </Text>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {displayed.map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
        const isQuick = log.source === "quick";
        const accent = isQuick ? "#FDBA74" : "#BAE6FD";
        const chip = isQuick ? "#FEF3C7" : "#E0F2FE";
        const chipText = isQuick ? "#B45309" : "#0369A1";

        return (
          <View
            key={log.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 12,
              borderRadius: 18,
              borderCurve: "continuous",
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 6,
                  height: 34,
                  borderRadius: 999,
                  borderCurve: "continuous",
                  backgroundColor: accent,
                }}
              />
              <View style={{ gap: 4 }}>
                <Text selectable style={{ fontSize: 14, fontWeight: "600", color: "#0F172A" }}>
                  {formatMl(log.amountMl)}
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    borderCurve: "continuous",
                    backgroundColor: chip,
                  }}
                >
                  <Text selectable style={{ fontSize: 11, fontWeight: "700", color: chipText }}>
                    {isQuick ? "Quick" : "Glass"} · {time}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onRemove(log.id);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 11,
                paddingVertical: 7,
                borderRadius: 999,
                borderCurve: "continuous",
                backgroundColor: pressed ? "#FECACA" : "#FFE4E6",
                borderWidth: 1,
                borderColor: pressed ? "#F87171" : "transparent",
                transform: [{ scale: pressed ? 0.94 : 1 }],
                opacity: pressed ? 0.92 : 1,
              })}
            >
              {({ pressed }) => (
                <Text selectable style={{ fontSize: 12, color: pressed ? "#9F1239" : "#BE123C", fontWeight: "700" }}>
                  Remove
                </Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
