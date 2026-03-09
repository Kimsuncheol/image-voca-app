import { parseMeaningPartsOfSpeech } from "../src/utils/meaningPartsOfSpeech";

describe("parseMeaningPartsOfSpeech", () => {
  it("parses multiple inline part-of-speech markers in one line", () => {
    expect(parseMeaningPartsOfSpeech("n. 불꽃, 번쩍임 v. 번쩍이다.")).toEqual({
      lines: [
        {
          linePrefix: undefined,
          segments: [
            { type: "pos", value: "n" },
            { type: "text", value: " 불꽃, 번쩍임 " },
            { type: "pos", value: "v" },
            { type: "text", value: " 번쩍이다." },
          ],
        },
      ],
      hasPartsOfSpeech: true,
    });
  });

  it("preserves numbering across multiple lines", () => {
    expect(
      parseMeaningPartsOfSpeech("1. n. 이유\n2. v. 추론하다, 추리하다"),
    ).toEqual({
      lines: [
        {
          linePrefix: "1.",
          segments: [
            { type: "pos", value: "n" },
            { type: "text", value: " 이유" },
          ],
        },
        {
          linePrefix: "2.",
          segments: [
            { type: "pos", value: "v" },
            { type: "text", value: " 추론하다, 추리하다" },
          ],
        },
      ],
      hasPartsOfSpeech: true,
    });
  });

  it("keeps unsupported abbreviations as plain text", () => {
    expect(parseMeaningPartsOfSpeech("phr. 관용 표현")).toEqual({
      lines: [
        {
          linePrefix: undefined,
          segments: [{ type: "text", value: "phr. 관용 표현" }],
        },
      ],
      hasPartsOfSpeech: false,
    });
  });
});
