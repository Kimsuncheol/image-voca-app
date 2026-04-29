import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import ExampleSection from "./ExampleSection";
import ExplanationSection from "./ExplanationSection";
import { CollocationData } from "./types";
import { styles } from "./EnglishCollocationCardStyle";

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
  const bgColors = getBackgroundColors(isDark);
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
    <View
      style={[
        styles.back,
        {
          backgroundColor: bgColors.learningCardSurface,
          borderColor: bgColors.learningCardSurface,
        },
      ]}
    >
      {onFlip && <Pressable style={styles.backFlipOverlay} onPress={onFlip} />}

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

      <View style={styles.backFooter} />
    </View>
  );
});
