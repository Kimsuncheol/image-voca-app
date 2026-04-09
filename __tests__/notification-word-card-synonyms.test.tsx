import { render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import WordCard from "../components/notification/WordCard";
import { NotificationWordCardPayload } from "../src/types/notificationCard";

jest.mock("../components/CollocationFlipCard/SpeakerButton", () => ({
  __esModule: true,
  SpeakerButton: () => null,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
    i18n: {
      language: "en",
    },
  }),
}));

describe("Notification WordCard synonyms", () => {
  function buildData(
    overrides: Partial<NotificationWordCardPayload> = {},
  ): NotificationWordCardPayload {
    return {
      type: "pop_word",
      cardKind: "word",
      course: "TOEFL_IELTS",
      word: "abandon",
      meaning: "to leave behind",
      pronunciation: "/əˈbændən/",
      example: "They abandoned the plan.",
      translation: "그들은 계획을 포기했다.",
      synonyms: ["discard", " leave ", "", "forsake"],
      ...overrides,
    };
  }

  it("renders synonyms below translation for TOEFL_IELTS payloads", () => {
    const { getByText, getByTestId } = render(<WordCard data={buildData()} />);

    expect(getByText("Translation")).toBeTruthy();
    expect(getByText("Synonyms")).toBeTruthy();
    expect(getByText("discard, leave, forsake")).toBeTruthy();
    expect(getByTestId("notification-word-card-synonyms")).toHaveStyle({
      fontSize: 15,
      color: "#0F172A",
    });
  });

  it("does not render synonyms for non-TOEFL_IELTS payloads", () => {
    const { queryByText } = render(
      <WordCard data={buildData({ course: "TOEIC" })} />,
    );

    expect(queryByText("Synonyms")).toBeNull();
    expect(queryByText("discard, leave, forsake")).toBeNull();
  });

  it("formats idiom meanings onto separate lines and scales long idiom titles", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <WordCard
        data={buildData({
          course: "CSAT_IDIOMS",
          word: "once in a blue moon",
          meaning: "1. 아주 드물게 2. 거의 하지 않게",
          synonyms: undefined,
        })}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();
    expect(queryByTestId("inline-meaning-pos-column-1")).toBeNull();

    const titleStyle = StyleSheet.flatten(
      getByTestId("notification-word-title").props.style,
    );
    expect(titleStyle.fontSize).toBeLessThan(28);
  });
});
