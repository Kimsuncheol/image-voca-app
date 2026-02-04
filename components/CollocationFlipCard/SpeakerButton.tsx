import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";
import { useSoundMode } from "../../src/hooks/useSoundMode";

interface SpeakerButtonProps {
  text: string;
  isDark: boolean;
}

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({
  text,
  isDark,
}) => {
  const { speak, stop, pause, resume, isSpeaking, isPaused } = useSpeech();
  const {
    mode,
    isMuted,
    isVibrate,
    volume,
    volumeLevel,
    isVolumeMuted,
    isVolumeLow,
  } = useSoundMode();

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
      // Check volume level before speaking
      if (isVolumeMuted) {
        // Show alert when volume is at 0
        Alert.alert(
          "Volume is Muted",
          "Your device volume is set to 0. Please increase the volume to hear the audio.",
          [
            {
              text: "OK",
              style: "default",
            },
          ]
        );
        return; // Don't play audio
      }

      // Check iOS silent switch
      if (isMuted && Platform.OS === "ios") {
        // Show alert when silent switch is on
        Alert.alert(
          "Silent Mode is On",
          "Your device is in silent mode. Please turn off the silent switch to hear the audio.",
          [
            {
              text: "Play Anyway",
              onPress: async () => {
                // User wants to play anyway (they might adjust volume during playback)
                await speak(text, {
                  language: "en-US",
                  rate: 0.9,
                });
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
        return;
      }

      // Warn about low volume but allow playback
      if (isVolumeLow) {
        Alert.alert(
          "Low Volume",
          `Volume is low (${Math.round(volume * 100)}%). You may not hear the audio clearly.`,
          [
            {
              text: "Play Anyway",
              onPress: async () => {
                await speak(text, {
                  language: "en-US",
                  rate: 0.9,
                });
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
        return;
      }

      // Start speaking (normal volume)
      await speak(text, {
        language: "en-US",
        rate: 0.9,
      });
    }
  }, [
    text,
    isPaused,
    isSpeaking,
    isVolumeMuted,
    isMuted,
    isVolumeLow,
    volume,
    speak,
    stop,
    pause,
    resume,
  ]);

  // Cleanup: stop speech when component unmounts
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Determine icon based on speaking state, sound mode, and volume level
  const getIconName = () => {
    if (isSpeaking) return "pause";
    if (isPaused) return "play";

    // Show appropriate icon based on sound mode and volume
    if (isMuted) return "volume-mute"; // iOS silent switch
    if (isVibrate) return "phone-portrait"; // Android vibrate mode
    if (isVolumeMuted) return "volume-mute"; // Volume at 0

    // Volume-based icons
    switch (volumeLevel) {
      case "muted":
        return "volume-mute";
      case "low":
        return "volume-low";
      case "medium":
        return "volume-medium";
      case "high":
        return "volume-high";
      default:
        return "volume-medium";
    }
  };

  // Determine icon color (warn user if muted/vibrate/low volume)
  const getIconColor = () => {
    // Red warning for completely muted
    if (isVolumeMuted || isMuted) {
      return "#FF3B30"; // Red
    }

    // Orange warning for vibrate or low volume
    if (isVibrate || isVolumeLow) {
      return "#FF9500"; // Orange
    }

    // Normal colors
    return isDark ? "#ccc" : "#999";
  };

  // Determine if warning badge should be shown
  const showWarning = isMuted || isVibrate || isVolumeMuted || isVolumeLow;
  const isHighSeverity = isMuted || isVolumeMuted; // Red for complete silence
  const warningBadgeColor = isHighSeverity ? "#FF3B30" : "#FF9500";

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleSpeech} style={styles.speakerButton}>
        <Ionicons name={getIconName()} size={20} color={getIconColor()} />
      </TouchableOpacity>
      {/* Warning badge when device is muted, vibrate, or volume is low */}
      {showWarning && (
        <View
          style={[styles.warningBadge, { backgroundColor: warningBadgeColor }]}
        >
          <Ionicons name="warning" size={10} color="#fff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  speakerButton: {
    padding: 4,
    marginTop: -2, // Align with text
  },
  warningBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    // backgroundColor set dynamically via inline style
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});
