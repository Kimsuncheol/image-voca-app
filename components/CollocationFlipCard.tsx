import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import FlipCard from "react-native-flip-card";

import Collapsible from "react-native-collapsible";

interface CollocationData {
  collocation: string;
  meaning: string;
  explanation: string;
  example: string;
  translation: string;
}

interface Props {
  data: CollocationData;
  isDark?: boolean;
}

export const CollocationFlipCard: React.FC<Props> = ({
  data,
  isDark = false,
}) => {
  const [activeSection, setActiveSection] = React.useState<
    "explanation" | "example"
  >("explanation");
  const [isBackVisible, setIsBackVisible] = React.useState(false);

  React.useEffect(() => {
    console.log("[CollocationFlipCard] state", {
      activeSection,
      isBackVisible,
    });
  }, [activeSection, isBackVisible]);

  const isExplanationOpen = isBackVisible && activeSection === "explanation";
  const isExampleOpen = isBackVisible && activeSection === "example";

  return (
    <FlipCard
      style={styles.card}
      friction={10}
      perspective={2000}
      flipHorizontal={true}
      flipVertical={false}
      clickable={true}
      onFlipEnd={setIsBackVisible}
    >
      {/* Face Side */}
      <View style={[styles.face, isDark && styles.faceDark]}>
        {/* Accent Brand Mark */}
        <View style={styles.accentMark} />

        <View style={styles.contentContainer}>
          <Text style={[styles.collocationText, isDark && styles.textDark]}>
            {data.collocation}
          </Text>
          <Text style={[styles.meaningText, isDark && styles.textDark]}>
            {data.meaning}
          </Text>
        </View>

        <View style={styles.footer}>
          {/* Minimal indicator */}
          <View
            style={[
              styles.indicator,
              { backgroundColor: isDark ? "#444" : "#eee" },
            ]}
          >
            <Ionicons
              name="swap-horizontal"
              size={16}
              color={isDark ? "#888" : "#aaa"}
            />
          </View>
        </View>
      </View>

      {/* Back Side */}
      <View style={[styles.back, isDark && styles.backDark]}>
        {/* Accent Brand Mark */}
        <View style={styles.accentMark} />

        <View style={styles.backContentContainer}>
          {/* Explanation Section */}
          <TouchableOpacity
            style={styles.header}
            onPress={() => setActiveSection("explanation")}
            activeOpacity={0.7}
          >
            <Text style={styles.label}>EXPLANATION</Text>
            <Ionicons
              name={
                activeSection === "explanation"
                  ? "chevron-down"
                  : "chevron-forward"
              }
              size={16}
              color="#999"
            />
          </TouchableOpacity>

          <Collapsible collapsed={!isExplanationOpen}>
            <View style={styles.sectionContent}>
              <Text style={[styles.value, isDark && styles.textDark]}>
                {data.explanation}
              </Text>
            </View>
          </Collapsible>

          {/* Example Section (Groups Example & Translation) */}
          <TouchableOpacity
            style={styles.header}
            onPress={() => setActiveSection("example")}
            activeOpacity={0.7}
          >
            <Text style={styles.label}>EXAMPLE</Text>
            <Ionicons
              name={
                activeSection === "example" ? "chevron-down" : "chevron-forward"
              }
              size={16}
              color="#999"
            />
          </TouchableOpacity>

          <Collapsible collapsed={!isExampleOpen}>
            <View style={styles.sectionContent}>
              {data.example ? (
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={[
                      styles.value,
                      isDark && styles.textDark,
                      { fontStyle: "italic" },
                    ]}
                  >
                    &quot;{data.example}&quot;
                  </Text>
                </View>
              ) : null}

              <View>
                <Text style={[styles.subLabel, { marginBottom: 4 }]}>
                  TRANSLATION
                </Text>
                <Text style={[styles.value, isDark && styles.textDark]}>
                  {data.translation}
                </Text>
              </View>
            </View>
          </Collapsible>
        </View>

        <View style={styles.footer}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: isDark ? "#444" : "#eee" },
            ]}
          >
            <Ionicons
              name="swap-horizontal"
              size={16}
              color={isDark ? "#888" : "#aaa"}
            />
          </View>
        </View>
      </View>
    </FlipCard>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 480, // Taller card for better presence
    width: "90%",
    alignSelf: "center",
    marginVertical: 20,
    backgroundColor: "transparent", // Important for flip card
  },
  face: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  faceDark: {
    backgroundColor: "#1c1c1e",
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  back: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  backDark: {
    backgroundColor: "#1c1c1e",
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  accentMark: {
    position: "absolute",
    top: 32,
    right: 32,
    width: 6,
    height: 24,
    backgroundColor: "#4A90E2", // Or use a gradient if possible via library, keeping it simple flat color for now
    borderRadius: 3,
    transform: [{ rotate: "15deg" }],
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backContentContainer: {
    flex: 1,
    paddingTop: 40, // Increased top padding
    justifyContent: "flex-start", // Align start to handle varying content height
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 8,
  },
  sectionContent: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#bbb",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  collocationText: {
    fontSize: 42,
    fontWeight: "700", // Bold but elegant
    textAlign: "center",
    color: "#111",
    lineHeight: 52,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", // Elegant serif font
    letterSpacing: -0.5,
  },
  meaningText: {
    fontSize: 22,
    fontWeight: "400",
    textAlign: "center",
    color: "#666",
    marginTop: 24,
    lineHeight: 30,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  textDark: {
    color: "#FFFFFF",
  },
  textSecondaryDark: {
    color: "#888",
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    // marginBottom: 8, // Removed since it is in header now
    letterSpacing: 1.2, // Wide spacing for uppercase labels
  },
  value: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    fontWeight: "400",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 0,
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
