import {
  normalizeVocabularyStudyMode,
  parseReviewMaskSegments,
  stripReviewMaskDelimiters,
} from "../src/utils/reviewMasking";

describe("reviewMasking", () => {
  it("strips review delimiters for learning mode display", () => {
    expect(stripReviewMaskDelimiters("Please [[[make a decision]]] today.")).toBe(
      "Please make a decision today.",
    );
  });

  it("marks only bracketed spans as masked", () => {
    expect(parseReviewMaskSegments("A [[[target]]] B")).toEqual([
      { text: "A ", masked: false },
      { text: "target", masked: true },
      { text: " B", masked: false },
    ]);
  });

  it("defaults unknown route values to learning", () => {
    expect(normalizeVocabularyStudyMode(undefined)).toBe("learning");
    expect(normalizeVocabularyStudyMode("preview")).toBe("learning");
    expect(normalizeVocabularyStudyMode("review")).toBe("review");
  });
});
