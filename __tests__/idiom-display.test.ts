import {
  formatIdiomMeaningForDisplay,
  getIdiomTitleFontSize,
} from "../src/utils/idiomDisplay";

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

  it("returns smaller font sizes for longer idioms", () => {
    expect(getIdiomTitleFontSize("break the ice", "CSAT_IDIOMS", 32)).toBe(32);
    expect(getIdiomTitleFontSize("once in a blue moon", "CSAT_IDIOMS", 32)).toBe(
      29,
    );
    expect(
      getIdiomTitleFontSize(
        "a blessing in disguise indeed",
        "CSAT_IDIOMS",
        32,
      ),
    ).toBe(22);
    expect(
      getIdiomTitleFontSize(
        "antidisestablishmentarianism",
        "EXTREMELY_ADVANCED",
        32,
      ),
    ).toBe(22);
    expect(getIdiomTitleFontSize("abandon", "TOEIC", 32)).toBe(32);
  });
});
