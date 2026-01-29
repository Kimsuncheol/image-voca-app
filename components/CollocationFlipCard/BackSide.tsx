import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import ExampleSection from "./ExampleSection";
import ExplanationSection from "./ExplanationSection";
import TranslationSection from "./TranslationSection";
import { CollocationData } from "./types";

interface BackSideProps {
  data: CollocationData;
  isDark: boolean;
  isVisible: boolean;
  initialSection?: "explanation" | "example" | "translation";
  onFlip?: () => void;
}

export default React.memo(function BackSide({
  data,
  isDark,
  isVisible,
  initialSection = "explanation",
  onFlip,
}: BackSideProps) {
  const [activeSection, setActiveSection] = useState<
    "explanation" | "example" | "translation"
  >(initialSection);
  const [contentHeight, setContentHeight] = useState(0);

  // Track if this is the first time the back becomes visible
  const hasOpenedRef = useRef(false);

  // Reset active section when card flips back to front
  // This prevents flickering on the next flip
  useEffect(() => {
    if (!isVisible) {
      hasOpenedRef.current = false;
      // Reset to explanation when card is flipped back to front
      setActiveSection(initialSection);
    } else if (!hasOpenedRef.current) {
      // First time back is visible - ensure explanation is active
      hasOpenedRef.current = true;
      setActiveSection(initialSection);
    }
  }, [isVisible, initialSection]);

  const isExplanationOpen = isVisible && activeSection === "explanation";
  const isExampleOpen = isVisible && activeSection === "example";
  const isTranslationOpen = isVisible && activeSection === "translation";

  const handleToggleExplanation = React.useCallback(() => {
    setActiveSection("explanation");
  }, []);

  const handleToggleExample = React.useCallback(() => {
    setActiveSection("example");
  }, []);

  const handleToggleTranslation = React.useCallback(() => {
    setActiveSection("translation");
  }, []);

  const handleContentLayout = React.useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight && nextHeight !== contentHeight) {
        setContentHeight(nextHeight);
      }
    },
    [contentHeight],
  );

  const exampleMaxHeight = contentHeight ? contentHeight * 0.7 : undefined;

  return (
    <View style={[styles.back, isDark && styles.backDark]}>
      {onFlip && <Pressable style={styles.flipOverlay} onPress={onFlip} />}

      {/* Accent Brand Mark */}
      <View style={styles.accentMark} />

      <View
        style={styles.backContentContainer}
        pointerEvents="box-none"
        onLayout={handleContentLayout}
      >
        <ExplanationSection
          explanation={data.explanation}
          isOpen={isExplanationOpen}
          onToggle={handleToggleExplanation}
          isDark={isDark}
        />

        <ExampleSection
          example={data.example}
          isOpen={isExampleOpen}
          onToggle={handleToggleExample}
          isDark={isDark}
          maxHeight={exampleMaxHeight}
        />

        <TranslationSection
          translation={data.translation}
          isOpen={isTranslationOpen}
          onToggle={handleToggleTranslation}
          isDark={isDark}
        />
      </View>

      <View style={styles.footer} />
    </View>
  );
});

const styles = StyleSheet.create({
  back: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  backDark: {
    backgroundColor: "#1c1c1e",
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  accentMark: {
    position: "absolute",
    top: 32,
    right: 32,
    width: 6,
    height: 24,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    transform: [{ rotate: "15deg" }],
  },
  flipOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  backContentContainer: {
    flex: 1,
    paddingTop: 40,
    justifyContent: "flex-start",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 0,
    height: 52,
    justifyContent: "center",
  },
});
