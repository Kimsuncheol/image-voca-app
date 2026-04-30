import {
  formatIdiomMeaningForDisplay,
  formatIdiomTitleForDisplay,
  getIdiomTitleFontSize,
} from "../src/utils/idiomDisplay";
import { Dimensions } from "react-native";

describe("idiomDisplay", () => {
  it("inserts line breaks before numbered idiom meanings", () => {
    expect(
      formatIdiomMeaningForDisplay(
        "1. ~할 예정이다 2. ~할 것 같다",
        "CSAT_IDIOMS",
      ),
    ).toBe("1. ~할 예정이다\n2. ~할 것 같다");
    expect(
      formatIdiomMeaningForDisplay(
        "1. ~할 예정이다 2. ~할 것 같다",
        "EXTREMELY_ADVANCED",
      ),
    ).toBe("1. ~할 예정이다\n2. ~할 것 같다");
  });

  it("keeps already multiline idiom meanings stable", () => {
    expect(
      formatIdiomMeaningForDisplay(
        "1. ~할 예정이다\n2. ~할 것 같다",
        "CSAT_IDIOMS",
      ),
    ).toBe("1. ~할 예정이다\n2. ~할 것 같다");
  });

  it("does not change non-idiom meanings", () => {
    expect(
      formatIdiomMeaningForDisplay(
        "1. ~할 예정이다 2. ~할 것 같다",
        "TOEIC",
      ),
    ).toBe("1. ~할 예정이다 2. ~할 것 같다");
  });

  it("inserts line breaks before bracketed idiom title alternatives", () => {
    expect(
      formatIdiomTitleForDisplay("in order to v [so as to v]", "CSAT_IDIOMS"),
    ).toBe("in order to v\n[so as to v]");
    expect(
      formatIdiomTitleForDisplay(
        "take A [for granted] [as given]",
        "CSAT_IDIOMS",
      ),
    ).toBe("take A\n[for granted]\n[as given]");
    expect(
      formatIdiomTitleForDisplay(
        "in order to v [so as to v]",
        "EXTREMELY_ADVANCED",
      ),
    ).toBe("in order to v\n[so as to v]");
  });

  it("inserts line breaks before slash idiom title alternatives", () => {
    expect(
      formatIdiomTitleForDisplay(
        "be angry with[at] + 사람 / about[at] + 사물",
        "CSAT_IDIOMS",
      ),
    ).toBe("be angry with[at] + 사람\n/ about[at] + 사물");
  });

  it("wraps long idiom titles at word boundaries", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    expect(
      formatIdiomTitleForDisplay(
        "make a long story short after all is said and done",
        "CSAT_IDIOMS",
        48,
      ),
    ).toBe("make a long\nstory short\nafter all is\nsaid and done");

    jest.restoreAllMocks();
  });

  it("wraps long idiom titles into fewer lines on wide devices", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 900,
      height: 1024,
      scale: 2,
      fontScale: 1,
    });

    expect(
      formatIdiomTitleForDisplay(
        "make a long story short after all is said and done",
        "CSAT_IDIOMS",
        48,
      ),
    ).toBe("make a long story short after all is\nsaid and done");

    jest.restoreAllMocks();
  });

  it("ignores bracket and parenthesis delimiters when wrapping titles", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    expect(
      formatIdiomTitleForDisplay(
        "abcde [fghij] (klmn) opqr",
        "CSAT_IDIOMS",
        48,
      ),
    ).toBe("abcde\n[fghij] (klmn) opqr");

    jest.restoreAllMocks();
  });

  it("still counts text inside brackets and parentheses when wrapping titles", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    expect(
      formatIdiomTitleForDisplay(
        "abcde [fghij] (klmnop) opqr",
        "CSAT_IDIOMS",
        48,
      ),
    ).toBe("abcde\n[fghij] (klmnop)\nopqr");

    jest.restoreAllMocks();
  });

  it("keeps short attached bracket alternatives on one title line", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    expect(
      formatIdiomTitleForDisplay("for example[instance]", "CSAT_IDIOMS", 48),
    ).toBe("for example[instance]");

    jest.restoreAllMocks();
  });

  it("does not insert breaks inside attached bracket tokens", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    expect(
      formatIdiomTitleForDisplay(
        "for example[extraordinaryinstance]",
        "CSAT_IDIOMS",
        48,
      ),
    ).toBe("for example[extraordinaryinstance]");

    jest.restoreAllMocks();
  });

  it("does not change non-idiom or adjacent-bracket titles", () => {
    expect(
      formatIdiomTitleForDisplay("in order to v [so as to v]", "TOEIC"),
    ).toBe("in order to v [so as to v]");
    expect(
      formatIdiomTitleForDisplay(
        "take A [for granted] [as given]",
        "TOEIC",
      ),
    ).toBe("take A [for granted] [as given]");
    expect(formatIdiomTitleForDisplay("word[alt]", "CSAT_IDIOMS")).toBe(
      "word[alt]",
    );
    expect(formatIdiomTitleForDisplay("[a][b]", "CSAT_IDIOMS")).toBe("[a][b]");
    expect(
      formatIdiomTitleForDisplay(
        "be angry with[at] + 사람 / about[at] + 사물",
        "TOEIC",
      ),
    ).toBe("be angry with[at] + 사람 / about[at] + 사물");
    expect(formatIdiomTitleForDisplay("and/or", "CSAT_IDIOMS")).toBe("and/or");
    expect(
      formatIdiomTitleForDisplay(
        "make a long story short after all is said and done",
        "TOEIC",
      ),
    ).toBe("make a long story short after all is said and done");
  });

  it("returns flexible font sizes for longer idioms", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    expect(getIdiomTitleFontSize("break the ice", "CSAT_IDIOMS", 32)).toBe(32);
    expect(
      getIdiomTitleFontSize("once in a blue moon", "CSAT_IDIOMS", 32),
    ).toBeLessThan(32);
    expect(
      getIdiomTitleFontSize(
        "a blessing in disguise indeed",
        "CSAT_IDIOMS",
        32,
      ),
    ).toBeLessThan(
      getIdiomTitleFontSize("once in a blue moon", "CSAT_IDIOMS", 32),
    );
    expect(
      getIdiomTitleFontSize(
        "this idiom title is intentionally long enough to hit the minimum font size clamp",
        "CSAT_IDIOMS",
        48,
      ),
    ).toBe(32);
    expect(
      getIdiomTitleFontSize(
        "this idiom title is intentionally long enough to hit the word bank minimum font size clamp",
        "CSAT_IDIOMS",
        22,
      ),
    ).toBe(16);
    expect(
      getIdiomTitleFontSize(
        "antidisestablishmentarianism",
        "EXTREMELY_ADVANCED",
        32,
      ),
    ).toBeLessThan(32);
    expect(getIdiomTitleFontSize("abandon", "TOEIC", 32)).toBe(32);

    jest.restoreAllMocks();
  });
});
