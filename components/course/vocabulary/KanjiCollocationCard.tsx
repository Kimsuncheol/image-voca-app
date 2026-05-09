import React from "react";
import FlipCard from "react-native-flip-card";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../../src/hooks/useCardSpeechCleanup";
import { useJapaneseContentLanguage } from "../../../src/hooks/useJapaneseContentLanguage";
import type { ReviewMaskTarget } from "../../../src/services/speechPreferences";
import type { KanjiWord } from "../../../src/types/vocabulary";
import { FaceSide } from "./KanjiCollocationCardFace";
import { BackSide } from "./KanjiCollocationCardBack";
import { styles } from "./KanjiCollocationCardStyles";

interface KanjiCollocationCardProps {
  item: KanjiWord;
  initialIsSaved?: boolean;
  day?: number;
  isActive?: boolean;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isPreviewMode?: boolean;
  isReviewMode?: boolean;
  isFaceReviewMode?: boolean;
  isBackReviewMode?: boolean;
  reviewMaskTarget?: ReviewMaskTarget;
  onMaskChange?: (enabled: boolean) => void;
  onFaceMaskChange?: (enabled: boolean) => void;
  onBackMaskChange?: (enabled: boolean) => void;
}

export function KanjiCollocationCard({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
  isPreviewMode = false,
  isReviewMode = false,
  isFaceReviewMode = isReviewMode,
  isBackReviewMode = isReviewMode,
  reviewMaskTarget = "word",
  onMaskChange,
  onFaceMaskChange = onMaskChange,
  onBackMaskChange = onMaskChange,
}: KanjiCollocationCardProps) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  const contentLanguage = useJapaneseContentLanguage("KANJI", i18n.language);
  const stopCardSpeech = useCardSpeechCleanup(isActive);

  const [isFlipped, setIsFlipped] = React.useState(false);

  React.useEffect(() => {
    if (!isActive && isFlipped) {
      setIsFlipped(false);
    }
  }, [isActive, isFlipped]);

  const flip = React.useCallback(
    (nextIsFlipped: boolean) => {
      stopCardSpeech();
      setIsFlipped(nextIsFlipped);
    },
    [stopCardSpeech],
  );

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
        language={contentLanguage}
        day={day}
        initialIsSaved={initialIsSaved}
        onSavedWordChange={onSavedWordChange}
        isPreviewMode={isPreviewMode}
        isReviewMode={isFaceReviewMode}
        reviewMaskTarget={reviewMaskTarget}
        onMaskChange={onFaceMaskChange}
        onFlip={() => flip(true)}
      />
      <BackSide
        item={item}
        isDark={isDark}
        isActive={isActive}
        language={contentLanguage}
        useKorean={contentLanguage === "ko"}
        isReviewMode={isBackReviewMode}
        reviewMaskTarget={reviewMaskTarget}
        onMaskChange={onBackMaskChange}
        onFlip={() => flip(false)}
      />
    </FlipCard>
  );
}
