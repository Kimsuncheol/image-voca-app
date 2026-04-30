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

jest.mock("../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

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
  it("renders POS groups as separate meaning rows", () => {
    const { getByTestId, getByText, queryByText } = render(
      <SwipeCardItemWordMeaningSection
        item={buildItem()}
        word="sparkle"
        meaning="n. 불꽃, 번쩍임 v. 번쩍이다."
        isDark={false}
      />,
    );

    const firstRowStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-line-0").props.style,
    );
    const secondRowStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-line-1").props.style,
    );
    const firstTextColumnStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-text-column-0").props.style,
    );
    const secondTextColumnStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-text-column-1").props.style,
    );

    expect(getByText("n")).toBeTruthy();
    expect(getByText("v")).toBeTruthy();
    expect(getByText("불꽃, 번쩍임")).toBeTruthy();
    expect(getByText("번쩍이다.")).toBeTruthy();
    expect(queryByText("n.")).toBeNull();
    expect(queryByText("v.")).toBeNull();
    expect(queryByText("|")).toBeNull();
    expect(firstRowStyle.flexDirection).toBe("row");
    expect(secondRowStyle.flexDirection).toBe("row");
    expect(firstTextColumnStyle.flex).toBe(1);
    expect(firstTextColumnStyle.flexWrap).toBe("wrap");
    expect(secondTextColumnStyle.flex).toBe(1);
    expect(secondTextColumnStyle.flexWrap).toBe("wrap");
  });

  it("uses an 8px gap after pronunciation before the meaning", () => {
    const { getByText } = render(
      <SwipeCardItemWordMeaningSection
        item={buildItem()}
        word="seed"
        pronunciation="/siːd/"
        meaning="n. 씨, 씨앗"
        isDark={false}
      />,
    );

    const pronunciationStyle = StyleSheet.flatten(getByText("/siːd/").props.style);

    expect(pronunciationStyle.marginBottom).toBe(8);
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
    expect(getByText("이유")).toBeTruthy();
    expect(getByText("추론하다, 추리하다")).toBeTruthy();
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
        word="once in a blue moon after every unlikely circumstance"
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

    const title = getByTestId("swipe-card-word-title");
    const titleStyle = StyleSheet.flatten(title.props.style);
    expect(titleStyle.fontSize).toBeGreaterThanOrEqual(32);
    expect(titleStyle.fontSize).toBeLessThan(48);
    expect(title.props.numberOfLines).toBe(1);
    expect(title.props.adjustsFontSizeToFit).toBeUndefined();
    expect(title.props.minimumFontScale).toBeUndefined();
  });

  it("breaks bracketed CSAT idiom alternatives onto a new title line", () => {
    const { getByTestId } = render(
      <SwipeCardItemWordMeaningSection
        item={{
          ...buildItem(),
          course: "CSAT_IDIOMS",
        }}
        word="take A [for granted] [as given]"
        meaning="1. ~하기 위하여"
        isDark={false}
      />,
    );

    const title = getByTestId("swipe-card-word-title");
    const titleStyle = StyleSheet.flatten(title.props.style);
    expect(title.props.children).toBe("take A\n[for granted]\n[as given]");
    expect(titleStyle.fontSize).toBeGreaterThan(32);
    expect(titleStyle.fontSize).toBeLessThanOrEqual(48);
    expect(title.props.numberOfLines).toBeUndefined();
    expect(title.props.adjustsFontSizeToFit).toBeUndefined();
    expect(title.props.minimumFontScale).toBeUndefined();
  });

  it("formats numbered extremely advanced meanings and scales long titles", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <SwipeCardItemWordMeaningSection
        item={{
          ...buildItem(),
          course: "EXTREMELY_ADVANCED",
        }}
        word="antidisestablishmentarianism in a deliberately oversized title"
        meaning="1. 정교분리 반대론 2. 긴 단어"
        isDark={false}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("정교분리 반대론")).toBeTruthy();
    expect(getByText("긴 단어")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();

    const title = getByTestId("swipe-card-word-title");
    const titleStyle = StyleSheet.flatten(title.props.style);
    expect(titleStyle.fontSize).toBeGreaterThanOrEqual(32);
    expect(titleStyle.fontSize).toBeLessThan(48);
    expect(title.props.numberOfLines).toBe(1);
    expect(title.props.adjustsFontSizeToFit).toBeUndefined();
    expect(title.props.minimumFontScale).toBeUndefined();
  });
});
