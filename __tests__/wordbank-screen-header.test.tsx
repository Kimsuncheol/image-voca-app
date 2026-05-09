import { render } from "@testing-library/react-native";
import React from "react";
import { Text as MockText, View as MockView } from "react-native";

import WordBankScreen from "../app/(tabs)/wordbank";

const mockPush = jest.fn();
const mockLearningLanguage = { current: "ja" as "en" | "ja" };

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../components/ads/TopBannerAd", () => ({
  TopBannerAd: () => <MockView testID="top-banner-ad" />,
}));

jest.mock("../components/wordbank", () => ({
  WordBankCourseGrid: ({
    courses,
  }: {
    courses: { id: string; title: string }[];
  }) => (
    <MockView testID="word-bank-course-grid">
      {courses.map((course) => (
        <MockText key={course.id}>{course.title}</MockText>
      ))}
    </MockView>
  ),
  WordBankHeader: ({ rightAction }: { rightAction?: React.ReactNode }) => (
    <MockView>
      <MockText>Word Bank</MockText>
      <MockView testID="word-bank-header-right-action">{rightAction}</MockView>
    </MockView>
  ),
}));

jest.mock("../src/hooks/useStudyMode", () => ({
  StudyModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: mockLearningLanguage.current,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/components/common/EyeComfortHeaderButton", () => ({
  EyeComfortHeaderButton: () => (
    <MockText testID="eye-comfort-header-button">Aa</MockText>
  ),
}));

jest.mock("../src/components/common/LanguageHeaderButton", () => ({
  LanguageHeaderButton: () => (
    <MockText testID="language-header-button">language</MockText>
  ),
}));

describe("WordBankScreen header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLearningLanguage.current = "ja";
  });

  it("keeps modal triggers out of the main Japanese word bank header", () => {
    const screen = render(<WordBankScreen />);

    expect(screen.getByTestId("word-bank-course-grid")).toBeTruthy();
    expect(screen.queryByTestId("language-header-button")).toBeNull();
    expect(screen.queryByTestId("eye-comfort-header-button")).toBeNull();
  });

  it("keeps modal triggers out of the main non-Japanese word bank header", () => {
    mockLearningLanguage.current = "en";

    const screen = render(<WordBankScreen />);

    expect(screen.getByTestId("word-bank-course-grid")).toBeTruthy();
    expect(screen.queryByTestId("language-header-button")).toBeNull();
    expect(screen.queryByTestId("eye-comfort-header-button")).toBeNull();
  });
});
