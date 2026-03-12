import React from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isStudyCompleted?: boolean;
}

const HINT_TIMEOUT_MS = 1200;

export const CollocationSwipeable: React.FC<Props> = ({
  data,
  initialIndex = 0,
  onIndexChange,
  onFinish,
  renderFinalPage,
  isDark = false,
  day,
  savedWordIds,
  onSavedWordChange,
  isStudyCompleted = false,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const normalizedInitialIndex =
    initialIndex <= data.length ? initialIndex : Math.max(0, data.length - 1);
  const [activeIndex, setActiveIndex] = React.useState(normalizedInitialIndex);
  const [isHintVisible, setIsHintVisible] = React.useState(false);
  const unlockedIndicesRef = React.useRef<Set<number>>(new Set());
  const hintTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setActiveIndex(normalizedInitialIndex);
    unlockedIndicesRef.current = new Set();
    setIsHintVisible(false);
  }, [normalizedInitialIndex, data.length]);

  React.useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  const totalPages = renderFinalPage ? data.length + 1 : data.length;
  const currentItem = activeIndex < data.length ? data[activeIndex] : null;

  const showBlockedHint = React.useCallback(() => {
    setIsHintVisible(true);
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = setTimeout(() => {
      setIsHintVisible(false);
    }, HINT_TIMEOUT_MS);
  }, []);

  const goToIndex = React.useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= totalPages || nextIndex === activeIndex) {
        return;
      }

      setActiveIndex(nextIndex);
      setIsHintVisible(false);
      onIndexChange?.(nextIndex);

      if (renderFinalPage && nextIndex === data.length) {
        onFinish?.();
      }
    },
    [activeIndex, data.length, onFinish, onIndexChange, renderFinalPage, totalPages],
  );

  const handleNext = React.useCallback(() => {
    if (activeIndex >= data.length) {
      return;
    }

    if (!isStudyCompleted && !unlockedIndicesRef.current.has(activeIndex)) {
      showBlockedHint();
      return;
    }

    goToIndex(activeIndex + 1);
  }, [activeIndex, data.length, goToIndex, isStudyCompleted, showBlockedHint]);

  const handlePrevious = React.useCallback(() => {
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  const handleCardFirstFlip = React.useCallback(() => {
    if (activeIndex < data.length) {
      unlockedIndicesRef.current.add(activeIndex);
    }
  }, [activeIndex, data.length]);

  return (
    <View style={styles.container}>
      <View style={styles.page}>
        {currentItem ? (
          <CollocationFlipCard
            data={{
              collocation: currentItem.word,
              meaning: currentItem.meaning,
              explanation: currentItem.pronunciation || "",
              example: currentItem.example,
              translation: currentItem.translation || "",
            }}
            isDark={isDark}
            wordBankConfig={{
              id: currentItem.id,
              course: currentItem.course,
              day,
              initialIsSaved: savedWordIds?.has(currentItem.id) ?? false,
              enableAdd: true,
              enableDelete: false,
              onSavedStateChange: onSavedWordChange,
            }}
            onFirstFlipToBack={handleCardFirstFlip}
            isActive={true}
          />
        ) : (
          renderFinalPage?.()
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Previous card"
          disabled={activeIndex === 0}
          onPress={handlePrevious}
          style={[
            styles.button,
            isDark ? styles.buttonDark : styles.buttonLight,
            activeIndex === 0 && styles.buttonDisabled,
          ]}
        >
          <Text style={isDark ? styles.buttonTextDark : styles.buttonTextLight}>
            Previous
          </Text>
        </TouchableOpacity>
        {activeIndex < data.length && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next card"
            onPress={handleNext}
            style={[
              styles.button,
              styles.buttonPrimary,
              activeIndex === data.length - 1 &&
                renderFinalPage &&
                styles.buttonFinish,
            ]}
          >
            <Text style={styles.buttonTextPrimary}>
              {activeIndex === data.length - 1 && renderFinalPage ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isHintVisible && (
        <View
          pointerEvents="none"
          style={[
            styles.hintContainer,
            isDark ? styles.hintContainerDark : styles.hintContainerLight,
            { top: insets.top + 12 },
          ]}
        >
          <Text style={isDark ? styles.hintTextDark : styles.hintTextLight}>
            {t("swipe.hints.flipFirst")}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonLight: {
    backgroundColor: "#f0f0f0",
  },
  buttonDark: {
    backgroundColor: "#242426",
  },
  buttonPrimary: {
    backgroundColor: "#2f6fed",
  },
  buttonFinish: {
    backgroundColor: "#1f8f5f",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextLight: {
    color: "#111",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonTextDark: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonTextPrimary: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  hintContainer: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hintContainerLight: {
    backgroundColor: "rgba(0, 0, 0, 0.78)",
  },
  hintContainerDark: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  hintTextLight: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  hintTextDark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CollocationSwipeable;
