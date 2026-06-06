import React from "react";
import { BarChart } from "react-native-gifted-charts";
import { Text, useWindowDimensions, View } from "react-native";
import { formatMl } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

type WeeklyChartProps = {
  data: { label: string; value: number }[];
  goalMl: number;
};

export function WeeklyChart({ data, goalMl }: WeeklyChartProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const chartData = React.useMemo(() => data.map((item) => ({
    value: item.value,
    label: item.label,
    frontColor: item.value >= goalMl ? "#FBBF24" : item.value > 0 ? "#22D3EE" : "#E2E8F0",
    labelTextStyle: { color: "#94A3B8", fontSize: 10 },
  })), [data, goalMl]);

  const maxValue = Math.max(goalMl * 1.1, ...data.map((d) => d.value), 100);
  // SectionCard has 16px padding each side; home screen 20px horizontal + 20px = 72 total offset
  const chartWidth = Math.max(200, width - 72 - 32);
  const barPlusGap = chartWidth / 7;
  const barWidth = Math.max(12, Math.floor(barPlusGap * 0.55));
  const spacing = Math.max(4, Math.floor(barPlusGap * 0.45));

  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}>
        {t.thisWeek}
      </Text>
      <BarChart
        data={chartData}
        width={chartWidth}
        barWidth={barWidth}
        spacing={spacing}
        roundedTop
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        maxValue={maxValue}
        showReferenceLine1
        referenceLine1Position={goalMl}
        referenceLine1Config={{
          color: "#0891B2",
          width: 1,
          type: "dashed",
        }}
      />
      <Text selectable style={{ fontSize: 11, color: "#94A3B8" }}>
        {t.goalChartLabel}: {formatMl(goalMl)} · {t.chartAmberHint}
      </Text>
    </View>
  );
}
