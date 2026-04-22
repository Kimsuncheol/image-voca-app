import { CARD_HEIGHT, CARD_WIDTH } from "@/src/constants/layout";
import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import FlipCard from "react-native-flip-card";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
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
  // Called once when this card is flipped to the back for the first time
  onFirstFlipToBack?: () => void;
  // Indicates whether the card is the active one in a paginated/swipable view
  isActive?: boolean;
  // Called when the card image finishes loading (or errors, or there is no image)
  onImageLoad?: () => void;
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
  ({
    data,
    isDark = false,
    wordBankConfig,
    onFirstFlipToBack,
    isActive = true,
    onImageLoad,
  }) => {
    // ============================================================================
    // State Management
    // ============================================================================

    // Tracks if the back side is currently visible (useful for lazy rendering or analytics)
    const [isBackVisible, setIsBackVisible] = useState(false);

    // Controls the flip state of the card (true = back side visible)
    const [isFlipped, setIsFlipped] = useState(false);
    const hasReportedFirstBackRef = React.useRef(false);
    useCardSpeechCleanup(isActive);

    // Reset flip state when the card becomes inactive (user swipes away)
    React.useEffect(() => {
      if (isActive === false && isFlipped) {
        setIsFlipped(false);
      }
    }, [isActive, isFlipped]);

    React.useEffect(() => {
      if (wordBankConfig?.isDeleteMode && isFlipped) {
        setIsFlipped(false);
      }
    }, [isFlipped, wordBankConfig?.isDeleteMode]);

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

    const handleFlipEnd = useCallback(
      (isFlippedBack: boolean) => {
        setIsBackVisible(isFlippedBack);
        if (isFlippedBack && !hasReportedFirstBackRef.current) {
          hasReportedFirstBackRef.current = true;
          onFirstFlipToBack?.();
        }
      },
      [onFirstFlipToBack],
    );

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
        onFlipEnd={handleFlipEnd}
      >
        {/* ============================================================ */}
        {/* Front Face: Shows the Word, Meaning, and Actions             */}
        {/* ============================================================ */}
        <FaceSide
          data={data}
          isDark={isDark}
          wordBankConfig={wordBankConfig}
          onFlip={wordBankConfig?.isDeleteMode ? undefined : handleFlipToBack}
          onImageLoad={onImageLoad}
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

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    alignSelf: "center",
    backgroundColor: "transparent",
  },
});

export default CollocationFlipCard;
