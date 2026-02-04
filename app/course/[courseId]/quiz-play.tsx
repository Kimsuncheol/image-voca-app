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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GameBoard,
  LoadingView,
  QuizFinishView,
  QuizTimer,
} from "../../../components/course";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useTimeTracking } from "../../../src/hooks/useTimeTracking";
import { autoCheckSubmission } from "../../../src/services/assignmentService";
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
  prompt?: string;
  highlightText?: string;
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
    case "COLLOCATION":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION,
        prefix: "COLLOCATION",
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

const resolveQuizType = (quizType?: string): string => {
  switch (quizType) {
    case "gap-fill-sentence":
      return "fill-in-blank";
    case "collocation-matching":
      return "matching";
    case "word-order-tiles":
      return "word-arrangement";
    case "error-correction":
      return "multiple-choice";
    default:
      return quizType || "multiple-choice";
  }
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Generate quiz questions from real vocabulary data
const generateQuizQuestions = (
  vocabData: VocabData[],
  quizType: string,
  targetScore: number = 10,
  quizVariant?: string,
): QuizQuestion[] => {
  // Shuffle and take random questions (up to targetScore)
  const selectedWords = shuffleArray([...vocabData]).slice(
    0,
    Math.min(targetScore, vocabData.length),
  );

  if (quizVariant === "error-correction") {
    const otherWords = vocabData.map((v) => v.word);
    return selectedWords.map((vocab, index) => {
      const wrongOptions = shuffleArray(
        otherWords.filter((word) => word !== vocab.word),
      );
      const incorrectWord = wrongOptions[0];
      const baseSentence = vocab.example || vocab.word;
      const replacementRegex = new RegExp(escapeRegex(vocab.word), "gi");
      const errorSentence = incorrectWord
        ? baseSentence.replace(replacementRegex, incorrectWord)
        : baseSentence;

      return {
        id: `q${index}`,
        word: errorSentence,
        meaning: vocab.meaning,
        options: shuffleArray([vocab.word, ...wrongOptions.slice(0, 3)]),
        correctAnswer: vocab.word,
        prompt: "Fix the incorrect collocation",
        highlightText: incorrectWord,
      };
    });
  }

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
        .map((v) => escapeRegex(v));

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

const parseRoleplayLine = (
  line: string,
): { role: string; sentence: string } | null => {
  const match = line.match(/^([^:]+):\s*(.+)$/);
  if (!match) return null;
  const role = match[1].trim();
  const sentence = match[2].trim();
  if (!role || !sentence) return null;
  return { role, sentence };
};

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
  const {
    bufferQuizAnswer,
    flushQuizStats,
    stats,
    courseProgress,
    fetchCourseProgress,
    updateCourseDayProgress,
  } = useUserStatsStore();
  const targetScore = stats?.targetScore || 10;
  useTimeTracking(); // Track time spent on this screen
  const { courseId, day, quizType } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
    quizType: string;
  }>();
  const quizVariant = quizType || "multiple-choice";
  const resolvedQuizType = resolveQuizType(quizVariant);
  const isWordOrderTiles = quizVariant === "word-order-tiles";

  const course = COURSES.find((c) => c.id === courseId);
  const dayNumber = parseInt(day || "1", 10);

  const [loading, setLoading] = useState(true);
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
  // const [matchingFeedback, setMatchingFeedback] = useState<string | null>(null); // Removed
  const [matchingMeanings, setMatchingMeanings] = useState<string[]>([]);
  const [wordArrangementItems, setWordArrangementItems] = useState<VocabData[]>(
    [],
  );
  const retakeMarkedRef = React.useRef(false);

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
  const [roleLabelsByArea, setRoleLabelsByArea] = useState<string[]>([]);

  useEffect(() => {
    if (user && courseId) {
      fetchCourseProgress(user.uid, courseId);
    }
  }, [user, courseId, fetchCourseProgress]);

  useEffect(() => {
    if (!courseId) {
      retakeMarkedRef.current = false;
      return;
    }
    retakeMarkedRef.current =
      courseProgress[courseId]?.[dayNumber]?.isRetake || false;
  }, [courseProgress, courseId, dayNumber]);

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
          if (courseId === "COLLOCATION") {
            return {
              word: data.collocation,
              meaning: data.meaning,
              pronunciation: data.explanation,
              example: data.example,
              translation: data.translation,
            };
          }
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

        if (resolvedQuizType === "word-arrangement") {
          const arrangementPool = fetchedVocab.filter((v) => v.example);
          const selectedArrangement = shuffleArray([...arrangementPool]).slice(
            0,
            Math.min(targetScore, arrangementPool.length),
          );
          setWordArrangementItems(selectedArrangement);
          setQuestions(
            selectedArrangement.map((vocab, index) => ({
              id: `q${index}`,
              word: vocab.word,
              meaning: vocab.meaning,
              correctAnswer: vocab.meaning,
            })),
          );
          setMatchingMeanings([]);
        } else {
          const generatedQuestions = generateQuizQuestions(
            fetchedVocab,
            resolvedQuizType,
            targetScore,
            quizVariant,
          );
          setQuestions(generatedQuestions);
          setWordArrangementItems([]);

          // Set up matching meanings if it's a matching quiz
          if (resolvedQuizType === "matching") {
            setMatchingMeanings(
              shuffleArray(generatedQuestions.map((q) => q.meaning)),
            );
          } else {
            setMatchingMeanings([]);
          }
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
  }, [courseId, dayNumber, quizVariant, resolvedQuizType, targetScore]);

  const currentQuestion = questions[currentIndex];
  const isMatching = resolvedQuizType === "matching";
  const isWordArrangement = resolvedQuizType === "word-arrangement";
  const matchedCount = Object.keys(matchedPairs).length;
  const totalQuestions = isWordArrangement
    ? wordArrangementItems.length
    : questions.length;
  const progressCurrent = isMatching ? matchedCount : currentIndex + 1;

  const maybeMarkRetake = React.useCallback(
    async (nextScore: number) => {
      if (!user || !courseId) return;
      if (retakeMarkedRef.current) return;

      const existingAccumulated =
        courseProgress[courseId]?.[dayNumber]?.accumulatedCorrect || 0;
      const totalCorrect = existingAccumulated + nextScore;

      if (totalCorrect < targetScore) return;

      retakeMarkedRef.current = true;
      updateCourseDayProgress(courseId, dayNumber, { isRetake: true });

      try {
        await updateDoc(doc(db, "users", user.uid), {
          [`courseProgress.${courseId}.${dayNumber}.isRetake`]: true,
        });
      } catch (error) {
        console.error("Error marking day as retake:", error);
      }
    },
    [
      user,
      courseId,
      courseProgress,
      dayNumber,
      targetScore,
      updateCourseDayProgress,
    ],
  );

  const handleAnswer = async (answer: string) => {
    const correct =
      answer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();
    const nextScore = correct ? score + 1 : score;
    console.log(
      `[Quiz] ${quizType} answer in handleAnswer`,
      correct ? "correct" : "incorrect",
      {
        questionId: currentQuestion.id,
        word: currentQuestion.word,
        answer,
        correctAnswer: currentQuestion.correctAnswer,
      },
      `score: ${nextScore}`,
    );
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore((prev) => prev + 1);
      await maybeMarkRetake(nextScore);
    }

    // Record answer for stats
    if (user) {
      bufferQuizAnswer(user.uid, correct);
    }

    // Auto-advance after showing feedback
    setTimeout(() => {
      setShowResult(false);
      setUserAnswer("");

      if (currentIndex < totalQuestions - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        if (isWordArrangement) {
          initWordArrangement(wordArrangementItems[nextIndex]);
        }
      } else {
        setQuizFinished(true);
        saveQuizResult(nextScore);
      }
    }, 1500); // 1.5 seconds delay to show feedback
  };

  const handleMatchingAttempt = async (word: string, meaning: string) => {
    const correct = questions.find((q) => q.word === word)?.meaning === meaning;
    // setMatchingFeedback(
    //   correct ? t("quiz.feedback.correct") : t("quiz.feedback.incorrect"),
    // ); // Removed

    if (user) {
      bufferQuizAnswer(user.uid, correct);
    }

    console.log("[Quiz] matching attempt", correct ? "correct" : "incorrect", {
      word,
      meaning,
    });

    if (correct) {
      const nextScore = score + 1;
      setMatchedPairs((prev) => ({ ...prev, [word]: meaning }));
      setScore((prev) => prev + 1);
      await maybeMarkRetake(nextScore);
    }

    setSelectedWord(null);
    setSelectedMeaning(null);

    if (correct && Object.keys(matchedPairs).length + 1 === totalQuestions) {
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
  const initWordArrangement = React.useCallback(
    (vocab: VocabData) => {
      if (!vocab.example) return;
      const sentences = splitExampleSentences(vocab.example)
        .map((sentence) => normalizeSentence(sentence))
        .filter(Boolean);
      if (sentences.length === 0) return;

      const translationLines = vocab.translation
        ? splitExampleSentences(vocab.translation)
            .map((line) => normalizeSentence(line))
            .filter(Boolean)
        : [];

      const roleplayLines = sentences.map((sentence) =>
        parseRoleplayLine(sentence),
      );
      const isRoleplay = roleplayLines.every(Boolean);

      const shouldPickSingle = isWordOrderTiles && sentences.length > 1;
      const selectedIndex = shouldPickSingle
        ? Math.floor(Math.random() * sentences.length)
        : null;
      const selectedIndices = shouldPickSingle
        ? [selectedIndex as number]
        : sentences.map((_, index) => index);

      const selectedSentences = selectedIndices.map((index) => {
        if (isRoleplay && roleplayLines[index]) {
          return roleplayLines[index]?.sentence ?? sentences[index];
        }
        return sentences[index];
      });

      const selectedRoleLabels = selectedIndices.map((index) => {
        if (isRoleplay && roleplayLines[index]) {
          return `${roleplayLines[index]?.role}:`;
        }
        return "";
      });

      const sentenceChunks = selectedSentences.map((sentence) =>
        tokenizeSentence(sentence),
      );
      const chunks = sentenceChunks.flat();
      const selectedTranslation = shouldPickSingle
        ? translationLines[selectedIndex as number]
        : vocab.translation;

      setCurrentArrangementWord({
        ...vocab,
        translation: selectedTranslation ?? vocab.translation,
      });
      setCurrentArrangementSentences(selectedSentences);
      setSentenceChunkCounts(sentenceChunks.map((chunk) => chunk.length));
      setShuffledChunks(shuffleArray([...chunks]));
      setSelectedChunksByArea(selectedSentences.map(() => []));
      setRoleLabelsByArea(selectedRoleLabels);
      setArrangementComplete(false);
      setFocusedSentenceIndex(0);
    },
    [isWordOrderTiles],
  );

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

    console.log(
      "[Quiz] word-arrangement attempt",
      isCorrect ? "correct" : "incorrect",
      { word: currentArrangementWord?.word },
    );

    if (user) {
      bufferQuizAnswer(user.uid, isCorrect);
    }

    if (isCorrect) {
      const nextScore = score + 1;
      setArrangementComplete(true);
      setScore((prev) => prev + 1);
      await maybeMarkRetake(nextScore);
    }
    return isCorrect;
  }, [
    currentArrangementSentences,
    currentArrangementWord,
    selectedChunksByArea,
    score,
    user,
    maybeMarkRetake,
    bufferQuizAnswer,
  ]);

  // Word Arrangement: Handle next word
  const handleArrangementNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= wordArrangementItems.length) {
      setQuizFinished(true);
      saveQuizResult();
      return;
    }
    setCurrentIndex(nextIndex);
    initWordArrangement(wordArrangementItems[nextIndex]);
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
      wordArrangementItems.length > 0 &&
      !currentArrangementWord
    ) {
      setCurrentIndex(0);
      initWordArrangement(wordArrangementItems[0]);
    }
  }, [
    isWordArrangement,
    wordArrangementItems,
    currentArrangementWord,
    initWordArrangement,
  ]);

  const saveQuizResult = async (finalScore?: number) => {
    if (!user || !courseId) return;

    const resolvedScore = finalScore ?? score;
    const percentage =
      totalQuestions > 0
        ? Math.round((resolvedScore / totalQuestions) * 100)
        : 0;

    try {
      // Save quiz result to Firestore
      await setDoc(
        doc(db, "quiz", user.uid, "course", `${courseId}-day${day}`),
        {
          courseId,
          day: dayNumber,
          quizType,
          score: resolvedScore,
          totalQuestions,
          percentage,
          completedAt: new Date().toISOString(),
        },
      );

      // Update course progress
      let accumulatedCorrect = resolvedScore;
      const existingProgress = courseProgress[courseId]?.[dayNumber] || null;
      if (typeof existingProgress?.accumulatedCorrect === "number") {
        accumulatedCorrect += existingProgress.accumulatedCorrect;
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const storedProgress =
            data.courseProgress?.[courseId as string]?.[dayNumber] || {};
          accumulatedCorrect += storedProgress.accumulatedCorrect || 0;
        }
      }
      const didReachTarget = accumulatedCorrect >= targetScore;

      await updateDoc(doc(db, "users", user.uid), {
        [`courseProgress.${courseId}.${dayNumber}.quizCompleted`]:
          didReachTarget,
        [`courseProgress.${courseId}.${dayNumber}.quizScore`]: percentage,
        [`courseProgress.${courseId}.${dayNumber}.accumulatedCorrect`]:
          accumulatedCorrect,
        [`courseProgress.${courseId}.${dayNumber}.isRetake`]: didReachTarget,
      });

      updateCourseDayProgress(courseId, dayNumber, {
        quizCompleted: didReachTarget,
        quizScore: percentage,
        accumulatedCorrect,
        isRetake: didReachTarget,
      });

      // Flush any buffered quiz stats
      await flushQuizStats(user.uid);

      // Auto-check assignment submissions for this course/day
      await autoCheckSubmission(user.uid, courseId as CourseType, dayNumber);
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const handleTimeUp = () => {
    if (isMatching) {
      // Matching game ends on time up
      setQuizFinished(true);
      saveQuizResult(score);
      return;
    }

    // Treat as incorrect answer
    if (!showResult && !quizFinished) {
      handleAnswer(""); // Empty answer triggers incorrect
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
    // setMatchingFeedback(null); // Removed
    // Reset word arrangement state
    setShuffledChunks([]);
    setSelectedChunksByArea([]);
    setArrangementComplete(false);
    setCurrentArrangementWord(null);
    setCurrentArrangementSentences([]);
    setSentenceChunkCounts([]);
  };

  // Show loading screen while fetching data
  if (loading || totalQuestions === 0) {
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
        <LoadingView isDark={isDark} />
      </SafeAreaView>
    );
  }

  if (quizFinished) {
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
        <QuizFinishView
          score={score}
          totalQuestions={totalQuestions}
          isDark={isDark}
          onRetry={handleRetry}
          onFinish={handleFinish}
        />
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
                total: totalQuestions,
              })
            : t("quiz.questionTitle", {
                current: currentIndex + 1,
                total: totalQuestions,
              }),
          headerBackTitle: t("common.back"),
        }}
      />
      {!quizFinished && !loading && (
        <QuizTimer
          duration={15}
          onTimeUp={handleTimeUp}
          isRunning={!showResult && !quizFinished}
          quizKey={isMatching ? "matching" : `${currentIndex}-${dayNumber}`}
        />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GameBoard
            quizType={resolvedQuizType}
            quizVariant={quizVariant}
            currentQuestion={currentQuestion}
            questions={questions}
            progressCurrent={progressCurrent}
            courseColor={course?.color}
            isDark={isDark}
            matchingMeanings={matchingMeanings}
            selectedWord={selectedWord}
            selectedMeaning={selectedMeaning}
            matchedPairs={matchedPairs}
            // matchingFeedback={matchingFeedback} // Removed
            onSelectWord={handleSelectWord}
            onSelectMeaning={handleSelectMeaning}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
            onSubmit={() => handleAnswer(userAnswer)}
            onAnswer={(answer) => {
              setUserAnswer(answer);
              handleAnswer(answer);
            }}
            currentArrangementWord={currentArrangementWord}
            selectedChunksByArea={selectedChunksByArea}
            shuffledChunks={shuffledChunks}
            arrangementComplete={arrangementComplete}
            sentenceChunkCounts={sentenceChunkCounts}
            focusedSentenceIndex={focusedSentenceIndex}
            roleLabelsByArea={roleLabelsByArea}
            onFocusChange={handleFocusChange}
            onChunkSelect={handleChunkSelect}
            onChunkDeselect={handleChunkDeselect}
            onArrangementNext={handleArrangementNext}
          />
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
});
