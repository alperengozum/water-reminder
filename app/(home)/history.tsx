import React from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import { SectionCard } from "@/components/section-card";
import {
  computeAllTimeBestStreak,
  computeAvgLast30Days,
  computeBestDayEver,
  computeDailyTotals,
  computeGoalDaysLast30,
  computeLast30Days,
  computeMonthCalendar,
  type CalendarCell,
} from "@/lib/analytics";
import { impactLight } from "@/lib/haptics";
import { formatMl } from "@/lib/format";
import { useWaterStore } from "@/store/use-water-store";

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dayCellBg(cell: CalendarCell & { type: "day" }): string {
  if (cell.isFuture || cell.ml === 0) return "#E2E8F0";
  if (cell.pct >= 1) return "#FBBF24";
  if (cell.pct >= 0.75) return "#0EA5E9";
  if (cell.pct >= 0.5) return "#38BDF8";
  if (cell.pct >= 0.25) return "#7DD3FC";
  return "#BAE6FD";
}

function dayCellText(cell: CalendarCell & { type: "day" }): string {
  if (cell.isFuture || cell.ml === 0) return "#94A3B8";
  if (cell.pct >= 1) return "#92400E";
  if (cell.pct >= 0.5) return "#0C4A6E";
  return "#0369A1";
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 11, color: "#64748B" }}>{label}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent,
  bg,
  labelBg,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
  bg: string;
  labelBg: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: 20,
        borderCurve: "continuous",
        padding: 16,
        gap: 6,
        boxShadow: "0 8px 20px rgba(15, 23, 42, 0.07)",
      }}
    >
      <View
        style={{
          alignSelf: "flex-start",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: labelBg,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: accent }}>{label}</Text>
      </View>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: "#0F172A",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: "#64748B" }}>{unit}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const logs = useWaterStore((state) => state.logs);
  const goalMl = useWaterStore((state) => state.goalMl);

  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalPad = 20;
  const cellGap = 4;
  const sectionCardPadding = 16;
  const cellSize = Math.floor(
    (width - horizontalPad * 2 - sectionCardPadding * 2 - cellGap * 6) / 7,
  );

  const dailyTotals = React.useMemo(() => computeDailyTotals(logs), [logs]);

  const calendarCells = React.useMemo(
    () => computeMonthCalendar(viewYear, viewMonth, dailyTotals, goalMl),
    [viewYear, viewMonth, dailyTotals, goalMl],
  );

  const weeks = React.useMemo(() => {
    const rows: CalendarCell[][] = [];
    let row: CalendarCell[] = [];
    for (const cell of calendarCells) {
      row.push(cell);
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
    }
    if (row.length > 0) {
      while (row.length < 7) row.push({ type: "empty" });
      rows.push(row);
    }
    return rows;
  }, [calendarCells]);

  const bestStreak = React.useMemo(
    () => computeAllTimeBestStreak(dailyTotals, goalMl),
    [dailyTotals, goalMl],
  );

  const avg30 = React.useMemo(() => computeAvgLast30Days(dailyTotals), [dailyTotals]);

  const goalDays30 = React.useMemo(
    () => computeGoalDaysLast30(dailyTotals, goalMl),
    [dailyTotals, goalMl],
  );

  const bestDay = React.useMemo(() => computeBestDayEver(dailyTotals), [dailyTotals]);

  const last30 = React.useMemo(() => computeLast30Days(dailyTotals), [dailyTotals]);

  const chartData = React.useMemo(
    () =>
      last30.map((d, i) => ({
        value: d.value,
        frontColor: d.value >= goalMl ? "#FBBF24" : d.value > 0 ? "#22D3EE" : "#E2E8F0",
        label: i % 7 === 6 || i === 29 ? String(d.dateNum) : "",
        labelTextStyle: { color: "#94A3B8", fontSize: 9 },
      })),
    [last30, goalMl],
  );

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const goToPrevMonth = React.useCallback(() => {
    impactLight();
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const goToNextMonth = React.useCallback(() => {
    if (isCurrentMonth) return;
    impactLight();
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [isCurrentMonth, viewMonth]);

  const { chartStepValue, chartSections } = React.useMemo(() => {
    const rawMax = Math.max(100, goalMl * 1.1, ...last30.map((d) => d.value));
    const rawStep = rawMax / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
    const normalized = rawStep / magnitude;
    const niceFactor = [1, 2, 2.5, 5, 10].find((f) => f >= normalized) ?? 10;
    const stepValue = niceFactor * magnitude;
    const sections = Math.ceil(rawMax / stepValue);
    return { chartStepValue: stepValue, chartSections: sections };
  }, [last30, goalMl]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{
        paddingHorizontal: horizontalPad,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 20),
        gap: 12,
      }}
      showsVerticalScrollIndicator={false}
    >
      <SectionCard variant="soft">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={goToPrevMonth}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 12,
              borderCurve: "continuous",
              backgroundColor: pressed ? "#E0F2FE" : "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Ionicons name="chevron-back" size={18} color="#0891B2" />
          </Pressable>

          <Text selectable style={{ fontSize: 17, fontWeight: "800", color: "#0F172A" }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>

          <Pressable
            onPress={goToNextMonth}
            disabled={isCurrentMonth}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 12,
              borderCurve: "continuous",
              backgroundColor: isCurrentMonth
                ? "transparent"
                : pressed
                  ? "#E0F2FE"
                  : "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
              opacity: isCurrentMonth ? 0.25 : 1,
            })}
          >
            <Ionicons name="chevron-forward" size={18} color="#0891B2" />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: cellGap }}>
          {DAY_HEADERS.map((d) => (
            <View key={d} style={{ width: cellSize, alignItems: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#94A3B8" }}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: cellGap }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: "row", gap: cellGap }}>
              {week.map((cell, ci) => {
                if (cell.type === "empty") {
                  return <View key={ci} style={{ width: cellSize, height: cellSize }} />;
                }
                return (
                  <View
                    key={ci}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 9,
                      borderCurve: "continuous",
                      backgroundColor: dayCellBg(cell),
                      alignItems: "center",
                      justifyContent: "center",
                      ...(cell.isToday
                        ? { borderWidth: 2, borderColor: "#0891B2" }
                        : undefined),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: cell.isToday ? "800" : "500",
                        color: dayCellText(cell),
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {cell.date.getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 14,
            alignSelf: "flex-end",
            alignItems: "center",
          }}
        >
          <LegendItem color="#E2E8F0" label="None" />
          <LegendItem color="#7DD3FC" label="Partial" />
          <LegendItem color="#FBBF24" label="Goal" />
        </View>
      </SectionCard>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          label="Best streak"
          value={`${bestStreak}`}
          unit="days ever"
          accent="#D97706"
          bg="#FFFBEB"
          labelBg="#FDE68A"
        />
        <StatCard
          label="30-day avg"
          value={`${Math.round(avg30)}`}
          unit="ml per day"
          accent="#0891B2"
          bg="#ECFEFF"
          labelBg="#A5F3FC"
        />
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          label="Goal days"
          value={`${goalDays30}`}
          unit="of last 30"
          accent="#0891B2"
          bg="#F0F9FF"
          labelBg="#BAE6FD"
        />
        <StatCard
          label="Best day"
          value={`${Math.round(bestDay)}`}
          unit="ml ever"
          accent="#7C3AED"
          bg="#F5F3FF"
          labelBg="#DDD6FE"
        />
      </View>

      <SectionCard variant="soft">
        <Text selectable style={{ fontSize: 16, fontWeight: "800", color: "#0F172A" }}>
          30-day trend
        </Text>
        <Text selectable style={{ fontSize: 13, color: "#64748B" }}>
          Amber = goal hit · dashed line = {formatMl(goalMl)} target
        </Text>
        {logs.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: "#94A3B8" }}>
              No data yet — start logging!
            </Text>
          </View>
        ) : (
          <BarChart
            data={chartData}
            barWidth={7}
            spacing={3}
            roundedTop
            yAxisThickness={0}
            xAxisThickness={0}
            hideRules
            stepValue={chartStepValue}
            noOfSections={chartSections}
            yAxisLabelSuffix=" ml"
            showReferenceLine1
            referenceLine1Position={goalMl}
            referenceLine1Config={{
              color: "#0891B2",
              width: 1,
              type: "dashed",
              labelText: "Goal",
              labelTextStyle: { color: "#0891B2", fontSize: 10 },
            }}
          />
        )}
      </SectionCard>
    </ScrollView>
  );
}
