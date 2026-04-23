import React from "react";
import FlipCard from "react-native-flip-card";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../../src/hooks/useCardSpeechCleanup";
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
}

export function KanjiCollocationCard({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
}: KanjiCollocationCardProps) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
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
        language={i18n.language}
        day={day}
        initialIsSaved={initialIsSaved}
        onSavedWordChange={onSavedWordChange}
        onFlip={() => flip(true)}
      />
      <BackSide
        item={item}
        isDark={isDark}
        isActive={isActive}
        language={i18n.language}
        useKorean={i18n.language === "ko"}
        onFlip={() => flip(false)}
      />
    </FlipCard>
  );
}
