import React from "react";
import { StyleSheet, View } from "react-native";
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
  day?: number;
  savedWordIds?: Set<string>;
}

export const CollocationSwipeable: React.FC<Props> = ({
  data,
  initialIndex = 0,
  onIndexChange,
  onFinish,
  renderFinalPage,
  isDark = false,
  day,
  savedWordIds,
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
            wordBankConfig={{
              id: item.id,
              course: item.course,
              day,
              initialIsSaved: savedWordIds?.has(item.id) ?? false,
              enableAdd: true,
              enableDelete: false,
            }}
          />
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
});

export default CollocationSwipeable;
