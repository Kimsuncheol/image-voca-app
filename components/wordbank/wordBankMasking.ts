import type { TextStyle } from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getReviewTapeTextStyle } from "../../src/utils/reviewMasking";

export function getWordBankReviewTapeTextStyle(isDark: boolean): TextStyle {
  return {
    ...getReviewTapeTextStyle(isDark),
    color: getBackgroundColors(isDark).learningCardSurfaceAlt,
  };
}
