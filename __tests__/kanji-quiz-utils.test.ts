import {
  generateQuizQuestions,
  mapKanjiWordToQuizData,
} from "../src/course/quizUtils";
import type { KanjiWord } from "../src/types/vocabulary";

const kanjiWord: KanjiWord = {
  id: "kanji-1",
  kanji: "語",
  meaning: [" word ", "language"],
  meaningExample: [{ items: ["熟語"] }],
  meaningExampleHurigana: [{ items: ["じゅくご"] }],
  meaningEnglishTranslation: [{ items: ["compound word"] }],
  meaningKoreanTranslation: [{ items: ["숙어"] }],
  reading: [" ", "ご"],
  readingExample: [{ items: ["日本語"] }],
  readingExampleHurigana: [{ items: ["にほんご"] }],
  readingEnglishTranslation: [{ items: ["Japanese language"] }],
  readingKoreanTranslation: [{ items: ["일본어"] }],
  example: ["本を読む。", "語を学ぶ。"],
  exampleEnglishTranslation: ["Read a book.", "Learn words."],
  exampleKoreanTranslation: ["책을 읽다.", "단어를 배우다."],
  exampleHurigana: ["ほんをよむ。", "ごをまなぶ。"],
};

describe("Kanji quiz conversion", () => {
  it("uses kanji, joined meanings, first reading, and a containing cloze example", () => {
    const vocab = mapKanjiWordToQuizData(kanjiWord);

    expect(vocab.word).toBe("語");
    expect(vocab.meaning).toBe("word; language");
    expect(vocab.pronunciation).toBe("ご");
    expect(vocab.example).toBe("語を学ぶ。");
    expect(vocab.translation).toBe("Learn words.");
  });

  it("generates matching and pronunciation questions without nested-array indexing", () => {
    const vocab = mapKanjiWordToQuizData(kanjiWord);

    const [matching] = generateQuizQuestions([vocab], "matching");
    const [pronunciation] = generateQuizQuestions(
      [vocab],
      "pronunciation-matching",
    );

    expect(matching.word).toBe("語");
    expect(matching.correctAnswer).toBe("word; language");
    expect(pronunciation.word).toBe("語");
    expect(pronunciation.correctAnswer).toBe("ご");
  });

  it("omits cloze data when no general example contains the kanji", () => {
    const vocab = mapKanjiWordToQuizData({
      ...kanjiWord,
      example: ["本を読む。"],
    });

    const [question] = generateQuizQuestions([vocab], "fill-in-blank");

    expect(vocab.example).toBeUndefined();
    expect(question.clozeSentence).toBeUndefined();
  });
});
