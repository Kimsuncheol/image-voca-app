import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect } from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";

interface SpeakerButtonProps {
  text: string;
  isDark: boolean;
}

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({
  text,
  isDark,
}) => {
  const { speak, stop, pause, resume, isSpeaking, isPaused } = useSpeech();

  const handleSpeech = useCallback(async () => {
    if (isPaused) {
      // Resume paused speech
      await resume();
    } else if (isSpeaking) {
      // Pause on iOS, stop on Android
      if (Platform.OS === "android") {
        await stop();
      } else {
        await pause();
      }
    } else {
      // Start speaking
      await speak(text, {
        language: "en-US",
        rate: 0.9,
      });
    }
  }, [text, isPaused, isSpeaking, speak, stop, pause, resume]);

  // Cleanup: stop speech when component unmounts
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <TouchableOpacity onPress={handleSpeech} style={styles.speakerButton}>
      <Ionicons
        name={isSpeaking ? "pause" : isPaused ? "play" : "volume-medium"}
        size={20}
        color={isDark ? "#ccc" : "#999"}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  speakerButton: {
    padding: 4,
    marginTop: -2, // Align with text
  },
});
