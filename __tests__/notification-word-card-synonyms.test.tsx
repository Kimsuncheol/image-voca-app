import { render } from "@testing-library/react-native";
import React from "react";
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
});
