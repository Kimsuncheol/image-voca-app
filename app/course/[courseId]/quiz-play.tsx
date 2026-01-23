import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FillInTheBlankGame,
  MatchingGame,
  MultipleChoiceGame,
  QuizFeedback,
  SpellingGame,
  WordArrangementGame,
} from "../../../components/course";
import { ThemedText } from "../../../components/themed-text";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useTimeTracking } from "../../../src/hooks/useTimeTracking";
import { db } from "../../../src/services/firebase";
import { useUserStatsStore } from "../../../src/stores";
import { COURSES, CourseType } from "../../../src/types/vocabulary";

import nlp from "compromise";

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  options?: string[];
  correctAnswer: string;
  clozeSentence?: string;
  translation?: string;
  correctForms?: string[];
}

interface VocabData {
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
  translation?: string;
}

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Helper to get Firestore path for a course
const getCourseConfig = (courseId: CourseType) => {
  switch (courseId) {
    case "수능":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_CSAT,
        prefix: "CSAT",
      };
    case "TOEIC":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC,
        prefix: "TOEIC",
      };
    case "TOEFL":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL,
        prefix: "TOEFL",
      };
    case "TOEIC_SPEAKING":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING,
        prefix: "TOEIC_SPEAKING",
      };
    case "IELTS":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_IELTS,
        prefix: "IELTS",
      };
    case "OPIC":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_OPIC,
        prefix: "OPIc",
      };
    default:
      return { path: "", prefix: "" };
  }
};

// Generate quiz questions from real vocabulary data
const generateQuizQuestions = (
  vocabData: VocabData[],
  quizType: string,
  targetScore: number = 10,
): QuizQuestion[] => {
  // Shuffle and take random questions (up to targetScore)
  const selectedWords = shuffleArray([...vocabData]).slice(
    0,
    Math.min(targetScore, vocabData.length),
  );

  return selectedWords.map((vocab, index) => {
    const isWordAnswer =
      quizType === "fill-in-blank" || quizType === "spelling";

    // Generate options for multiple choice
    let options: string[] | undefined;
    if (quizType === "multiple-choice") {
      // Get 3 random wrong answers
      const otherMeanings = vocabData
        .filter((v) => v.word !== vocab.word)
        .map((v) => v.meaning);
      const shuffledOthers = shuffleArray(otherMeanings);
      const wrongAnswers = shuffledOthers.slice(0, 3);

      // Combine and shuffle
      options = shuffleArray([vocab.meaning, ...wrongAnswers]);
    }

    // Generate cloze sentence and options for fill-in-blank
    let clozeSentence: string | undefined;
    let translation: string | undefined;
    let correctForms: string[] | undefined;

    if (quizType === "fill-in-blank" && vocab.example) {
      // Use compromise to match the word smarty (handles tenses, plurals, lemmas)
      const doc = nlp(vocab.example);

      // Generate variations of the target word to check against
      const targetWord = vocab.word;
      const variations = new Set([targetWord, targetWord.toLowerCase()]);

      try {
        // Add verb variations
        variations.add(nlp(targetWord).verbs().toPastTense().out());
        variations.add(nlp(targetWord).verbs().toPresentTense().out());
        variations.add(nlp(targetWord).verbs().toGerund().out());

        // Add noun variations
        variations.add(nlp(targetWord).nouns().toPlural().out());
        variations.add(nlp(targetWord).nouns().toSingular().out());
      } catch (e) {
        // If compromise fails on a word, just ignore
      }

      // Convert set to array, filter empty strings, and escape for regex
      const variationArray = Array.from(variations)
        .filter((v) => v)
        // Escape regex special characters just in case
        .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

      // Match any of the variations in the sentence
      // We use a regex constructor with the variations joined by |
      const matchString = variationArray.map((v) => `\\b${v}\\b`).join("|");
      const matchRegex = new RegExp(matchString, "gi");

      // Find matches in the original document text
      const docText = doc.text();
      const matches = docText.match(matchRegex);

      if (matches && matches.length > 0) {
        // Correctly found the word (or its variation)
        correctForms = Array.from(matches);
        clozeSentence = docText.replace(matchRegex, "___");
      } else {
        // Fallback: Use simple regex for the base word
        const fallbackRegex = new RegExp(`\\b${vocab.word}[a-z]*\\b`, "gi");
        const fallbackMatches = vocab.example.match(fallbackRegex);
        correctForms = fallbackMatches ? Array.from(fallbackMatches) : [];
        clozeSentence = vocab.example.replace(fallbackRegex, "___");
      }

      translation = vocab.translation;

      // Get 3 random wrong answers (distractors)
      const otherWords = vocabData
        .filter((v) => v.word !== vocab.word)
        .map((v) => v.word);
      const shuffledOthers = shuffleArray(otherWords);
      const wrongAnswers = shuffledOthers.slice(0, 3);

      // Combine and shuffle options (1 correct + 3 wrong)
      options = shuffleArray([vocab.word, ...wrongAnswers]);
    }

    return {
      id: `q${index}`,
      word: vocab.word,
      meaning: vocab.meaning,
      options,
      correctAnswer: isWordAnswer ? vocab.word : vocab.meaning,
      clozeSentence,
      translation,
      correctForms,
    };
  });
};

// Word Arrangement helpers
const tokenizeSentence = (sentence: string): string[] => {
  // Split by spaces but keep punctuation attached to words
  return sentence.split(/\s+/).filter((chunk) => chunk.length > 0);
};

const normalizeSentence = (sentence: string) =>
  sentence.split(/\s+/).filter(Boolean).join(" ");

const splitExampleSentences = (example: string): string[] => {
  const normalized = example.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let sentences: string[] = [];
  if (lines.length > 1) {
    sentences = lines;
  } else if (/^\s*\d+[\.\)]\s+/.test(normalized)) {
    sentences = normalized
      .split(/\s*\d+[\.\)]\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  if (sentences.length === 0) {
    sentences = [normalized];
  }

  return sentences
    .map((sentence) => sentence.replace(/^\d+[\.\)]\s+/, "").trim())
    .filter(Boolean);
};

export default function QuizPlayScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { recordQuizAnswer, stats } = useUserStatsStore();
  const targetScore = stats?.targetScore || 10;
  useTimeTracking(); // Track time spent on this screen
  const { courseId, day, quizType } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
    quizType: string;
  }>();

  const course = COURSES.find((c) => c.id === courseId);
  const dayNumber = parseInt(day || "1", 10);

  const [loading, setLoading] = useState(true);
  const [vocabularyData, setVocabularyData] = useState<VocabData[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [matchingFeedback, setMatchingFeedback] = useState<string | null>(null);
  const [matchingMeanings, setMatchingMeanings] = useState<string[]>([]);

  // Word Arrangement state
  const [shuffledChunks, setShuffledChunks] = useState<string[]>([]);
  const [selectedChunksByArea, setSelectedChunksByArea] = useState<string[][]>(
    [],
  );
  const [arrangementComplete, setArrangementComplete] = useState(false);
  const [currentArrangementWord, setCurrentArrangementWord] =
    useState<VocabData | null>(null);
  const [currentArrangementSentences, setCurrentArrangementSentences] =
    useState<string[]>([]);
  const [sentenceChunkCounts, setSentenceChunkCounts] = useState<number[]>([]);
  const [focusedSentenceIndex, setFocusedSentenceIndex] = useState(0);

  // Fetch vocabulary data from Firestore
  useEffect(() => {
    const fetchVocabulary = async () => {
      setLoading(true);
      try {
        const config = getCourseConfig(courseId as CourseType);

        if (!config.path) {
          console.error("No path configuration for course:", courseId);
          setLoading(false);
          return;
        }

        const subCollectionName = `Day${dayNumber}`;
        const targetCollection = collection(db, config.path, subCollectionName);

        const q = query(targetCollection);
        const querySnapshot = await getDocs(q);

        const fetchedVocab: VocabData[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            word: data.word,
            meaning: data.meaning,
            pronunciation: data.pronunciation,
            example: data.example,
            translation: data.translation,
          };
        });

        console.log(
          `Fetched ${fetchedVocab.length} words from ${subCollectionName} for quiz`,
        );

        if (fetchedVocab.length < 4) {
          console.warn("Not enough vocabulary for quiz (need at least 4)");
        }

        setVocabularyData(fetchedVocab);

        // Generate quiz questions from fetched data
        const generatedQuestions = generateQuizQuestions(
          fetchedVocab,
          quizType || "multiple-choice",
          targetScore,
        );
        setQuestions(generatedQuestions);

        // Set up matching meanings if it's a matching quiz
        if (quizType === "matching") {
          setMatchingMeanings(
            shuffleArray(generatedQuestions.map((q) => q.meaning)),
          );
        }
      } catch (error) {
        console.error("Error fetching vocabulary for quiz:", error);
      } finally {
        setLoading(false);
        // print stats
        console.log("Stats:", targetScore);
      }
    };

    fetchVocabulary();
  }, [courseId, dayNumber, quizType, targetScore]);

  const currentQuestion = questions[currentIndex];
  const isMatching = quizType === "matching";
  const isSpelling = quizType === "spelling";
  const isFillInBlank = quizType === "fill-in-blank";
  const isWordArrangement = quizType === "word-arrangement";
  const matchedCount = Object.keys(matchedPairs).length;
  const progressCurrent = isMatching ? matchedCount : currentIndex + 1;

  const handleAnswer = async (answer: string) => {
    const correct =
      answer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    // Record answer for stats
    if (user) {
      await recordQuizAnswer(user.uid, correct);
    }

    // Auto-advance after showing feedback
    setTimeout(() => {
      setShowResult(false);
      setUserAnswer("");

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setQuizFinished(true);
        saveQuizResult();
      }
    }, 1500); // 1.5 seconds delay to show feedback
  };

  const handleMatchingAttempt = async (word: string, meaning: string) => {
    const correct = questions.find((q) => q.word === word)?.meaning === meaning;
    setMatchingFeedback(
      correct ? t("quiz.feedback.correct") : t("quiz.feedback.incorrect"),
    );

    if (user) {
      await recordQuizAnswer(user.uid, correct);
    }

    if (correct) {
      setMatchedPairs((prev) => ({ ...prev, [word]: meaning }));
      setScore((prev) => prev + 1);
    }

    setSelectedWord(null);
    setSelectedMeaning(null);

    if (correct && Object.keys(matchedPairs).length + 1 === questions.length) {
      setQuizFinished(true);
      saveQuizResult(score + 1);
    }
  };

  const handleSelectWord = (word: string) => {
    if (matchedPairs[word]) return;
    if (selectedMeaning) {
      handleMatchingAttempt(word, selectedMeaning);
      return;
    }
    setSelectedWord(word);
  };

  const handleSelectMeaning = (meaning: string) => {
    if (Object.values(matchedPairs).includes(meaning)) return;
    if (selectedWord) {
      handleMatchingAttempt(selectedWord, meaning);
      return;
    }
    setSelectedMeaning(meaning);
  };

  // Word Arrangement: Initialize a new word for arrangement
  const initWordArrangement = React.useCallback((vocab: VocabData) => {
    if (!vocab.example) return;
    const sentences = splitExampleSentences(vocab.example)
      .map((sentence) => normalizeSentence(sentence))
      .filter(Boolean);
    if (sentences.length === 0) return;

    const sentenceChunks = sentences.map((sentence) =>
      tokenizeSentence(sentence),
    );
    const chunks = sentenceChunks.flat();
    setCurrentArrangementWord(vocab);
    setCurrentArrangementSentences(sentences);
    setSentenceChunkCounts(sentenceChunks.map((chunk) => chunk.length));
    setShuffledChunks(shuffleArray([...chunks]));
    // Initialize empty arrays for each sentence area
    setSelectedChunksByArea(sentences.map(() => []));
    setArrangementComplete(false);
    setFocusedSentenceIndex(0);
  }, []);

  // Word Arrangement: Handle selecting a chunk from available
  const handleChunkSelect = (chunk: string, index: number) => {
    if (arrangementComplete) return;
    // Remove from shuffled
    const newShuffled = [...shuffledChunks];
    newShuffled.splice(index, 1);
    setShuffledChunks(newShuffled);

    // Add to the focused sentence area
    setSelectedChunksByArea((prev) => {
      const newAreas = prev.map((area, i) =>
        i === focusedSentenceIndex ? [...area, chunk] : [...area],
      );
      return newAreas;
    });
  };

  // Word Arrangement: Handle focus change
  const handleFocusChange = (index: number) => {
    setFocusedSentenceIndex(index);
  };

  // Word Arrangement: Handle removing a chunk from answer
  const handleChunkDeselect = (areaIndex: number, chunkIndex: number) => {
    if (arrangementComplete) return;
    const chunk = selectedChunksByArea[areaIndex]?.[chunkIndex];
    if (!chunk) return;

    // Remove from the area
    setSelectedChunksByArea((prev) => {
      const newAreas = prev.map((area, i) => {
        if (i === areaIndex) {
          const newArea = [...area];
          newArea.splice(chunkIndex, 1);
          return newArea;
        }
        return [...area];
      });
      return newAreas;
    });

    // Add back to shuffled chunks
    setShuffledChunks((prev) => [...prev, chunk]);
  };

  // Word Arrangement: Check if arrangement is correct
  const checkArrangement = React.useCallback(async () => {
    if (currentArrangementSentences.length === 0) return;

    // Each area is already a separate array - compare directly
    const isCorrect =
      selectedChunksByArea.length === currentArrangementSentences.length &&
      selectedChunksByArea.every((areaChunks, index) => {
        const userSentence = normalizeSentence(areaChunks.join(" "));
        return userSentence === currentArrangementSentences[index];
      });

    if (isCorrect) {
      setArrangementComplete(true);
      setScore((prev) => prev + 1);
      if (user) {
        await recordQuizAnswer(user.uid, true);
      }
    }
    return isCorrect;
  }, [
    currentArrangementSentences,
    selectedChunksByArea,
    user,
    recordQuizAnswer,
  ]);

  // Word Arrangement: Handle next word
  const handleArrangementNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= vocabularyData.length) {
      setQuizFinished(true);
      saveQuizResult();
      return;
    }

    // Find next word with example sentence
    let nextVocab = vocabularyData[nextIndex];
    let searchIndex = nextIndex;
    while (searchIndex < vocabularyData.length && !nextVocab.example) {
      searchIndex++;
      if (searchIndex < vocabularyData.length) {
        nextVocab = vocabularyData[searchIndex];
      }
    }

    if (searchIndex >= vocabularyData.length || !nextVocab.example) {
      setQuizFinished(true);
      saveQuizResult();
      return;
    }

    setCurrentIndex(searchIndex);
    initWordArrangement(nextVocab);
  };

  // Word Arrangement: Check arrangement when all chunks are selected
  const totalSelectedChunks = selectedChunksByArea.reduce(
    (sum, area) => sum + area.length,
    0,
  );
  const totalExpectedChunks = sentenceChunkCounts.reduce(
    (sum, count) => sum + count,
    0,
  );

  useEffect(() => {
    if (
      isWordArrangement &&
      shuffledChunks.length === 0 &&
      totalSelectedChunks > 0 &&
      totalSelectedChunks === totalExpectedChunks &&
      !arrangementComplete
    ) {
      checkArrangement();
    }
  }, [
    shuffledChunks,
    totalSelectedChunks,
    totalExpectedChunks,
    isWordArrangement,
    arrangementComplete,
    checkArrangement,
  ]);

  // Word Arrangement: Initialize first word when data is loaded
  useEffect(() => {
    if (
      isWordArrangement &&
      vocabularyData.length > 0 &&
      !currentArrangementWord
    ) {
      // Find first word with example sentence
      const firstWithExample = vocabularyData.find((v) => v.example);
      if (firstWithExample) {
        const firstIndex = vocabularyData.indexOf(firstWithExample);
        setCurrentIndex(firstIndex);
        initWordArrangement(firstWithExample);
      }
    }
  }, [
    vocabularyData,
    isWordArrangement,
    currentArrangementWord,
    initWordArrangement,
  ]);

  const saveQuizResult = async (finalScore?: number) => {
    if (!user) return;

    const resolvedScore = finalScore ?? score;
    const percentage = Math.round((resolvedScore / questions.length) * 100);

    try {
      // Save quiz result to Firestore
      await setDoc(
        doc(db, "quiz", user.uid, "course", `${courseId}-day${day}`),
        {
          courseId,
          day: dayNumber,
          quizType,
          score: resolvedScore,
          totalQuestions: questions.length,
          percentage,
          completedAt: new Date().toISOString(),
        },
      );

      // Update course progress
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let accumulatedCorrect = resolvedScore;
      if (userDoc.exists()) {
        const data = userDoc.data();
        const existingProgress =
          data.courseProgress?.[courseId as string]?.[dayNumber] || {};
        accumulatedCorrect += existingProgress.accumulatedCorrect || 0;
      }

      await updateDoc(doc(db, "users", user.uid), {
        [`courseProgress.${courseId}.${dayNumber}.quizCompleted`]: true,
        [`courseProgress.${courseId}.${dayNumber}.quizScore`]: percentage,
        [`courseProgress.${courseId}.${dayNumber}.accumulatedCorrect`]:
          accumulatedCorrect,
        [`courseProgress.${courseId}.${dayNumber}.isRetake`]:
          accumulatedCorrect >= (stats?.targetScore || 10),
      });
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const handleFinish = () => {
    router.back();
    router.back();
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer("");
    setShowResult(false);
    setQuizFinished(false);
    setSelectedWord(null);
    setSelectedMeaning(null);
    setMatchedPairs({});
    setMatchingFeedback(null);
    // Reset word arrangement state
    setShuffledChunks([]);
    setSelectedChunksByArea([]);
    setArrangementComplete(false);
    setCurrentArrangementWord(null);
    setCurrentArrangementSentences([]);
    setSentenceChunkCounts([]);
  };

  // Show loading screen while fetching data
  if (loading || questions.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <Stack.Screen
          options={{
            title: t("quiz.typeTitle"),
            headerBackTitle: t("common.back"),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>
            {t("common.loading")}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (quizFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <Stack.Screen
          options={{
            title: t("quiz.results.title"),
            headerBackTitle: t("common.back"),
          }}
        />
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.scoreCircle,
              {
                borderColor:
                  percentage >= 80
                    ? "#28a745"
                    : percentage >= 60
                      ? "#ffc107"
                      : "#dc3545",
              },
            ]}
          >
            <ThemedText type="title" style={styles.scoreText}>
              {percentage}%
            </ThemedText>
            <ThemedText style={styles.scoreLabel}>
              {score}/{questions.length}
            </ThemedText>
          </View>

          <ThemedText type="subtitle" style={styles.resultMessage}>
            {percentage >= 80
              ? t("quiz.results.excellent")
              : percentage >= 60
                ? t("quiz.results.goodJob")
                : t("quiz.results.keepPracticing")}
          </ThemedText>

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultButton, styles.retryButton]}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <ThemedText style={styles.resultButtonText}>
                {t("common.retry")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultButton, styles.finishButton]}
              onPress={handleFinish}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <ThemedText style={styles.resultButtonText}>
                {t("common.finish")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: isMatching
            ? t("quiz.matching.progressTitle", {
                current: matchedCount,
                total: questions.length,
              })
            : t("quiz.questionTitle", {
                current: currentIndex + 1,
                total: questions.length,
              }),
          headerBackTitle: t("common.back"),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Bar */}
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
                  {
                    width: `${(progressCurrent / questions.length) * 100}%`,
                    backgroundColor: course?.color || "#007AFF",
                  },
                ]}
              />
            </View>
            <ThemedText style={styles.progressText}>
              {progressCurrent} / {questions.length}
            </ThemedText>
          </View>

          {/* Game Section */}
          {isMatching ? (
            <MatchingGame
              questions={questions}
              meanings={matchingMeanings}
              selectedWord={selectedWord}
              selectedMeaning={selectedMeaning}
              matchedPairs={matchedPairs}
              onSelectWord={handleSelectWord}
              onSelectMeaning={handleSelectMeaning}
              feedback={matchingFeedback}
              courseColor={course?.color}
              isDark={isDark}
            />
          ) : isSpelling ? (
            <SpellingGame
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              showResult={showResult}
              isCorrect={isCorrect}
              onSubmit={() => handleAnswer(userAnswer)}
              courseColor={course?.color}
              meaning={currentQuestion.meaning}
            />
          ) : isFillInBlank ? (
            <FillInTheBlankGame
              word={currentQuestion.word}
              clozeSentence={currentQuestion.clozeSentence || ""}
              translation={currentQuestion.translation}
              options={currentQuestion.options || []}
              correctAnswer={currentQuestion.correctAnswer}
              userAnswer={userAnswer}
              showResult={showResult}
              onAnswer={(answer) => {
                setUserAnswer(answer);
                handleAnswer(answer);
              }}
              correctForms={currentQuestion.correctForms}
            />
          ) : isWordArrangement ? (
            <WordArrangementGame
              word={currentArrangementWord?.word || ""}
              meaning={currentArrangementWord?.meaning || ""}
              translation={currentArrangementWord?.translation}
              selectedChunksByArea={selectedChunksByArea}
              availableChunks={shuffledChunks}
              isComplete={arrangementComplete}
              sentenceChunkCounts={sentenceChunkCounts}
              courseColor={course?.color}
              focusedSentenceIndex={focusedSentenceIndex}
              onFocusChange={handleFocusChange}
              onChunkSelect={handleChunkSelect}
              onChunkDeselect={handleChunkDeselect}
              onNext={handleArrangementNext}
            />
          ) : (
            <MultipleChoiceGame
              options={currentQuestion.options || []}
              correctAnswer={currentQuestion.correctAnswer}
              userAnswer={userAnswer}
              showResult={showResult}
              onAnswer={(answer) => {
                setUserAnswer(answer);
                handleAnswer(answer);
              }}
              word={currentQuestion.word}
            />
          )}

          {/* Result Feedback */}
          {showResult && !isMatching && (
            <QuizFeedback
              isCorrect={isCorrect}
              correctAnswer={currentQuestion.correctAnswer}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "right",
  },

  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 8,
    marginTop: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 48,
  },
  scoreLabel: {
    fontSize: 16,
    opacity: 0.6,
  },
  resultMessage: {
    fontSize: 24,
    marginBottom: 32,
  },
  resultButtons: {
    flexDirection: "row",
    gap: 16,
  },
  resultButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  retryButton: {
    backgroundColor: "#6c757d",
  },
  finishButton: {
    backgroundColor: "#28a745",
  },
  resultButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
