import React from "react";
import { BarChart } from "react-native-gifted-charts";
import { Text, View } from "react-native";
import { formatMl } from "@/lib/format";

type WeeklyChartProps = {
  data: { label: string; value: number }[];
  goalMl: number;
};

export function WeeklyChart({ data, goalMl }: WeeklyChartProps) {
  return (
    <View style={{ gap: 12 }}>
      <Text selectable style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}>
        This week
      </Text>
      <BarChart
        data={data}
        barWidth={16}
        spacing={14}
        roundedTop
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        frontColor="#22D3EE"
        maxValue={Math.max(goalMl, ...data.map((item) => item.value))}
      />
      <Text selectable style={{ fontSize: 12, color: "#94A3B8" }}>
        Goal: {formatMl(goalMl)}
      </Text>
    </View>
  );
}
