import Animated from 'react-native-reanimated';
import { FontSizes } from "@/constants/fontSizes";
import { LineHeights } from "@/constants/lineHeights";

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: FontSizes.headingLg,
        lineHeight: LineHeights.headingXl,
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      👋
    </Animated.Text>
  );
}
