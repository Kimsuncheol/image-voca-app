import { render } from "@testing-library/react-native";
import React from "react";
import { SwipeCardItem } from "../components/swipe/SwipeCardItem";
import { VocabularyCard } from "../src/types/vocabulary";

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: jest.fn(),
  }),
}));

jest.mock("../components/swipe/SwipeCardItemImageSection", () => ({
  __esModule: true,
  SwipeCardItemImageSection: () => {
    const React = require("react");
    const { View } = require("react-native");
    return <View testID="mock-image-section" />;
  },
}));

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => {
    const React = require("react");
    const { View } = require("react-native");
    return <View testID="mock-add-button" />;
  },
}));

jest.mock("../components/swipe/SwipeCardItemExampleSentenceSection", () => ({
  __esModule: true,
  SwipeCardItemExampleSentenceSection: () => {
    const React = require("react");
    const { View } = require("react-native");
    return <View testID="mock-example-section" />;
  },
}));

function buildCard(overrides: Partial<VocabularyCard> = {}): VocabularyCard {
  return {
    id: "1",
    word: "abandon",
    meaning: "to leave behind",
    pronunciation: "/əˈbæn.dən/",
    example: "They had to abandon the plan.",
    translation: "그들은 그 계획을 포기해야 했다.",
    course: "TOEIC",
    ...overrides,
  };
}

describe("SwipeCardItem pronunciation", () => {
  it("renders pronunciation below the word when provided", () => {
    const { getByText } = render(<SwipeCardItem item={buildCard()} />);

    expect(getByText("abandon")).toBeTruthy();
    expect(getByText("/əˈbæn.dən/")).toBeTruthy();
    expect(getByText("to leave behind")).toBeTruthy();
  });

  it("hides the pronunciation row when the value is empty", () => {
    const { queryByText } = render(
      <SwipeCardItem item={buildCard({ pronunciation: "   " })} />,
    );

    expect(queryByText("/əˈbæn.dən/")).toBeNull();
  });
});
