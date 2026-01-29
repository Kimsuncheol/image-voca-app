import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

interface SpeakerButtonProps {
  text: string;
  isDark: boolean;
}

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({
  text,
  isDark,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleSpeech = useCallback(async () => {
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
      Speech.speak(text, {
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
  }, [text, isPaused, isSpeaking]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

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
