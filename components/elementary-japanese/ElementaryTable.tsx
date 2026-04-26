import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { FontSizes } from "@/constants/fontSizes";

import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

export type ElementaryTableColumn = {
  key: string;
  label: string;
  style?: StyleProp<ViewStyle>;
};

type ElementaryTableProps = {
  columns: ElementaryTableColumn[];
  children?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  hasData?: boolean;
  style?: StyleProp<ViewStyle>;
};

type ElementaryTableRowProps = {
  children: React.ReactNode;
  index: number;
  style?: StyleProp<ViewStyle>;
};

export function ElementaryTable({
  columns,
  children,
  loading = false,
  error = null,
  emptyMessage,
  hasData = true,
  style,
}: ElementaryTableProps) {
  const { isDark } = useTheme();

  const headerRowBg = isDark ? "#242426" : "#ffffff";
  const messageRowBg = isDark ? "#1a1a1c" : "#ffffff";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";

  return (
    <View style={style}>
      <View style={[styles.row, { backgroundColor: headerRowBg }]}>
        {columns.map((column) => (
          <ThemedText
            key={column.key}
            style={[styles.headerCell, column.style, { color: mutedText }]}
          >
            {column.label}
          </ThemedText>
        ))}
      </View>

      {loading ? (
        <View style={[styles.messageRow, { backgroundColor: messageRowBg }]}>
          <ThemedText style={[styles.bodyText, { color: mutedText }]}>
            Loading...
          </ThemedText>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={[styles.messageRow, { backgroundColor: messageRowBg }]}>
          <ThemedText style={[styles.bodyText, { color: mutedText }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      {!loading && !error && !hasData && emptyMessage ? (
        <View style={[styles.messageRow, { backgroundColor: messageRowBg }]}>
          <ThemedText style={[styles.bodyText, { color: mutedText }]}>
            {emptyMessage}
          </ThemedText>
        </View>
      ) : null}

      {!loading && !error && hasData ? children : null}
    </View>
  );
}

export function ElementaryTableRow({
  children,
  index,
  style,
}: ElementaryTableRowProps) {
  const { isDark } = useTheme();

  const rowBg =
    index % 2 === 0
      ? isDark
        ? "#1a1a1c"
        : "#fff"
      : isDark
        ? "#222224"
        : "#f8fafc";

  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "#d9e2e8";

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: rowBg,
          borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: dividerColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerCell: {
    fontSize: FontSizes.xs,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  messageRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  bodyText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
    lineHeight: 16,
  },
});
