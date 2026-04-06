import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "../../components/ui/icon-symbol";
import { Colors } from "../../constants/theme";
import { TabLayoutProvider } from "../../src/context/TabLayoutContext";
import { useTheme } from "../../src/context/ThemeContext";

import DashboardScreen from "../../app/(tabs)/index";
import CalendarScreen from "../../app/calendar";
import SettingsScreen from "../../app/(tabs)/settings";
import CourseSelectionScreen from "../../app/(tabs)/swipe";
import WordBankScreen from "../../app/(tabs)/wordbank";

const TABS = [
  { key: "dashboard", titleKey: "tabs.dashboard", icon: "house.fill" as const },
  { key: "wordbank", titleKey: "tabs.wordBank", icon: "folder.fill" as const },
  { key: "voca", titleKey: "tabs.voca", icon: "book.fill" as const },
  { key: "calendar", titleKey: "tabs.calendar", icon: "calendar" as const },
  {
    key: "settings",
    titleKey: "tabs.settings",
    icon: "gearshape.fill" as const,
  },
];

export default function AppTabScaffoldWeb() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [activeTabKey, setActiveTabKey] = useState<(typeof TABS)[number]["key"]>(
    "dashboard",
  );

  const activeTabIndex = useMemo(
    () => TABS.findIndex((tab) => tab.key === activeTabKey),
    [activeTabKey],
  );

  const goToTab = (key: string) => {
    if (TABS.some((tab) => tab.key === key)) {
      setActiveTabKey(key as (typeof TABS)[number]["key"]);
    }
  };

  const renderScreen = () => {
    switch (activeTabKey) {
      case "dashboard":
        return <DashboardScreen />;
      case "wordbank":
        return <WordBankScreen />;
      case "voca":
        return <CourseSelectionScreen />;
      case "calendar":
        return <CalendarScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <TabLayoutProvider goToTab={goToTab}>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
        edges={["top", "bottom"]}
      >
        <View style={styles.content}>{renderScreen()}</View>

        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#fff",
              borderTopColor: isDark ? "#38383a" : "#e0e0e0",
            },
          ]}
        >
          <View
            style={[
              styles.indicator,
              {
                width: width / TABS.length,
                left: (width / TABS.length) * Math.max(activeTabIndex, 0),
                backgroundColor: Colors[isDark ? "dark" : "light"].tint,
              },
            ]}
          />

          {TABS.map((tab, index) => {
            const isActive = index === activeTabIndex;
            const color = isActive
              ? Colors[isDark ? "dark" : "light"].tint
              : isDark
                ? "#8e8e93"
                : "#999";

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, { width: width / TABS.length }]}
                onPress={() => goToTab(tab.key)}
                activeOpacity={0.7}
              >
                <IconSymbol size={24} name={tab.icon} color={color} />
                <Text style={[styles.tabLabel, { color }]}>
                  {t(tab.titleKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </TabLayoutProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    position: "relative",
  },
  tabItem: {
    alignItems: "center",
    paddingVertical: 8,
    paddingBottom: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: 2,
  },
});
