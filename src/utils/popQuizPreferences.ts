import AsyncStorage from "@react-native-async-storage/async-storage";
import { PopQuizType } from "../../components/settings/PopQuizTypeModal";

const POP_QUIZ_TYPE_KEY = "@pop_quiz_type";

/**
 * Get the saved pop quiz type preference
 * @returns The saved pop quiz type, or "multiple-choice" as default
 */
export async function getPopQuizTypePreference(): Promise<PopQuizType> {
  try {
    const value = await AsyncStorage.getItem(POP_QUIZ_TYPE_KEY);
    if (value !== null) {
      return value as PopQuizType;
    }
    return "multiple-choice"; // default
  } catch (error) {
    console.warn("Error reading pop quiz type preference:", error);
    return "multiple-choice";
  }
}

/**
 * Save the pop quiz type preference
 * @param type The pop quiz type to save
 */
export async function setPopQuizTypePreference(
  type: PopQuizType,
): Promise<void> {
  try {
    await AsyncStorage.setItem(POP_QUIZ_TYPE_KEY, type);
  } catch (error) {
    console.error("Error saving pop quiz type preference:", error);
  }
}
