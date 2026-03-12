import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useWordBankDisplayStore } from "../../src/stores/wordBankDisplayStore";
import { CourseType } from "../../src/types/vocabulary";
import { CollocationFlipCard } from "../CollocationFlipCard";
import { SavedWord, WordCard } from "../wordbank/WordCard";

interface WordListProps {
  words: SavedWord[];
  courseId: string;
  courseColor?: string;
  isDark: boolean;
  isDeleteMode: boolean;
  selectedIds: Set<string>;
  onStartDeleteMode: (wordId: string) => void;
  onToggleSelection: (wordId: string) => void;
}

export function WordList({
  words,
  courseId,
  courseColor,
  isDark,
  isDeleteMode,
  selectedIds,
  onStartDeleteMode,
  onToggleSelection,
}: WordListProps) {
  const { collocationDisplay, otherDisplay } = useWordBankDisplayStore();
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [courseId]);

  React.useEffect(() => {
    setActiveIndex((index) =>
      words.length === 0 ? 0 : Math.min(index, words.length - 1),
    );
  }, [words.length]);

  if (courseId === "COLLOCATION" && collocationDisplay === "all") {
    const activeWord = words[activeIndex];

    if (!activeWord) {
      return null;
    }

    return (
      <View style={styles.container}>
        <View style={styles.page}>
          <CollocationFlipCard
            data={{
              collocation: activeWord.word,
              meaning: activeWord.meaning,
              explanation: activeWord.pronunciation || "",
              example: activeWord.example,
              translation: activeWord.translation || "",
            }}
            isDark={isDark}
            wordBankConfig={{
              id: activeWord.id,
              course: courseId as CourseType,
              day: activeWord.day,
              initialIsSaved: true,
              enableAdd: false,
              enableDelete: false,
              isDeleteMode,
              isSelected: selectedIds.has(activeWord.id),
              onStartDeleteMode,
              onToggleSelection,
            }}
            isActive={true}
          />
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Previous saved card"
            disabled={activeIndex === 0}
            onPress={() => setActiveIndex((index) => Math.max(0, index - 1))}
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
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next saved card"
            disabled={activeIndex === words.length - 1}
            onPress={() =>
              setActiveIndex((index) => Math.min(words.length - 1, index + 1))
            }
            style={[
              styles.button,
              isDark ? styles.buttonDark : styles.buttonLight,
              activeIndex === words.length - 1 && styles.buttonDisabled,
            ]}
          >
            <Text style={isDark ? styles.buttonTextDark : styles.buttonTextLight}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (courseId === "COLLOCATION") {
    return (
      <>
        {words.map((word, index) => (
          <WordCard
            key={word.id + index}
            word={word}
            courseColor={courseColor}
            isDark={isDark}
            showDetails={false}
            isDeleteMode={isDeleteMode}
            isSelected={selectedIds.has(word.id)}
            onStartDeleteMode={onStartDeleteMode}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {words.map((word, index) => (
        <WordCard
          key={word.id + index}
          word={word}
          courseColor={courseColor}
          isDark={isDark}
          showDetails={otherDisplay === "all"}
          isDeleteMode={isDeleteMode}
          isSelected={selectedIds.has(word.id)}
          onStartDeleteMode={onStartDeleteMode}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
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
});
