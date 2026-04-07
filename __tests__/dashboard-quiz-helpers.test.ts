import { buildDashboardQuizPayload } from "../components/dashboard/utils/quizHelpers";
import { resolveQuizVocabulary } from "../src/utils/localizedVocabulary";

describe("dashboard quiz payloads", () => {
  const batch = [
    {
      word: "間",
      meaningEnglish: "between",
      meaningKorean: "사이",
      pronunciation: "あいだ",
      pronunciationRoman: "aida",
      example: "間を空ける",
    },
    {
      word: "外",
      meaningEnglish: "outside",
      meaningKorean: "밖",
      pronunciation: "そと",
      pronunciationRoman: "soto",
      example: "外に出る",
    },
    {
      word: "中",
      meaningEnglish: "inside",
      meaningKorean: "안",
      pronunciation: "なか",
      pronunciationRoman: "naka",
      example: "中を見る",
    },
    {
      word: "前",
      meaningEnglish: "front",
      meaningKorean: "앞",
      pronunciation: "まえ",
      pronunciationRoman: "mae",
      example: "前を見る",
    },
  ].map((word) => ({
    ...resolveQuizVocabulary(word, "ko"),
    course: "JLPT_N3" as const,
  }));

  const collocationBatch = [
    {
      word: "take place",
      meaning: "happen",
      pronunciation: "used to describe an event happening",
      example: "The meeting will take place tomorrow.",
      course: "COLLOCATION" as const,
    },
    {
      word: "make progress",
      meaning: "advance",
      pronunciation: "used when improving over time",
      example: "She made progress quickly.",
      course: "COLLOCATION" as const,
    },
    {
      word: "pay attention",
      meaning: "focus carefully",
      pronunciation: "used to ask for focus",
      example: "Please pay attention in class.",
      course: "COLLOCATION" as const,
    },
    {
      word: "raise questions",
      meaning: "cause doubt",
      pronunciation: "used when something seems doubtful",
      example: "The results raised questions.",
      course: "COLLOCATION" as const,
    },
  ];

  const toeflBatch = [
    {
      word: "abandon",
      meaning: "leave behind",
      pronunciation: "uh-BAN-duhn",
      example: "They abandon the plan.",
      course: "TOEFL_IELTS" as const,
      synonyms: ["forsake", "desert"],
    },
    {
      word: "brief",
      meaning: "short",
      pronunciation: "breef",
      example: "Keep it brief.",
      course: "TOEFL_IELTS" as const,
      synonyms: ["concise"],
    },
    {
      word: "calm",
      meaning: "peaceful",
      pronunciation: "kahm",
      example: "Stay calm.",
      course: "TOEFL_IELTS" as const,
      synonyms: ["serene"],
    },
    {
      word: "daring",
      meaning: "bold",
      pronunciation: "DAIR-ing",
      example: "A daring idea.",
      course: "TOEFL_IELTS" as const,
      synonyms: ["bold"],
    },
  ];

  it("builds matching payloads with localized meaning and pronunciation fields", () => {
    const payload = buildDashboardQuizPayload(batch[0], batch, "matching");

    expect(payload).not.toBeNull();
    expect(payload?.quizItem).toMatchObject({
      word: "間",
      meaning: "사이",
      pronunciation: "あいだ",
      pronunciationRoman: "aida",
    });
    expect(payload?.matchingPairs).toHaveLength(4);
    expect(payload?.matchingPairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          word: "間",
          meaning: "사이",
          pronunciation: "あいだ",
          pronunciationRoman: "aida",
        }),
      ]),
    );
  });

  it("builds fill-in-blank payloads with localized meaning and pronunciation fields", () => {
    const payload = buildDashboardQuizPayload(batch[0], batch, "fill-in-blank");

    expect(payload).not.toBeNull();
    expect(payload?.quizItem).toMatchObject({
      word: "間",
      meaning: "사이",
      pronunciation: "あいだ",
      pronunciationRoman: "aida",
      example: "___を空ける",
    });
    expect(payload?.wordOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          word: "間",
          pronunciation: "あいだ",
          pronunciationRoman: "aida",
        }),
      ]),
    );
  });

  it("omits collocation explanation from multiple-choice payload subtitles", () => {
    const payload = buildDashboardQuizPayload(
      collocationBatch[0],
      collocationBatch,
      "multiple-choice",
    );

    expect(payload).not.toBeNull();
    expect(payload?.quizItem).toMatchObject({
      word: "take place",
      meaning: "happen",
    });
    expect(payload?.quizItem.pronunciation).toBeUndefined();
    expect(payload?.quizItem.pronunciationRoman).toBeUndefined();
    expect(payload?.options).toEqual(
      expect.arrayContaining([
        "happen",
        "advance",
        "focus carefully",
        "cause doubt",
      ]),
    );
  });

  it("builds synonym matching payloads for TOEFL_IELTS words", () => {
    const payload = buildDashboardQuizPayload(
      toeflBatch[0],
      toeflBatch,
      "synonym-matching",
    );

    expect(payload).not.toBeNull();
    expect(payload?.matchingPairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          word: "abandon",
          synonym: "forsake",
          meaning: "leave behind",
        }),
      ]),
    );
  });

  it("returns null for synonym matching when there are not enough TOEFL_IELTS synonym words", () => {
    const payload = buildDashboardQuizPayload(
      toeflBatch[0],
      toeflBatch.slice(0, 3),
      "synonym-matching",
    );

    expect(payload).toBeNull();
  });

  it("builds pronunciation matching payloads for eligible JLPT words", () => {
    const payload = buildDashboardQuizPayload(
      batch[0],
      batch,
      "pronunciation-matching",
    );

    expect(payload).not.toBeNull();
    expect(payload?.matchingPairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          word: "間",
          pronunciation: "あいだ",
        }),
      ]),
    );
  });

  it("returns null for pronunciation matching when there are not enough eligible JLPT words", () => {
    const payload = buildDashboardQuizPayload(
      batch[0],
      [
        batch[0],
        { ...batch[1], pronunciation: "外" },
        { ...batch[2], pronunciation: "中" },
      ],
      "pronunciation-matching",
    );

    expect(payload).toBeNull();
  });
});
