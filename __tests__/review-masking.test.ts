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

  it("uses invisible mask styles in both themes", () => {
    expect(getReviewTapeTextStyle(false)).toEqual(
      expect.objectContaining({
        color: "transparent",
        backgroundColor: "transparent",
        borderRadius: 4,
        overflow: "hidden",
      }),
    );
    expect(getReviewTapeTextStyle(true)).toEqual(
      expect.objectContaining({
        color: "transparent",
        backgroundColor: "transparent",
        borderRadius: 4,
        overflow: "hidden",
      }),
    );
  });

  it("maps review mask targets to the expected content fields", () => {
    expect(
      shouldMaskReviewContent(true, "word-pronunciation", "word"),
    ).toBe(true);
    expect(
      shouldMaskReviewContent(true, "word-pronunciation", "pronunciation"),
    ).toBe(true);
    expect(
      shouldMaskReviewContent(true, "word-pronunciation", "example"),
    ).toBe(true);
    expect(
      shouldMaskReviewContent(true, "word-pronunciation", "meaning"),
    ).toBe(false);
    expect(shouldMaskReviewContent(true, "meaning", "meaning")).toBe(true);
    expect(shouldMaskReviewContent(true, "meaning", "word")).toBe(false);
    expect(shouldMaskReviewContent(true, "all", "meaning")).toBe(true);
    expect(shouldMaskReviewContent(false, "all", "meaning")).toBe(false);
  });
});
