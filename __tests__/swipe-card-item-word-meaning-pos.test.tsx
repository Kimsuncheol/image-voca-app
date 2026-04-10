import { render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { SwipeCardItemWordMeaningSection } from "../components/swipe/SwipeCardItemWordMeaningSection";
import { VocabularyCard } from "../src/types/vocabulary";

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: jest.fn(),
  }),
}));

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => null,
}));

function buildItem(): VocabularyCard {
  return {
    id: "1",
    word: "seed",
    meaning: "n. 씨, 씨앗",
    example: "A farmer is sowing seeds in the field.",
    course: "TOEIC",
  };
}

describe("SwipeCardItemWordMeaningSection", () => {
  it("renders inline chips for later markers in the same line", () => {
    const { getByText, queryByText } = render(
      <SwipeCardItemWordMeaningSection
        item={buildItem()}
        word="sparkle"
        meaning="n. 불꽃, 번쩍임 v. 번쩍이다."
        isDark={false}
      />,
    );

    expect(getByText("n")).toBeTruthy();
    expect(getByText("v")).toBeTruthy();
    expect(getByText(" 불꽃, 번쩍임 ")).toBeTruthy();
    expect(getByText(" 번쩍이다.")).toBeTruthy();
    expect(queryByText("n.")).toBeNull();
    expect(queryByText("v.")).toBeNull();
  });

  it("preserves numbered prefixes while converting line markers to chips", () => {
    const { getByText, queryByText } = render(
      <SwipeCardItemWordMeaningSection
        item={buildItem()}
        word="reason"
        meaning={"1. n. 이유\n2. v. 추론하다, 추리하다"}
        isDark={false}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("n")).toBeTruthy();
    expect(getByText("v")).toBeTruthy();
    expect(getByText(" 이유")).toBeTruthy();
    expect(getByText(" 추론하다, 추리하다")).toBeTruthy();
    expect(queryByText("n. 이유")).toBeNull();
    expect(queryByText("v. 추론하다, 추리하다")).toBeNull();
  });

  it("renders '='-separated word variants as trimmed stacked lines", () => {
    const { getByText, queryByText } = render(
      <SwipeCardItemWordMeaningSection
        item={buildItem()}
        word=" connection flight  = connecting flight =  connection "
        meaning="n. 연결"
        isDark={false}
      />,
    );

    expect(getByText("connection flight")).toBeTruthy();
    expect(getByText("connecting flight")).toBeTruthy();
    expect(getByText("connection")).toBeTruthy();
    expect(
      queryByText(" connection flight  = connecting flight =  connection "),
    ).toBeNull();
    expect(queryByText(/=/)).toBeNull();
  });

  it("keeps a plain word as a single title", () => {
    const { getByText, queryByText } = render(
      <SwipeCardItemWordMeaningSection
        item={buildItem()}
        word="abandon"
        meaning="to leave behind"
        isDark={false}
      />,
    );

    expect(getByText("abandon")).toBeTruthy();
    expect(queryByText(/=/)).toBeNull();
  });

  it("formats numbered idiom meanings onto separate lines and scales long titles", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <SwipeCardItemWordMeaningSection
        item={{
          ...buildItem(),
          course: "CSAT_IDIOMS",
        }}
        word="once in a blue moon"
        meaning="1. 아주 드물게 2. 거의 하지 않게"
        isDark={false}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("아주 드물게")).toBeTruthy();
    expect(getByText("거의 하지 않게")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();
    expect(queryByTestId("inline-meaning-pos-column-1")).toBeNull();

    const titleStyle = StyleSheet.flatten(
      getByTestId("swipe-card-word-title").props.style,
    );
    expect(titleStyle.fontSize).toBeLessThan(32);
  });

  it("formats numbered extremely advanced meanings and scales long titles", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <SwipeCardItemWordMeaningSection
        item={{
          ...buildItem(),
          course: "EXTREMELY_ADVANCED",
        }}
        word="antidisestablishmentarianism"
        meaning="1. 정교분리 반대론 2. 긴 단어"
        isDark={false}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("정교분리 반대론")).toBeTruthy();
    expect(getByText("긴 단어")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();

    const titleStyle = StyleSheet.flatten(
      getByTestId("swipe-card-word-title").props.style,
    );
    expect(titleStyle.fontSize).toBeLessThan(32);
  });
});
