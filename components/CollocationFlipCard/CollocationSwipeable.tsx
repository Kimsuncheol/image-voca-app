import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import PagerView from "react-native-pager-view";
import { VocabularyCard } from "../../src/types/vocabulary";
import { CollocationFlipCard } from "./index";

interface Props {
  data: VocabularyCard[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onFinish?: () => void;
  renderFinalPage?: () => React.ReactNode;
  isDark?: boolean;
}

export const CollocationSwipeable: React.FC<Props> = ({
  data,
  initialIndex = 0,
  onIndexChange,
  onFinish,
  renderFinalPage,
  isDark = false,
}) => {
  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    onIndexChange?.(position);

    // If we have a final page and we reached it, trigger onFinish
    if (renderFinalPage && position === data.length) {
      onFinish?.();
    }
  };

  return (
    <PagerView
      style={styles.pagerView}
      initialPage={initialIndex}
      onPageSelected={handlePageSelected}
      orientation="horizontal"
    >
      {data.map((item, index) => (
        <View key={item.id} style={styles.page}>
          <CollocationFlipCard
            data={{
              collocation: item.word,
              meaning: item.meaning,
              explanation: item.pronunciation || "",
              example: item.example,
              translation: item.translation || "",
            }}
            isDark={isDark}
          />
          {/* Page Indicator */}
          <Text
            style={[styles.pageIndicator, { color: isDark ? "#fff" : "#000" }]}
          >
            {index + 1} / {data.length}
          </Text>

          {/* Minimal indicator */}
          <View
            style={[
              styles.indicator,
              { backgroundColor: isDark ? "#444" : "#eee" },
            ]}
          >
            <Ionicons
              name="swap-horizontal"
              size={16}
              color={isDark ? "#888" : "#aaa"}
            />
          </View>
        </View>
      ))}
      {renderFinalPage && (
        <View key="final-page" style={styles.page}>
          {renderFinalPage()}
        </View>
      )}
    </PagerView>
  );
};

const styles = StyleSheet.create({
  pagerView: {
    flex: 1,
    width: "100%",
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageIndicator: {
    position: "absolute",
    bottom: 25,
    fontSize: 14,
    opacity: 0.5,
  },
  indicator: {
    position: "absolute",
    bottom: 55,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CollocationSwipeable;
