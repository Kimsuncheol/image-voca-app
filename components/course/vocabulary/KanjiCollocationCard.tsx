import React from "react";
import { Animated } from "react-native";
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

  const flipAnim = React.useRef(new Animated.Value(0)).current;
  const [mountedSide, setMountedSide] = React.useState<"front" | "back">("front");

  React.useEffect(() => {
    if (!isActive && mountedSide === "back") {
      setMountedSide("front");
      flipAnim.setValue(0);
    }
  }, [isActive, mountedSide, flipAnim]);

  const flip = React.useCallback(
    (to: "front" | "back") => {
      stopCardSpeech();
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setMountedSide(to);
        flipAnim.setValue(-1);
        Animated.timing(flipAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    },
    [flipAnim, stopCardSpeech],
  );

  const rotateY = flipAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-90deg", "0deg", "90deg"],
  });

  return (
    <Animated.View
      style={[styles.card, { transform: [{ perspective: 2000 }, { rotateY }] }]}
    >
      {mountedSide === "front" ? (
        <FaceSide
          item={item}
          isDark={isDark}
          isActive={isActive}
          day={day}
          initialIsSaved={initialIsSaved}
          onSavedWordChange={onSavedWordChange}
          onFlip={() => flip("back")}
        />
      ) : (
        <BackSide
          item={item}
          isDark={isDark}
          isActive={isActive}
          useKorean={i18n.language === "ko"}
          onFlip={() => flip("front")}
        />
      )}
    </Animated.View>
  );
}
