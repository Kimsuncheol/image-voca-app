import {
  stripRoleLabels,
  toDialogueTurns,
} from "../src/utils/roleplayUtils";

describe("roleplayUtils", () => {
  test("toDialogueTurns parses roleplay text into ordered turns", () => {
    const text =
      "Jane: 난 해변에 가고 싶은데, 남자 친구는 산에 가고 싶어 해. Michelle: 서로 좀 양보하지 그래? Jane: 좋은 생각이네.";

    expect(toDialogueTurns(text)).toEqual([
      { role: "Jane", text: "난 해변에 가고 싶은데, 남자 친구는 산에 가고 싶어 해." },
      { role: "Michelle", text: "서로 좀 양보하지 그래?" },
      { role: "Jane", text: "좋은 생각이네." },
    ]);
  });

  test("toDialogueTurns keeps plain text as a single turn", () => {
    const text = "This is a plain example sentence.";

    expect(toDialogueTurns(text)).toEqual([
      { role: null, text: "This is a plain example sentence." },
    ]);
  });

  test("stripRoleLabels removes role names and keeps text lines", () => {
    const text = "Jane: 첫 번째 문장. Michelle: 두 번째 문장.";

    expect(stripRoleLabels(text)).toBe("첫 번째 문장.\n두 번째 문장.");
  });

  test("stripRoleLabels returns original content for non-role text", () => {
    const text = "역할 이름 없이 한 줄 번역입니다.";

    expect(stripRoleLabels(text)).toBe("역할 이름 없이 한 줄 번역입니다.");
  });
});
