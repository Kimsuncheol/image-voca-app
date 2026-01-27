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
import Collapsible from "react-native-collapsible";
import { RoleplayRenderer } from "./RoleplayRenderer";

interface ExampleSectionProps {
  example: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
}

export default React.memo(function ExampleSection({
  example,
  isOpen,
  onToggle,
  isDark,
}: ExampleSectionProps) {
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);

  const handleSpeech = React.useCallback(async () => {
    if (isPaused) {
      await Speech.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    } else if (isSpeaking) {
      if (Platform.OS === "android") {
        await Speech.stop();
        setIsSpeaking(false);
        setIsPaused(false);
      } else {
        await Speech.pause();
        setIsPaused(true);
        setIsSpeaking(false);
      }
    } else {
      Speech.speak(example, {
        onStart: () => {
          setIsSpeaking(true);
          setIsPaused(false);
        },
        onDone: () => {
          setIsSpeaking(false);
          setIsPaused(false);
        },
        onStopped: () => {
          setIsSpeaking(false);
          setIsPaused(false);
        },
        onError: () => {
          setIsSpeaking(false);
          setIsPaused(false);
        },
      });
    }
  }, [example, isPaused, isSpeaking]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return (
    <View>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>EXAMPLE</Text>
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward"}
          size={16}
          color="#999"
        />
      </TouchableOpacity>

      <Collapsible collapsed={!isOpen}>
        <View style={styles.sectionContent}>
          {example ? (
            <View style={styles.exampleRow}>
              <View style={{ flex: 1, marginRight: 8, gap: 8 }}>
                <RoleplayRenderer content={example} isDark={isDark} />
              </View>
              <TouchableOpacity
                onPress={handleSpeech}
                style={styles.speakerButton}
              >
                <Ionicons
                  name={
                    isSpeaking ? "pause" : isPaused ? "play" : "volume-medium"
                  }
                  size={20}
                  color={isDark ? "#ccc" : "#999"}
                />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Collapsible>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 1.2,
  },
  sectionContent: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  exampleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  speakerButton: {
    padding: 4,
    marginTop: -2, // Align with text
  },
});
