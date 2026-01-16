import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../../components/themed-text";
import { useTheme } from "../../../src/context/ThemeContext";
import { useSpeakingTutorStore } from "../../../src/stores/speakingTutorStore";

export default function TOEICPracticeScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { parts } = useLocalSearchParams<{ parts: string }>();

  const {
    currentSession,
    isLoading,
    isAnalyzing,
    isRecording,
    timerMode,
    timerSeconds,
    startTOEICSession,
    getCurrentQuestion,
    getProgress,
    setRecording,
    submitRecording,
    startPrepTimer,
    startResponseTimer,
    tickTimer,
    nextQuestion,
    completeSession,
  } = useSpeakingTutorStore();

  const [recording, setRecordingState] = useState<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start session on mount
  useEffect(() => {
    const selectedParts = parts?.split(",").map(Number) || [1];
    startTOEICSession(selectedParts);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [parts]);

  // Timer effect
  useEffect(() => {
    if (timerMode !== "idle" && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerMode, timerSeconds > 0]);

  // Handle timer completion
  useEffect(() => {
    if (timerSeconds === 0 && timerMode === "prep") {
      // Prep time ended, start response timer and recording
      handleStartRecording();
    } else if (timerSeconds === 0 && timerMode === "response" && isRecording) {
      // Response time ended, stop recording
      handleStopRecording();
    }
  }, [timerSeconds, timerMode]);

  const handleStartRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("speaking.errors.permissionTitle"),
          t("speaking.errors.permissionMessage")
        );
        return;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecordingState(recording);
      setRecording(true);
      startResponseTimer();
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert(t("speaking.errors.recordingFailed"));
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingState(null);
      setRecording(false);

      if (uri) {
        await submitRecording(uri);

        // Move to next question or complete
        const progress = getProgress();
        if (progress.current >= progress.total) {
          completeSession();
          router.replace("/speaking/toeic/results");
        } else {
          nextQuestion();
        }
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setRecording(false);
    }
  };

  const handleBeginQuestion = () => {
    startPrepTimer();
  };

  const handleSkipPrep = () => {
    handleStartRecording();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  if (isLoading || !currentSession || !currentQuestion) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
        edges={["bottom"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <ThemedText style={styles.loadingText}>
            {t("speaking.toeic.generating")}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["bottom"]}
    >
      {/* Progress */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: isDark ? "#333" : "#e0e0e0" },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${(progress.current / progress.total) * 100}%` },
            ]}
          />
        </View>
        <ThemedText style={styles.progressText}>
          {progress.current} / {progress.total}
        </ThemedText>
      </View>

      {/* Part Badge */}
      <View style={styles.partBadgeContainer}>
        <View style={styles.partBadge}>
          <ThemedText style={styles.partBadgeText}>
            Part {currentQuestion.part}
          </ThemedText>
        </View>
      </View>

      {/* Question Prompt */}
      <View
        style={[
          styles.promptCard,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <ThemedText style={styles.promptText}>
          {currentQuestion.prompt}
        </ThemedText>
      </View>

      {/* Timer Display */}
      {timerMode !== "idle" && (
        <View style={styles.timerContainer}>
          <View
            style={[
              styles.timerCircle,
              {
                borderColor:
                  timerMode === "prep"
                    ? "#ffc107"
                    : timerSeconds > 10
                    ? "#4ECDC4"
                    : "#dc3545",
              },
            ]}
          >
            <ThemedText style={styles.timerText}>
              {formatTime(timerSeconds)}
            </ThemedText>
            <ThemedText style={styles.timerLabel}>
              {timerMode === "prep"
                ? t("speaking.timer.prep")
                : t("speaking.timer.response")}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <ThemedText style={styles.recordingText}>
            {t("speaking.recording")}
          </ThemedText>
        </View>
      )}

      {/* Analyzing Indicator */}
      {isAnalyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="small" color="#4ECDC4" />
          <ThemedText style={styles.analyzingText}>
            {t("speaking.analyzing")}
          </ThemedText>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {timerMode === "idle" && !isRecording && !isAnalyzing && (
          <TouchableOpacity
            style={[styles.actionButton, styles.beginButton]}
            onPress={handleBeginQuestion}
          >
            <Ionicons name="play" size={24} color="#fff" />
            <ThemedText style={styles.actionButtonText}>
              {t("speaking.toeic.beginQuestion")}
            </ThemedText>
          </TouchableOpacity>
        )}

        {timerMode === "prep" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={handleSkipPrep}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <ThemedText style={styles.actionButtonText}>
              {t("speaking.toeic.skipPrep")}
            </ThemedText>
          </TouchableOpacity>
        )}

        {isRecording && (
          <TouchableOpacity
            style={[styles.actionButton, styles.stopButton]}
            onPress={handleStopRecording}
          >
            <Ionicons name="stop" size={24} color="#fff" />
            <ThemedText style={styles.actionButtonText}>
              {t("speaking.stopRecording")}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  progressContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4ECDC4",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "right",
  },
  partBadgeContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  partBadge: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  partBadgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  promptCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    minHeight: 150,
    justifyContent: "center",
  },
  promptText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
  },
  timerContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 32,
    fontWeight: "700",
  },
  timerLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#dc3545",
  },
  recordingText: {
    color: "#dc3545",
    fontWeight: "600",
  },
  analyzingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  analyzingText: {
    opacity: 0.7,
  },
  actionsContainer: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    paddingBottom: 34,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  beginButton: {
    backgroundColor: "#4ECDC4",
  },
  skipButton: {
    backgroundColor: "#ffc107",
  },
  stopButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
