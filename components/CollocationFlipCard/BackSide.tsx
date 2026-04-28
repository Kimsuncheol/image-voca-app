import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { blackCardColors } from "../course/vocabulary/blackCardStyles";
import ExampleSection from "./ExampleSection";
import ExplanationSection from "./ExplanationSection";
import { CollocationData } from "./types";

type BackSideSection = "explanation" | "example";

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
  const normalizedInitialSection: BackSideSection =
    initialSection === "translation" ? "example" : initialSection;

  const [activeSection, setActiveSection] = useState<BackSideSection>(
    normalizedInitialSection,
  );
  const [contentHeight, setContentHeight] = useState(0);

  // Track if this is the first time the back becomes visible
  const hasOpenedRef = useRef(false);

  // Reset active section when card flips back to front
  // This prevents flickering on the next flip
  useEffect(() => {
    if (!isVisible) {
      hasOpenedRef.current = false;
      // Reset to explanation when card is flipped back to front
      setActiveSection(normalizedInitialSection);
    } else if (!hasOpenedRef.current) {
      // First time back is visible - ensure explanation is active
      hasOpenedRef.current = true;
      setActiveSection(normalizedInitialSection);
    }
  }, [isVisible, normalizedInitialSection]);

  const isExplanationOpen = isVisible && activeSection === "explanation";
  const isExampleOpen = isVisible && activeSection === "example";

  const handleToggleExplanation = React.useCallback(() => {
    setActiveSection("explanation");
  }, []);

  const handleToggleExample = React.useCallback(() => {
    setActiveSection("example");
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

  const exampleMaxHeight = contentHeight ? contentHeight * 0.8 : undefined;

  return (
    <View style={[styles.back, isDark && styles.backDark]}>
      {onFlip && <Pressable style={styles.flipOverlay} onPress={onFlip} />}

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
          translation={data.translation}
          isOpen={isExampleOpen}
          onToggle={handleToggleExample}
          isDark={isDark}
          maxHeight={exampleMaxHeight}
        />
      </View>

      <View style={styles.footer} />
    </View>
  );
});

const styles = StyleSheet.create({
  back: {
    flex: 1,
    backgroundColor: blackCardColors.surface,
    borderRadius: 0,
    paddingHorizontal: 4,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    justifyContent: "space-between",
    borderWidth: 0,
    borderColor: blackCardColors.surface,
  },
  backDark: {
    backgroundColor: blackCardColors.surface,
    borderColor: blackCardColors.surface,
    shadowColor: "#000",
    shadowOpacity: 0,
  },
  flipOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
  },
  backContentContainer: {
    flex: 1,
    minHeight: 0,
    justifyContent: "flex-start",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 0,
    height: 52,
    justifyContent: "center",
  },
});
