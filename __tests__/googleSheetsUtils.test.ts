import { parseSheetValues } from "../src/utils/googleSheetsUtils";

describe("parseSheetValues", () => {
  it("should throw error if input is null or has insufficient rows", () => {
    expect(() => parseSheetValues([])).toThrow("No data found");
    expect(() => parseSheetValues([["Header"]])).toThrow("No data found");
  });

  it("should correctly parse a standard sheet with headers", () => {
    const input = [
      ["Word", "Meaning", "Example"],
      ["Apple", "A fruit", "I ate an apple"],
      ["Run", "To move fast", "He runs everyday"],
    ];

    const result = parseSheetValues(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      Word: "Apple",
      Meaning: "A fruit",
      Example: "I ate an apple",
    });
    expect(result[1]).toEqual({
      Word: "Run",
      Meaning: "To move fast",
      Example: "He runs everyday",
    });
  });

  it("should handle empty cells gracefully", () => {
    const input = [
      ["Word", "Meaning"],
      ["Test", ""], // Empty meaning
    ];

    const result = parseSheetValues(input);

    expect(result[0]).toEqual({
      Word: "Test",
      Meaning: "",
    });
  });

  it("should handle rows shorter than headers", () => {
    const input = [
      ["Word", "Meaning", "Extra"],
      ["Short", "Row"], // Missing 'Extra'
    ];

    const result = parseSheetValues(input);

    expect(result[0]).toEqual({
      Word: "Short",
      Meaning: "Row",
      Extra: "", // Should be empty string, undefined became empty string in util
    });
  });

  it("should trim header names", () => {
    const input = [
      [" Word ", " Meaning "],
      ["A", "B"],
    ];

    const result = parseSheetValues(input);
    expect(result[0]).toHaveProperty("Word"); // Not " Word "
    expect(result[0]).toHaveProperty("Meaning");
    expect(result[0].Word).toBe("A");
  });
});
