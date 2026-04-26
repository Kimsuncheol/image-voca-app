import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontSizes } from "@/constants/fontSizes";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
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

const TOTAL_PAGES = TABS.length * 3;
const MIDDLE_OFFSET = TABS.length;

export default function AppTabScaffold() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(MIDDLE_OFFSET);
  const tabIndexByKey = new Map(TABS.map((tab, index) => [tab.key, index]));

  const getTabIndex = (page: number) => {
    return ((page % TABS.length) + TABS.length) % TABS.length;
  };

  const activeTabIndex = getTabIndex(currentPage);

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const position = e.nativeEvent.position;
      setCurrentPage(position);

      if (position < TABS.length) {
        setTimeout(() => {
          pagerRef.current?.setPageWithoutAnimation(position + TABS.length);
          setCurrentPage(position + TABS.length);
        }, 100);
      } else if (position >= TABS.length * 2) {
        setTimeout(() => {
          pagerRef.current?.setPageWithoutAnimation(position - TABS.length);
          setCurrentPage(position - TABS.length);
        }, 100);
      }
    },
    [],
  );

  const handleTabPress = (index: number) => {
    const targetPage = MIDDLE_OFFSET + index;
    pagerRef.current?.setPage(targetPage);
  };

  const handleTabPressByKey = (key: string) => {
    const index = tabIndexByKey.get(key);
    if (index === undefined) {
      return;
    }
    handleTabPress(index);
  };

  const renderScreen = (tabIndex: number) => {
    switch (tabIndex) {
      case 0:
        return <DashboardScreen />;
      case 1:
        return <WordBankScreen />;
      case 2:
        return <CourseSelectionScreen />;
      case 3:
        return <CalendarScreen />;
      case 4:
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <TabLayoutProvider goToTab={handleTabPressByKey}>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
        edges={["top", "bottom"]}
      >
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={MIDDLE_OFFSET}
          onPageSelected={onPageSelected}
          overdrag={true}
        >
          {Array.from({ length: TOTAL_PAGES }).map((_, pageIndex) => {
            const tabIndex = getTabIndex(pageIndex);
            return (
              <View key={pageIndex} style={styles.page}>
                {renderScreen(tabIndex)}
              </View>
            );
          })}
        </PagerView>

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
                left: (width / TABS.length) * activeTabIndex,
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
                onPress={() => handleTabPress(index)}
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
  pagerView: {
    flex: 1,
  },
  page: {
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
    fontSize: FontSizes.xs,
    fontWeight: "600",
    marginTop: 2,
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: 2,
  },
});
