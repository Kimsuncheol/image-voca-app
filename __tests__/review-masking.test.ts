import {
  getReviewTapeTextStyle,
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
});
