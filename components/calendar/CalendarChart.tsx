import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "../../src/context/ThemeContext";
import type { DailyStats } from "../../src/stores";
import { buildLast30DaysChartData } from "../../src/utils/calendarStats";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";

interface CalendarChartProps {
  dailyStats: DailyStats[];
}

// Each bar slot needs ~45px to comfortably render a "M/D" label without overflow
const MIN_BAR_SLOT_PX = 45;
const Y_AXIS_WIDTH = 40;

export function CalendarChart({ dailyStats }: CalendarChartProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = React.useState(0);

  const chartWidth = containerWidth > 0 ? containerWidth - 36 : 0;

  const daysPerBar = React.useMemo(() => {
    if (chartWidth <= 0) return 5;
    const maxBars = Math.max(1, Math.floor((chartWidth - Y_AXIS_WIDTH) / MIN_BAR_SLOT_PX));
    return Math.ceil(30 / maxBars);
  }, [chartWidth]);

  const chartData = React.useMemo(
    () => buildLast30DaysChartData(dailyStats, daysPerBar),
    [dailyStats, daysPerBar],
  );

  const totalLearned = chartData.reduce((sum, e) => sum + e.dailyWords, 0);

  const barColor = isDark ? "#1E63D0" : "#4A90E2";
  const lineColor = isDark ? "#FB923C" : "#EA580C";
  const cardBg = isDark ? "#13151A" : "#F5F7FB";
  const axisTextColor = isDark ? "#9CA3AF" : "#6B7280";
  const rulesColor = isDark ? "#262A33" : "#E4E8EF";

  const barData = React.useMemo(
    () =>
      chartData.map((entry) => ({
        value: entry.dailyWords,
        label: entry.label,
        frontColor: barColor,
      })),
    [chartData, barColor],
  );

  const lineData = React.useMemo(
    () => chartData.map((entry) => ({ value: entry.dailyWords })),
    [chartData],
  );

  const barCount = chartData.length;
  const maxValue = React.useMemo(() => {
    const peak = Math.max(...chartData.map((e) => e.dailyWords), 1);
    return Math.ceil(peak * 1.25);
  }, [chartData]);

  // Each slot = available / barCount; bars take 40% of each slot, spacing takes the rest
  const INITIAL_SPACING = 6;
  const slotWidth = chartWidth > 0
    ? Math.floor((chartWidth - Y_AXIS_WIDTH - INITIAL_SPACING) / barCount)
    : 20;
  const barWidth = Math.max(6, Math.floor(slotWidth * 0.55));
  const BAR_SPACING = Math.max(4, slotWidth - barWidth);

  return (
    <View
      style={[styles.card, { backgroundColor: cardBg }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ThemedText type="subtitle" style={styles.title}>
        {t("calendar.chart.title")}
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: axisTextColor }]}>
        {t("calendar.chart.subtitle", { total: totalLearned })}
      </ThemedText>

      {totalLearned === 0 ? (
        <ThemedText style={[styles.empty, { color: axisTextColor }]}>
          {t("calendar.chart.empty")}
        </ThemedText>
      ) : chartWidth > 0 ? (
        <View style={styles.chartWrapper}>
          <BarChart
            data={barData}
            showLine
            lineData={lineData}
            lineConfig={{
              color: lineColor,
              thickness: 2,
              curved: false,
              hideDataPoints: false,
              dataPointsShape: "circular",
              dataPointsColor: lineColor,
              dataPointsRadius: 5,
            }}
            disablePress
            maxValue={maxValue}
            width={chartWidth}
            barWidth={barWidth}
            spacing={BAR_SPACING}
            initialSpacing={INITIAL_SPACING}
            noOfSections={4}
            rulesColor={rulesColor}
            rulesType="solid"
            yAxisTextStyle={{ color: axisTextColor, fontSize: FontSizes.xs }}
            xAxisLabelTextStyle={{ color: axisTextColor, fontSize: FontSizes.xxs }}
            hideAxesAndRules={false}
            isAnimated
            animationDuration={500}
            backgroundColor={cardBg}
            yAxisColor="transparent"
            xAxisColor={rulesColor}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.label,
    marginBottom: 14,
  },
  empty: {
    fontSize: FontSizes.label,
    marginTop: 4,
    opacity: 0.7,
  },
  chartWrapper: {
    overflow: "hidden",
  },
});
