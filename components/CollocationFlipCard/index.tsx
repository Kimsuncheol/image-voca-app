import React, { useCallback, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import FlipCard from "react-native-flip-card";
import BackSide from "./BackSide";
import FaceSide from "./FaceSide";
import { CollocationData, CollocationWordBankConfig } from "./types";

export { default as CollocationSkeleton } from "./CollocationSkeleton";

// ============================================================================
// Types & Interfaces
// ============================================================================
interface Props {
  // The Data object containing word, meaning, examples, etc.
  data: CollocationData;
  // Theme flag for dark mode support
  isDark?: boolean;
  // Configuration for 'Add to Word Bank' functionality (optional)
  wordBankConfig?: CollocationWordBankConfig;
}

/**
 * CollocationFlipCard Component
 *
 * A reusable flashcard component that flips between a "Face" side (word/meaning)
 * and a "Back" side (examples/explanation).
 *
 * Features:
 * - Animated Flip: Uses `react-native-flip-card` for smooth transitions.
 * - Interaction: Flips on tap of the "Face" side button.
 * - State Tracking: Knows if it is currently flipped or facing front.
 */
export const CollocationFlipCard: React.FC<Props> = React.memo(
  ({ data, isDark = false, wordBankConfig }) => {
    // ============================================================================
    // State Management
    // ============================================================================

    // Tracks if the back side is currently visible (useful for lazy rendering or analytics)
    const [isBackVisible, setIsBackVisible] = useState(false);

    // Controls the flip state of the card (true = back side visible)
    const [isFlipped, setIsFlipped] = useState(false);

    // ============================================================================
    // Event Handlers
    // ============================================================================

    /**
     * Flips the card to show the Back side.
     * Passed down to the FaceSide component.
     */
    const handleFlipToBack = useCallback(() => {
      setIsFlipped(true);
    }, []);

    /**
     * Flips the card to return to the Front side.
     * Passed down to the BackSide component.
     */
    const handleFlipToFront = useCallback(() => {
      setIsFlipped(false);
    }, []);

    // ============================================================================
    // Main Render
    // ============================================================================
    return (
      <FlipCard
        style={styles.card}
        flip={isFlipped}
        friction={10} // Higher friction = slower, more controlled flip
        perspective={2000} // Perspective depth for 3D effect
        flipHorizontal={true}
        flipVertical={false}
        clickable={false} // We handle clicks via custom buttons inside FaceSide/BackSide
        onFlipEnd={setIsBackVisible}
      >
        {/* ============================================================ */}
        {/* Front Face: Shows the Word, Meaning, and Actions             */}
        {/* ============================================================ */}
        <FaceSide
          data={data}
          isDark={isDark}
          wordBankConfig={wordBankConfig}
          onFlip={handleFlipToBack}
        />

        {/* ============================================================ */}
        {/* Back Face: Shows Examples, Explanation, and Context          */}
        {/* ============================================================ */}
        <BackSide
          data={data}
          isDark={isDark}
          isVisible={isBackVisible}
          onFlip={handleFlipToFront}
        />
      </FlipCard>
    );
  },
);

CollocationFlipCard.displayName = "CollocationFlipCard";

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  card: {
    minHeight: height * 0.7,
    width: "90%",
    alignSelf: "center",
    marginVertical: 20,
    backgroundColor: "transparent",
  },
});

export default CollocationFlipCard;
