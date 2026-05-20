import React from "react";
import type { QuizWordOption } from "../../src/course/quizUtils";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInput as TextInputType,
} from "react-native";
import { FillInTheBlankGameClozeSentenceCard } from "./FillInTheBlankGameClozeSentenceCard";
import { useTranslation } from "react-i18next";
import { getLearningLanguageForCourse } from "../../src/types/vocabulary";
import { isFillInBlankAnswerCorrect } from "../../src/utils/fillInBlankAnswer";
import { AppToast } from "../common/AppToast";
import {
  doesKeyboardLanguageMatch,
  getCurrentKeyboardLanguage,
  preferKeyboardLanguage,
} from "../../src/native/keyboardLanguage";

interface FillInTheBlankGameProps {
  word: string;
  courseId?: string;
  clozeSentence: string;
  translation?: string;
  localizedPronunciation?: string;
  options: (QuizWordOption | string)[];
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswer: (answer: string) => void;
  correctForms?: string[];
  showPronunciationDetails?: boolean;
}

export function FillInTheBlankGame({
  courseId,
  clozeSentence,
  translation,
  localizedPronunciation,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswer,
  correctForms,
}: FillInTheBlankGameProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<TextInputType>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const keyboardRefocusTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const manualKeyboardReopenTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const canRefocusKeyboardRef = React.useRef(!showResult);
  const isInputMountedRef = React.useRef(true);
  const suppressedKeyboardHideCountRef = React.useRef(0);
  const questionKeyRef = React.useRef(`${clozeSentence}\u0000${correctAnswer}`);
  const lastToastAtRef = React.useRef(0);
  const targetLanguage = getLearningLanguageForCourse(courseId) ?? "en";
  const [draftAnswer, setDraftAnswer] = React.useState("");
  const [isInputMounted, setIsInputMounted] = React.useState(true);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const submittedAnswer = userAnswer || draftAnswer;
  const isCorrect = isFillInBlankAnswerCorrect({
    answer: userAnswer,
    correctAnswer,
    correctForms,
    language: targetLanguage,
  });

  const focusInput = React.useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const clearKeyboardRefocusTimeout = React.useCallback(() => {
    if (keyboardRefocusTimeoutRef.current) {
      clearTimeout(keyboardRefocusTimeoutRef.current);
      keyboardRefocusTimeoutRef.current = null;
    }
  }, []);

  const clearManualKeyboardReopenTimeout = React.useCallback(() => {
    if (manualKeyboardReopenTimeoutRef.current) {
      clearTimeout(manualKeyboardReopenTimeoutRef.current);
      manualKeyboardReopenTimeoutRef.current = null;
    }
  }, []);

  const showKeyboardLanguageToast = React.useCallback(() => {
    const now = Date.now();
    if (now - lastToastAtRef.current < 2500) return;
    lastToastAtRef.current = now;
    setToastMessage(
      t("quiz.types.fillInBlank.keyboardLanguageMismatch", {
        language:
          targetLanguage === "ja"
            ? t("settings.language.japanese", { defaultValue: "Japanese" })
            : t("settings.language.english", { defaultValue: "English" }),
        defaultValue: `Switch to the ${targetLanguage === "ja" ? "Japanese" : "English"} keyboard to answer this quiz.`,
      }),
    );
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2500);
  }, [t, targetLanguage]);

  const checkKeyboardLanguage = React.useCallback(async () => {
    const currentLanguage = await getCurrentKeyboardLanguage();
    if (
      currentLanguage &&
      !doesKeyboardLanguageMatch(currentLanguage, targetLanguage)
    ) {
      showKeyboardLanguageToast();
    }
  }, [showKeyboardLanguageToast, targetLanguage]);

  const reopenKeyboardFromExamplePress = React.useCallback(() => {
    if (showResult) return;

    clearKeyboardRefocusTimeout();
    clearManualKeyboardReopenTimeout();
    isInputMountedRef.current = true;
    setIsInputMounted(true);
    canRefocusKeyboardRef.current = true;
    inputRef.current?.blur();

    manualKeyboardReopenTimeoutRef.current = setTimeout(() => {
      manualKeyboardReopenTimeoutRef.current = null;
      focusInput();
      void preferKeyboardLanguage(targetLanguage);
      void checkKeyboardLanguage();
    }, 40);
  }, [
    checkKeyboardLanguage,
    clearKeyboardRefocusTimeout,
    clearManualKeyboardReopenTimeout,
    focusInput,
    showResult,
    targetLanguage,
  ]);

  React.useEffect(() => {
    const nextQuestionKey = `${clozeSentence}\u0000${correctAnswer}`;
    if (questionKeyRef.current !== nextQuestionKey) {
      questionKeyRef.current = nextQuestionKey;
      suppressedKeyboardHideCountRef.current = 0;
      isInputMountedRef.current = true;
      setIsInputMounted(true);
    }
    setDraftAnswer("");
  }, [clozeSentence, correctAnswer]);

  React.useEffect(() => {
    isInputMountedRef.current = isInputMounted;
    canRefocusKeyboardRef.current = !showResult && isInputMounted;
    if (showResult) {
      clearKeyboardRefocusTimeout();
      clearManualKeyboardReopenTimeout();
    }
  }, [
    clearKeyboardRefocusTimeout,
    clearManualKeyboardReopenTimeout,
    isInputMounted,
    showResult,
  ]);

  React.useEffect(() => {
    clearKeyboardRefocusTimeout();
  }, [clearKeyboardRefocusTimeout, clozeSentence, correctAnswer]);

  React.useEffect(() => {
    if (showResult || !isInputMounted) return;
    const focusTimeout = setTimeout(() => {
      if (!isInputMountedRef.current) return;
      focusInput();
      void preferKeyboardLanguage(targetLanguage);
      void checkKeyboardLanguage();
    }, 80);

    return () => clearTimeout(focusTimeout);
  }, [
    checkKeyboardLanguage,
    clozeSentence,
    correctAnswer,
    focusInput,
    isInputMounted,
    showResult,
    targetLanguage,
  ]);

  React.useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      clearKeyboardRefocusTimeout();
      if (suppressedKeyboardHideCountRef.current > 0) {
        suppressedKeyboardHideCountRef.current -= 1;
        return;
      }
      if (!isInputMountedRef.current) return;
      if (!canRefocusKeyboardRef.current) return;

      keyboardRefocusTimeoutRef.current = setTimeout(() => {
        keyboardRefocusTimeoutRef.current = null;
        if (!isInputMountedRef.current) return;
        if (!canRefocusKeyboardRef.current) return;
        focusInput();
        void preferKeyboardLanguage(targetLanguage);
        void checkKeyboardLanguage();
      }, 120);
    });

    return () => {
      subscription.remove();
      clearKeyboardRefocusTimeout();
    };
  }, [
    checkKeyboardLanguage,
    clearKeyboardRefocusTimeout,
    focusInput,
    targetLanguage,
  ]);

  React.useEffect(
    () => () => {
      canRefocusKeyboardRef.current = false;
      clearKeyboardRefocusTimeout();
      clearManualKeyboardReopenTimeout();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    },
    [clearKeyboardRefocusTimeout, clearManualKeyboardReopenTimeout],
  );

  const handleSubmit = React.useCallback(() => {
    const trimmedAnswer = draftAnswer.trim();
    if (!trimmedAnswer || showResult) return;
    canRefocusKeyboardRef.current = false;
    suppressedKeyboardHideCountRef.current += 1;
    clearKeyboardRefocusTimeout();
    clearManualKeyboardReopenTimeout();
    onAnswer(trimmedAnswer);
    Keyboard.dismiss();
  }, [
    clearKeyboardRefocusTimeout,
    clearManualKeyboardReopenTimeout,
    draftAnswer,
    onAnswer,
    showResult,
  ]);

  const dismissKeyboardFromOutsidePress = React.useCallback(() => {
    if (showResult) return;

    clearKeyboardRefocusTimeout();
    clearManualKeyboardReopenTimeout();
    canRefocusKeyboardRef.current = false;
    suppressedKeyboardHideCountRef.current += 1;
    inputRef.current?.blur();
    Keyboard.dismiss();
    isInputMountedRef.current = false;
    setIsInputMounted(false);
  }, [
    clearKeyboardRefocusTimeout,
    clearManualKeyboardReopenTimeout,
    showResult,
  ]);

  return (
    <Pressable
      testID="fill-in-blank-dismiss-area"
      accessible={false}
      style={styles.container}
      onPress={dismissKeyboardFromOutsidePress}
    >
      <AppToast
        message={toastMessage}
        floating
        onClose={() => setToastMessage(null)}
      />
      <FillInTheBlankGameClozeSentenceCard
        clozeSentence={clozeSentence}
        translation={translation}
        localizedPronunciation={localizedPronunciation}
        userAnswer={submittedAnswer}
        showResult={showResult}
        isCorrect={isCorrect}
        correctForms={correctForms}
        onCardPress={reopenKeyboardFromExamplePress}
        onBlankPress={reopenKeyboardFromExamplePress}
      />

      {isInputMounted && (
        <TextInput
          ref={inputRef}
          testID="fill-in-blank-input"
          value={draftAnswer}
          onChangeText={(nextAnswer) => {
            if (showResult) return;
            setDraftAnswer(nextAnswer);
            void checkKeyboardLanguage();
          }}
          onFocus={() => {
            void preferKeyboardLanguage(targetLanguage);
            void checkKeyboardLanguage();
          }}
          onSubmitEditing={handleSubmit}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          editable
          submitBehavior="submit"
          blurOnSubmit={false}
          enterKeyHint="done"
          returnKeyType="done"
          inputMode="text"
          keyboardType="default"
          style={styles.hiddenInput}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    flex: 1,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
