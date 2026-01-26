import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CollocationData } from "./types";

interface FaceSideProps {
  data: CollocationData;
  isDark: boolean;
}

export default function FaceSide({ data, isDark }: FaceSideProps) {
  const speak = () => {
    Speech.speak(data.collocation);
  };

  return (
    <View style={[styles.face, isDark && styles.faceDark]}>
      {/* Accent Brand Mark */}
      <View style={styles.accentMark} />

      <View style={styles.contentContainer}>
        <Text style={[styles.collocationText, isDark && styles.textDark]}>
          {data.collocation}
        </Text>

        <View style={styles.meaningContainer}>
          <Text style={[styles.meaningText, isDark && styles.textDark]}>
            {data.meaning}
          </Text>
          <TouchableOpacity onPress={speak} style={styles.speakerButton}>
            <Ionicons
              name="volume-medium"
              size={24}
              color={isDark ? "#ccc" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  accentMark: {
    position: "absolute",
    top: 32,
    right: 32,
    width: 6,
    height: 24,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    transform: [{ rotate: "15deg" }],
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  meaningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    width: "100%",
  },
  speakerButton: {
    marginLeft: 8,
    padding: 4,
  },
  collocationText: {
    fontSize: 42,
    fontWeight: "700",
    textAlign: "center",
    color: "#111",
    lineHeight: 52,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -0.5,
  },
  meaningText: {
    fontSize: 22,
    fontWeight: "400",
    textAlign: "center",
    color: "#666",
    lineHeight: 30,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  textDark: {
    color: "#FFFFFF",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 0,
  },
});
