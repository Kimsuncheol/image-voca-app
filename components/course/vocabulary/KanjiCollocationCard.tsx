import React from "react";
import { useTranslation } from "react-i18next";
import FlipCard from "react-native-flip-card";
import { useTheme } from "../../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../../src/hooks/useCardSpeechCleanup";
import type { KanjiWord } from "../../../src/types/vocabulary";
import { FaceSide } from "./KanjiCollocationCardFace";
import { BackSide } from "./KanjiCollocationCardBack";
import { styles } from "./KanjiCollocationCardStyles";

/**
 * Props for the root `KanjiCollocationCard` component.
 */
interface KanjiCollocationCardProps {
  /** The primary vocabulary item populated with parsed detailed kanji properties */
  item: KanjiWord;
  /** Initial boolean flag noting whether the user has previously saved this word */
  initialIsSaved?: boolean;
  /** Represents the specific "day" grouping to render DayBadges */
  day?: number;
  /** Defines if the user is currently viewing this exact card, triggering mounts/TTS cleanup properly */
  isActive?: boolean;
  /** Callback linking to the global save handler from the parent screen */
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

/**
 * KanjiCollocationCard
 * 
 * The parent wrapper for the vocabulary flip card. Uses `FlipCard` internally to orchestrate
 * 3D rotations between the minimalist summary `FaceSide` and the highly detailed `BackSide`.
 * Manages the `isFlipped` state locally and passes down theme/translation context props
 * natively avoiding huge component sizes.
 */
export function KanjiCollocationCard({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
}: KanjiCollocationCardProps) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  useCardSpeechCleanup(isActive);

  const [isFlipped, setIsFlipped] = React.useState(false);
  const useKorean = i18n.language === "ko";

  React.useEffect(() => {
    if (!isActive && isFlipped) {
      setIsFlipped(false);
    }
  }, [isActive, isFlipped]);

  const handleFlipToBack = React.useCallback(() => setIsFlipped(true), []);
  const handleFlipToFront = React.useCallback(() => setIsFlipped(false), []);

  return (
    <FlipCard
      style={styles.card}
      flip={isFlipped}
      friction={10}
      perspective={2000}
      flipHorizontal={true}
      flipVertical={false}
      clickable={false}
    >
      <FaceSide
        item={item}
        isDark={isDark}
        isActive={isActive}
        day={day}
        initialIsSaved={initialIsSaved}
        onSavedWordChange={onSavedWordChange}
        onFlip={handleFlipToBack}
      />
      <BackSide
        item={item}
        isDark={isDark}
        isActive={isActive}
        useKorean={useKorean}
        onFlip={handleFlipToFront}
      />
    </FlipCard>
  );
}
