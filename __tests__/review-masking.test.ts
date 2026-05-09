import {
  getReviewTapeTextStyle,
  parseReviewMaskSegments,
  shouldMaskReviewContent,
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

  it("uses theme-matched mask styles in both themes", () => {
    expect(getReviewTapeTextStyle(false)).toEqual(
      expect.objectContaining({
        color: "#ffffff",
        backgroundColor: "transparent",
        borderRadius: 4,
        overflow: "hidden",
      }),
    );
    expect(getReviewTapeTextStyle(true)).toEqual(
      expect.objectContaining({
        color: "#000000",
        backgroundColor: "transparent",
        borderRadius: 4,
        overflow: "hidden",
      }),
    );
  });

  it("maps review mask targets to the expected content fields", () => {
    expect(shouldMaskReviewContent(true, "word", "word")).toBe(true);
    expect(shouldMaskReviewContent(true, "word", "pronunciation")).toBe(false);
    expect(shouldMaskReviewContent(true, "word", "example")).toBe(false);
    expect(shouldMaskReviewContent(true, "word", "meaning")).toBe(false);
    expect(
      shouldMaskReviewContent(true, "word-pronunciation", "word"),
    ).toBe(true);
    expect(
      shouldMaskReviewContent(true, "word-pronunciation", "pronunciation"),
    ).toBe(false);
    expect(
      shouldMaskReviewContent(true, "word-pronunciation", "example"),
    ).toBe(false);
    expect(
      shouldMaskReviewContent(true, "word-pronunciation", "meaning"),
    ).toBe(false);
    expect(shouldMaskReviewContent(true, "meaning", "meaning")).toBe(true);
    expect(shouldMaskReviewContent(true, "meaning", "word")).toBe(false);
    expect(shouldMaskReviewContent(true, "meaning", "reading")).toBe(false);
    expect(shouldMaskReviewContent(true, "reading", "reading")).toBe(true);
    expect(shouldMaskReviewContent(true, "reading", "pronunciation")).toBe(
      true,
    );
    expect(shouldMaskReviewContent(true, "reading", "word")).toBe(false);
    expect(shouldMaskReviewContent(true, "reading", "meaning")).toBe(false);
    expect(shouldMaskReviewContent(true, "reading", "example")).toBe(false);
    expect(shouldMaskReviewContent(true, "example", "example")).toBe(true);
    expect(shouldMaskReviewContent(true, "example", "word")).toBe(false);
    expect(shouldMaskReviewContent(true, "example", "meaning")).toBe(false);
    expect(shouldMaskReviewContent(true, "example", "pronunciation")).toBe(
      false,
    );
    expect(shouldMaskReviewContent(true, "synonym", "synonym")).toBe(true);
    expect(shouldMaskReviewContent(true, "synonym", "word")).toBe(false);
    expect(shouldMaskReviewContent(true, "synonym", "pronunciation")).toBe(
      false,
    );
    expect(shouldMaskReviewContent(true, "synonym", "example")).toBe(false);
    expect(shouldMaskReviewContent(true, "synonym", "meaning")).toBe(false);
    expect(shouldMaskReviewContent(true, "all", "meaning")).toBe(true);
    expect(shouldMaskReviewContent(true, "all", "synonym")).toBe(true);
    expect(shouldMaskReviewContent(false, "all", "meaning")).toBe(false);
  });
});
