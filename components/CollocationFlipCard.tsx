import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import FlipCard from "react-native-flip-card";

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
  return (
    <FlipCard
      style={styles.card}
      friction={6}
      perspective={1000}
      flipHorizontal={true}
      flipVertical={false}
      clickable={true}
    >
      {/* Face Side */}
      <View style={[styles.face, isDark && styles.faceDark]}>
        <View style={styles.headerBar} />
        <View style={styles.contentContainer}>
          <Text style={[styles.collocationText, isDark && styles.textDark]}>
            {data.collocation}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text
            style={[styles.flipInstruction, isDark && styles.textSecondaryDark]}
          >
            Tap to verify
          </Text>
          <Ionicons
            name="arrow-redo-outline"
            size={16}
            color={isDark ? "#888" : "#888"}
          />
        </View>
      </View>

      {/* Back Side */}
      <View style={[styles.back, isDark && styles.backDark]}>
        <View style={styles.headerBar} />
        <View style={styles.backContentContainer}>
          <View style={styles.section}>
            <Text style={styles.label}>Meaning:</Text>
            <Text style={[styles.value, isDark && styles.textDark]}>
              {data.meaning}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Explanation:</Text>
            <Text style={[styles.value, isDark && styles.textDark]}>
              {data.explanation}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Example:</Text>
            <Text style={[styles.value, isDark && styles.textDark]}>
              {data.example}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Translation:</Text>
            <Text style={[styles.value, isDark && styles.textDark]}>
              {data.translation}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text
            style={[styles.flipInstruction, isDark && styles.textSecondaryDark]}
          >
            Tap to flip back
          </Text>
          <Ionicons
            name="arrow-undo-outline"
            size={16}
            color={isDark ? "#888" : "#888"}
          />
        </View>
      </View>
    </FlipCard>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 400,
    width: "100%",
    alignSelf: "center",
    marginVertical: 10,
  },
  face: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  faceDark: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
    borderWidth: 1,
  },
  back: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  backDark: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
    borderWidth: 1,
  },
  headerBar: {
    height: 8,
    backgroundColor: "#4A90E2",
    width: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backContentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  collocationText: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#1a1a1a",
    lineHeight: 40,
  },
  textDark: {
    color: "#FFFFFF",
  },
  textSecondaryDark: {
    color: "#AAAAAA",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 18,
    color: "#333",
    lineHeight: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    gap: 8,
    opacity: 0.6,
  },
  flipInstruction: {
    fontSize: 14,
    color: "#666",
  },
});
