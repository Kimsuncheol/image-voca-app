const {
  isValidFirestoreCollectionPath,
  mapPostfixRows,
  mapPrefixRows,
  normalizeFirestoreCollectionPath,
} = require("../scripts/lib/prefixPostfixSheetImport");

describe("prefixPostfixSheetImport", () => {
  it("maps prefix sheet rows using the screenshot headers", () => {
    const rows = [
      {
        "example": "1. お名前\n2. ご案内",
        "example(roman)": "1. onamae\n2. goannai",
        "meaning(English)": "These are used to denote politeness",
        "meaning(Korean)": "공손의 의미를 나타내는 말",
        "prefix": "お / ご〜",
        "pronunciation": "1. おなまえ\n2. あのない",
        "pronunciation(Roman)": "1. o\n2. go",
        "translation(English)": "1. name\n2. information",
        "translation(Korean)": "1. 이름\n2. 안내",
      },
    ];

    expect(mapPrefixRows(rows)).toEqual([
      {
        id: "prefix-001",
        prefix: "お / ご〜",
        meaningEnglish: "These are used to denote politeness",
        meaningKorean: "공손의 의미를 나타내는 말",
        pronunciation: "1. おなまえ\n2. あのない",
        example: "1. お名前\n2. ご案内",
        translationEnglish: "1. name\n2. information",
        translationKorean: "1. 이름\n2. 안내",
      },
    ]);
  });

  it("maps postfix sheet rows using the screenshot headers and preserves multiline strings", () => {
    const rows = [
      {
        "example": "1. 会員\n2. 社員",
        "example(roman)": "1. kaiin\n2. shain",
        "id": "custom-postfix-id",
        "meaning(English)": "a person who belongs to or works in a group or organization",
        "meaning(Korean)": "~원(어떤 일을 하는 사람)",
        "postfix": "~員",
        "pronunciation": "〜いん",
        "pronunciation(Roman)": "-in",
        "translation(English)": "1. member\n2. employee or company staff",
        "translation(Korean)": "1. 회원\n2. 사원",
      },
    ];

    expect(mapPostfixRows(rows)).toEqual([
      {
        id: "custom-postfix-id",
        postfix: "~員",
        meaningEnglish: "a person who belongs to or works in a group or organization",
        meaningKorean: "~원(어떤 일을 하는 사람)",
        pronunciation: "〜いん",
        example: "1. 会員\n2. 社員",
        translationEnglish: "1. member\n2. employee or company staff",
        translationKorean: "1. 회원\n2. 사원",
      },
    ]);
  });

  it("normalizes Firestore collection paths from .env-style values", () => {
    expect(normalizeFirestoreCollectionPath("/a/b/c/")).toBe("a/b/c");
    expect(isValidFirestoreCollectionPath("/a/b/c")).toBe(true);
    expect(isValidFirestoreCollectionPath("/a/b")).toBe(false);
  });
});
