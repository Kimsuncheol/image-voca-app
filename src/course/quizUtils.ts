import nlp from "compromise";
import type { KanjiWord } from "../types/vocabulary";
import {
  getLocalizedKanjiMeanings,
  getLocalizedKanjiReadings,
} from "../utils/kanjiLocalization";
import { isPronunciationMatchEligible } from "../utils/pronunciationMatching";

export interface QuizWordOption {
  id?: string;
  word: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  answerText?: string;
}

export interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  matchItemId?: string;
  matchChoiceId?: string;
  matchChoiceText?: string;
  synonym?: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  options?: string[] | QuizWordOption[];
  correctAnswer: string;
  clozeSentence?: string;
  translation?: string;
  localizedPronunciation?: string;
  correctForms?: string[];
  prompt?: string;
  highlightText?: string;
}

export interface QuizVocabData {
  word: string;
  meaning: string;
  synonyms?: string[];
  pronunciation?: string;
  pronunciationRoman?: string;
  localizedPronunciation?: string;
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

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const firstNonEmpty = (values: string[]) =>
  values.map((value) => value.trim()).find(Boolean);

export const mapKanjiWordToQuizData = (
  card: KanjiWord,
  language?: string,
): QuizVocabData => {
  const exampleIndex = card.example.findIndex((example) =>
    example.includes(card.kanji),
  );
  const exampleContainingKanji =
    exampleIndex >= 0 ? card.example[exampleIndex] : undefined;
  const isKorean = language?.split("-")[0] === "ko";
  const translations = isKorean
    ? card.exampleKoreanTranslation
    : card.exampleEnglishTranslation;

  return {
    word: card.kanji,
    meaning: getLocalizedKanjiMeanings(card, language)
      .map((meaning) => meaning.trim())
      .filter(Boolean)
      .join("; "),
    pronunciation: firstNonEmpty(getLocalizedKanjiReadings(card, language)),
    example: exampleContainingKanji,
    translation:
      exampleIndex >= 0
        ? firstNonEmpty([translations[exampleIndex] ?? ""])
        : undefined,
  };
};

export const generateQuizQuestions = (
  vocabData: QuizVocabData[],
  quizType: string,
): QuizQuestion[] => {
  const selectedWords = shuffleArray(
    quizType === "synonym-matching"
      ? vocabData.filter((vocab) => (vocab.synonyms?.length ?? 0) > 0)
      : quizType === "pronunciation-matching"
        ? vocabData.filter((vocab) =>
            isPronunciationMatchEligible(vocab.word, vocab.pronunciation),
          )
      : [...vocabData],
  );

  return selectedWords.map((vocab, index) => {
    const isWordAnswer = quizType === "fill-in-blank";
    const synonym = vocab.synonyms?.[0];
    const pronunciation = isPronunciationMatchEligible(
      vocab.word,
      vocab.pronunciation,
    )
      ? vocab.pronunciation
      : undefined;

    let options: string[] | QuizWordOption[] | undefined;
    if (quizType === "multiple-choice") {
      const otherMeanings = vocabData
        .filter((v) => v.word !== vocab.word)
        .map((v) => v.meaning);
      const shuffledOthers = shuffleArray(otherMeanings);
      const wrongAnswers = shuffledOthers.slice(0, 3);

      options = shuffleArray([vocab.meaning, ...wrongAnswers]);
    }

    let clozeSentence: string | undefined;
    let translation: string | undefined;
    let correctForms: string[] | undefined;

    if (quizType === "fill-in-blank" && vocab.example) {
      const doc = nlp(vocab.example);
      const targetWord = vocab.word;
      const variations = new Set([targetWord, targetWord.toLowerCase()]);

      try {
        variations.add(nlp(targetWord).verbs().toPastTense().out());
        variations.add(nlp(targetWord).verbs().toPresentTense().out());
        variations.add(nlp(targetWord).verbs().toGerund().out());

        variations.add(nlp(targetWord).nouns().toPlural().out());
        variations.add(nlp(targetWord).nouns().toSingular().out());
      } catch {
        // Ignore unsupported transformations for unusual tokens.
      }

      const variationArray = Array.from(variations)
        .filter((v) => v)
        .map((v) => escapeRegex(v));

      const matchString = variationArray.map((v) => `\\b${v}\\b`).join("|");
      const matchRegex = new RegExp(matchString, "gi");

      const docText = doc.text();
      const matches = docText.match(matchRegex);

      if (matches && matches.length > 0) {
        correctForms = Array.from(matches);
        clozeSentence = docText.replace(matchRegex, "___");
      } else {
        const fallbackRegex = new RegExp(`\\b${vocab.word}[a-z]*\\b`, "gi");
        const fallbackMatches = vocab.example.match(fallbackRegex);
        correctForms = fallbackMatches ? Array.from(fallbackMatches) : [];
        clozeSentence = vocab.example.replace(fallbackRegex, "___");
      }

      translation = vocab.translation;

      const otherWords = vocabData
        .filter((v) => v.word !== vocab.word)
        .map((v) => ({
          word: v.word,
          pronunciation: v.pronunciation,
          pronunciationRoman: v.pronunciationRoman,
        }));
      const shuffledOthers = shuffleArray(otherWords);
      const wrongAnswers = shuffledOthers.slice(0, 3);

      options = shuffleArray([
        {
          word: vocab.word,
          pronunciation: vocab.pronunciation,
          pronunciationRoman: vocab.pronunciationRoman,
        },
        ...wrongAnswers,
      ]);
    }

    return {
      id: `q${index}`,
      word: vocab.word,
      meaning: vocab.meaning,
      synonym,
      pronunciation: vocab.pronunciation,
      pronunciationRoman: vocab.pronunciationRoman,
      options,
      correctAnswer: isWordAnswer
        ? vocab.word
        : quizType === "pronunciation-matching" && pronunciation
          ? pronunciation
        : quizType === "synonym-matching" && synonym
          ? synonym
          : vocab.meaning,
      clozeSentence,
      translation,
      localizedPronunciation: vocab.localizedPronunciation,
      correctForms,
    };
  });
};

export const hasReachedQuizCompletionThreshold = (
  accumulatedCorrect: number,
  totalQuestions: number,
) => totalQuestions > 0 && accumulatedCorrect >= totalQuestions;
