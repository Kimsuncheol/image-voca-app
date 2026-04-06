import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import type { CalendarDayCell } from "../../src/utils/calendarStats";
import { ThemedText } from "../themed-text";

interface CalendarMonthGridProps {
  monthLabel: string;
  weekdayLabels: string[];
  cells: CalendarDayCell[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string) => void;
}

const getBackgroundColor = (isDark: boolean, cell: CalendarDayCell) => {
  if (!cell.isCurrentMonth) {
    return isDark ? "#101216" : "#EEF2F7";
  }

  if (cell.isToday) {
    return isDark ? "#2F6A4F" : "#CFF3D7";
  }

  switch (cell.activityLevel) {
    case 1:
      return isDark ? "#1F3354" : "#D7E8FF";
    case 2:
      return isDark ? "#1D5E43" : "#DDF6E7";
    case 3:
      return isDark ? "#5C4A11" : "#FFE8A3";
    default:
      return isDark ? "#171A1F" : "#FFFFFF";
  }
};

const getTextColor = (isDark: boolean, cell: CalendarDayCell) => {
  if (!cell.isCurrentMonth) {
    return isDark ? "#4B5563" : "#9AA4B2";
  }
  if (cell.isToday) {
    return isDark ? "#F3FFF6" : "#14532D";
  }
  if (cell.activityLevel === 3) {
    return isDark ? "#FFF7DB" : "#6A4300";
  }
  return isDark ? "#FFFFFF" : "#111827";
};

export function CalendarMonthGrid({
  monthLabel,
  weekdayLabels,
  cells,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
}: CalendarMonthGridProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#13151A" : "#F5F7FB" },
      ]}
    >
      <View style={styles.header}>
        <View>
          <ThemedText type="subtitle">{t("calendar.month.title")}</ThemedText>
          <ThemedText style={styles.monthLabel}>{monthLabel}</ThemedText>
        </View>
        <View style={styles.navButtons}>
          <Pressable
            accessibilityLabel={t("calendar.navigation.previousMonth")}
            onPress={onPreviousMonth}
            style={[
              styles.navButton,
              { backgroundColor: isDark ? "#1D2129" : "#FFFFFF" },
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </Pressable>
          <Pressable
            accessibilityLabel={t("calendar.navigation.nextMonth")}
            onPress={onNextMonth}
            style={[
              styles.navButton,
              { backgroundColor: isDark ? "#1D2129" : "#FFFFFF" },
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#FFFFFF" : "#111827"}
            />
          </Pressable>
        </View>
      </View>
      <View style={styles.weekHeader}>
        {weekdayLabels.map((label, index) => (
          <ThemedText key={`${index}-${label}`} style={styles.weekday}>
            {label}
          </ThemedText>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell) => (
          <Pressable
            key={cell.dateKey}
            onPress={() => onSelectDate(cell.dateKey)}
            style={[
              styles.cell,
              { backgroundColor: getBackgroundColor(isDark, cell) },
              cell.isSelected && {
                borderColor: isDark ? "#FFFFFF" : "#111827",
                borderWidth: 1.5,
              },
              cell.isToday && {
                shadowColor: isDark ? "#FFFFFF" : "#0A7EA4",
                shadowOpacity: 0.18,
                shadowRadius: 6,
                elevation: 2,
              },
            ]}
          >
            <ThemedText style={[styles.dayNumber, { color: getTextColor(isDark, cell) }]}>
              {cell.dayNumber}
            </ThemedText>
            {cell.contributedToStreak ? (
              <View
                style={[
                  styles.streakDot,
                  { backgroundColor: isDark ? "#FB7185" : "#EF4444" },
                ]}
              />
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthLabel: {
    fontSize: 14,
    opacity: 0.66,
    marginTop: 4,
  },
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  weekday: {
    width: 42,
    textAlign: "center",
    fontSize: 12,
    opacity: 0.56,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    width: 42,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
});
