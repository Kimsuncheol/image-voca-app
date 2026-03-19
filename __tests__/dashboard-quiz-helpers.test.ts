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
  ].map((word) => resolveQuizVocabulary(word, "ko"));

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
});
