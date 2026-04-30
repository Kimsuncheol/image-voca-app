import { useFocusEffect } from "@react-navigation/native";
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
import * as NavigationBar from "expo-navigation-bar";
import type {
  NavigationBarBehavior,
  NavigationBarVisibility,
} from "expo-navigation-bar";
import React from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { VolumeManager } from "react-native-volume-manager";
import type { SpeechOptions } from "../services/speechService";
import { useSpeech } from "./useSpeech";

export type StudyLanguageType = "EN" | "JP";

export interface StudyModeReturn {
  handleSpeech: (
    text: string,
    languageType: StudyLanguageType,
    options?: SpeechOptions,
  ) => Promise<void>;
  lowVolumeHint: string | null;
  clearLowVolumeHint: () => void;
}

interface StudyModeProviderProps {
  keepAwakeTag: string;
  children: React.ReactNode;
}

const IMMERSIVE_NAVIGATION_BAR_BEHAVIOR: NavigationBarBehavior =
  "overlay-swipe";
const DEFAULT_NAVIGATION_BAR_BEHAVIOR: NavigationBarBehavior = "inset-touch";
const HIDDEN_NAVIGATION_BAR_VISIBILITY: NavigationBarVisibility = "hidden";
const VISIBLE_NAVIGATION_BAR_VISIBILITY: NavigationBarVisibility = "visible";
const LOW_VOLUME_THRESHOLD = 0.15;
const LOW_VOLUME_HINT_DURATION_MS = 2500;

const StudySpeechContext = React.createContext<StudyModeReturn | null>(null);

const getSpeechLanguageCode = (languageType: StudyLanguageType) =>
  languageType === "JP" ? "ja-JP" : "en-US";

export const getStudyLanguageTypeFromSpeechLanguage = (
  language?: string,
): StudyLanguageType =>
  language?.trim().toLowerCase().startsWith("ja") ? "JP" : "EN";

const getCurrentVolume = async () => {
  try {
    const result = await VolumeManager.getVolume();
    return typeof result.volume === "number" ? result.volume : 1;
  } catch (error) {
    console.warn("Failed to read device volume:", error);
    return 1;
  }
};

function useSmartStudySpeech(): StudyModeReturn {
  const { speak } = useSpeech();
  const [lowVolumeHint, setLowVolumeHint] = React.useState<string | null>(null);
  const lowVolumeHintTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const clearLowVolumeHint = React.useCallback(() => {
    if (lowVolumeHintTimeoutRef.current) {
      clearTimeout(lowVolumeHintTimeoutRef.current);
      lowVolumeHintTimeoutRef.current = null;
    }
    setLowVolumeHint(null);
  }, []);

  React.useEffect(() => clearLowVolumeHint, [clearLowVolumeHint]);

  const showLowVolumeFeedback = React.useCallback((volume: number) => {
    const message = `Device volume is low (${Math.round(
      volume * 100,
    )}%). You may not hear the audio clearly.`;

    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
      return;
    }

    setLowVolumeHint(message);
    if (lowVolumeHintTimeoutRef.current) {
      clearTimeout(lowVolumeHintTimeoutRef.current);
    }
    lowVolumeHintTimeoutRef.current = setTimeout(() => {
      setLowVolumeHint(null);
      lowVolumeHintTimeoutRef.current = null;
    }, LOW_VOLUME_HINT_DURATION_MS);
  }, []);

  const handleSpeech = React.useCallback(
    async (
      text: string,
      languageType: StudyLanguageType,
      options?: SpeechOptions,
    ) => {
      const speechText = text.trim();
      if (!speechText) {
        return;
      }

      const volume = await getCurrentVolume();
      if (volume === 0) {
        Alert.alert(
          "Volume is Muted",
          "Your device volume is set to 0. Please increase the volume to hear the audio.",
        );
        return;
      }

      if (volume < LOW_VOLUME_THRESHOLD) {
        showLowVolumeFeedback(volume);
      }

      await speak(speechText, {
        ...options,
        language: getSpeechLanguageCode(languageType),
      });
    },
    [showLowVolumeFeedback, speak],
  );

  return React.useMemo(
    () => ({
      handleSpeech,
      lowVolumeHint,
      clearLowVolumeHint,
    }),
    [clearLowVolumeHint, handleSpeech, lowVolumeHint],
  );
}

export function useStudyMode(keepAwakeTag: string): StudyModeReturn {
  const speech = useSmartStudySpeech();

  useFocusEffect(
    React.useCallback(() => {
      void activateKeepAwakeAsync(keepAwakeTag).catch((error) => {
        console.warn("Failed to activate keep awake mode:", error);
      });

      if (Platform.OS === "android") {
        void NavigationBar.setBehaviorAsync(IMMERSIVE_NAVIGATION_BAR_BEHAVIOR)
          .then(() =>
            NavigationBar.setVisibilityAsync(HIDDEN_NAVIGATION_BAR_VISIBILITY),
          )
          .catch((error) => {
            console.warn("Failed to enable immersive study mode:", error);
          });
      }

      return () => {
        void deactivateKeepAwake(keepAwakeTag).catch((error) => {
          console.warn("Failed to deactivate keep awake mode:", error);
        });

        if (Platform.OS === "android") {
          void NavigationBar.setVisibilityAsync(
            VISIBLE_NAVIGATION_BAR_VISIBILITY,
          )
            .then(() =>
              NavigationBar.setBehaviorAsync(DEFAULT_NAVIGATION_BAR_BEHAVIOR),
            )
            .catch((error) => {
              console.warn("Failed to restore navigation bar:", error);
            });
        }
      };
    }, [keepAwakeTag]),
  );

  return speech;
}

export function StudyModeProvider({
  keepAwakeTag,
  children,
}: StudyModeProviderProps) {
  const studyMode = useStudyMode(keepAwakeTag);

  return (
    <StudySpeechContext.Provider value={studyMode}>
      {children}
      {studyMode.lowVolumeHint ? (
        <View pointerEvents="none" style={styles.lowVolumeHintContainer}>
          <Text style={styles.lowVolumeHintText}>
            {studyMode.lowVolumeHint}
          </Text>
        </View>
      ) : null}
    </StudySpeechContext.Provider>
  );
}

export function useStudySpeech(): StudyModeReturn {
  const context = React.useContext(StudySpeechContext);
  const fallback = useSmartStudySpeech();
  return context ?? fallback;
}

const styles = StyleSheet.create({
  lowVolumeHintContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    alignItems: "center",
  },
  lowVolumeHintText: {
    maxWidth: 360,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "rgba(20, 20, 20, 0.86)",
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "center",
  },
});
