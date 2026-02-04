/**
 * useSpeech Hook
 *
 * Custom hook for Text-to-Speech functionality
 * Provides a clean interface for components to use TTS
 */

import { useCallback, useState } from "react";
import {
  speak,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  SpeechOptions,
} from "../services/speechService";

export interface UseSpeechReturn {
  /** Function to speak the given text */
  speak: (text: string, options?: SpeechOptions) => Promise<void>;
  /** Function to stop current speech */
  stop: () => Promise<void>;
  /** Function to pause current speech (iOS only) */
  pause: () => Promise<void>;
  /** Function to resume paused speech (iOS only) */
  resume: () => Promise<void>;
  /** Whether speech is currently playing */
  isSpeaking: boolean;
  /** Whether speech is paused (iOS only) */
  isPaused: boolean;
  /** Whether there was an error */
  error: Error | null;
}

/**
 * Custom hook for Text-to-Speech
 *
 * @example
 * ```typescript
 * const { speak, stop, isSpeaking } = useSpeech();
 *
 * // Speak with default settings
 * await speak("Hello world");
 *
 * // Speak with custom options
 * await speak("Hello world", {
 *   language: "en-US",
 *   rate: 1.2,
 *   pitch: 1.1,
 * });
 *
 * // Stop speaking
 * await stop();
 * ```
 */
export const useSpeech = (): UseSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const speakText = useCallback(
    async (text: string, options?: SpeechOptions) => {
      try {
        setError(null);
        setIsSpeaking(true);
        setIsPaused(false);

        await speak(text, {
          ...options,
          onStart: () => {
            setIsSpeaking(true);
            setIsPaused(false);
            options?.onStart?.();
          },
          onDone: () => {
            setIsSpeaking(false);
            setIsPaused(false);
            options?.onDone?.();
          },
          onError: (err) => {
            setError(err);
            setIsSpeaking(false);
            setIsPaused(false);
            options?.onError?.(err);
          },
        });
      } catch (err) {
        setError(err as Error);
        setIsSpeaking(false);
        setIsPaused(false);
      }
    },
    []
  );

  const stop = useCallback(async () => {
    try {
      await stopSpeech();
      setIsSpeaking(false);
      setIsPaused(false);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await pauseSpeech();
      setIsSpeaking(false);
      setIsPaused(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      await resumeSpeech();
      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  return {
    speak: speakText,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    error,
  };
};

export default useSpeech;
