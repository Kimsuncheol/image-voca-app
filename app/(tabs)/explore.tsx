import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExploreContent } from "../../components/explore/ExploreContent";
import ParallaxScrollView from "../../components/parallax-scroll-view";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { useTheme } from "../../src/context/ThemeContext";

export default function TabTwoScreen() {
  const { isDark } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
        headerImage={
          <IconSymbol
            size={310}
            color="#808080"
            name="chevron.left.forwardslash.chevron.right"
            style={styles.headerImage}
          />
        }
      >
        <ExploreContent />
      </ParallaxScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});
