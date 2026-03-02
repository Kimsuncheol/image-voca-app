import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TabType = "csv" | "link";

interface TabSwitcherProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDark: boolean;
}

export default function TabSwitcher({
  activeTab,
  setActiveTab,
  isDark,
}: TabSwitcherProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "csv" && styles.tabActive]}
        onPress={() => setActiveTab("csv")}
      >
        <Text
          style={[styles.tabText, activeTab === "csv" && styles.tabTextActive]}
        >
          Upload CSV File
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "link" && styles.tabActive]}
        onPress={() => setActiveTab("link")}
      >
        <Text
          style={[styles.tabText, activeTab === "link" && styles.tabTextActive]}
        >
          Upload via Link
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const accent = "#0A84FF";

  return StyleSheet.create({
    tabContainer: {
      flexDirection: "row",
      marginBottom: 12,
      alignItems: "center",
    },
    tab: {
      flex: 1,
      minHeight: 38,
      paddingVertical: 9,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isDark ? "#3A3A3C" : "#D1D1D6",
      backgroundColor: "transparent",
      marginRight: 8,
    },
    tabActive: {
      backgroundColor: accent,
      borderColor: accent,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.22 : 0.14,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#AEAEB2" : "#6E6E73",
    },
    tabTextActive: {
      color: "#FFFFFF",
    },
  });
};
