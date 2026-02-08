import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { PopQuizType } from "../../components/settings/PopQuizTypeModal";

const POP_QUIZ_TYPE_KEY = "@pop_quiz_type";
const DEFAULT_QUIZ_TYPE: PopQuizType = "multiple-choice";

const VALID_QUIZ_TYPES: PopQuizType[] = [
  "multiple-choice",
  "fill-in-blank",
  "word-arrangement",
  "matching",
];

interface PopQuizPreferencesState {
  quizType: PopQuizType;
  isLoaded: boolean;
  setQuizType: (type: PopQuizType) => Promise<void>;
  loadQuizType: () => Promise<void>;
}

export const usePopQuizPreferencesStore = create<PopQuizPreferencesState>(
  (set, get) => ({
    quizType: DEFAULT_QUIZ_TYPE,
    isLoaded: false,

    loadQuizType: async () => {
      // Check if already loaded to prevent duplicate loads
      if (get().isLoaded) return;

      try {
        const value = await AsyncStorage.getItem(POP_QUIZ_TYPE_KEY);
        if (value !== null) {
          // Validate the value is a valid PopQuizType
          const isValid = VALID_QUIZ_TYPES.includes(value as PopQuizType);
          const quizType = isValid
            ? (value as PopQuizType)
            : DEFAULT_QUIZ_TYPE;
          set({ quizType, isLoaded: true });
          console.log(
            `[PopQuizPreferencesStore] Loaded quiz type: ${quizType}`,
          );
        } else {
          // No saved preference, use default
          set({ isLoaded: true });
          console.log(
            `[PopQuizPreferencesStore] No saved preference, using default: ${DEFAULT_QUIZ_TYPE}`,
          );
        }
      } catch (error) {
        console.error(
          "[PopQuizPreferencesStore] Failed to load quiz type:",
          error,
        );
        // Mark as loaded even on error to prevent retry loops
        set({ isLoaded: true });
      }
    },

    setQuizType: async (type: PopQuizType) => {
      // Optimistic update - update state immediately for instant UI feedback
      set({ quizType: type, isLoaded: true });
      console.log(`[PopQuizPreferencesStore] Setting quiz type to: ${type}`);

      // Persist to AsyncStorage asynchronously
      try {
        await AsyncStorage.setItem(POP_QUIZ_TYPE_KEY, type);
        console.log(
          `[PopQuizPreferencesStore] Saved quiz type to AsyncStorage: ${type}`,
        );
      } catch (error) {
        console.error(
          "[PopQuizPreferencesStore] Failed to save quiz type:",
          error,
        );
        // Don't revert state - prefer showing current selection even if save failed
      }
    },
  }),
);
