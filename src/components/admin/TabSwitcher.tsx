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

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    tabContainer: {
      flexDirection: "row",
      marginBottom: 12,
      borderRadius: 10,
      backgroundColor: isDark ? "#1c1c1e" : "#e5e5ea",
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: "#007AFF",
    },
    tabText: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#8e8e93" : "#6e6e73",
    },
    tabTextActive: {
      color: "#fff",
    },
  });
