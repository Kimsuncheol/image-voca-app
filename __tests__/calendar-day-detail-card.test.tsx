import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { CalendarDayDetailCard } from "../components/calendar/CalendarDayDetailCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "calendar.detail.studiedCourses") return "Studied courses";
      if (key === "calendar.detail.loadingStudiedCourses") {
        return "Loading studied courses...";
      }
      if (key === "calendar.detail.noStudiedCourses") {
        return "No completed vocabulary day recorded for this date.";
      }
      if (key === "calendar.detail.wordsProgress") {
        return `${options?.learned} / ${options?.total} words`;
      }
      if (key === "calendar.detail.dayLabel") {
        return `Day ${options?.count}`;
      }
      if (key === "courses.toeflIelts.title") return "TOEFL / IELTS";
      return options?.defaultValue ?? key;
    },
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, ...props }: { children: React.ReactNode }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text {...props}>{children}</Text>;
  },
}));

describe("CalendarDayDetailCard", () => {
  const entry = {
    courseId: "TOEFL_IELTS" as const,
    dayNumber: 1,
    wordsLearned: 20,
    totalWords: 20,
    completedAt: "2026-04-08T00:00:00.000Z",
  };

  it("calls onPressVocabularyDay with the tapped entry", () => {
    const onPressVocabularyDay = jest.fn();
    const screen = render(
      <CalendarDayDetailCard
        title="April 8, 2026"
        contributedToStreak
        vocabularyDays={[entry]}
        isHistoryLoading={false}
        onPressVocabularyDay={onPressVocabularyDay}
      />,
    );

    fireEvent.press(screen.getByRole("button"));

    expect(onPressVocabularyDay).toHaveBeenCalledWith(entry);
  });

  it("keeps loading and empty states non-interactive", () => {
    const onPressVocabularyDay = jest.fn();
    const loadingScreen = render(
      <CalendarDayDetailCard
        title="April 8, 2026"
        contributedToStreak={false}
        vocabularyDays={[]}
        isHistoryLoading
        onPressVocabularyDay={onPressVocabularyDay}
      />,
    );

    expect(loadingScreen.getByText("Loading studied courses...")).toBeTruthy();
    expect(loadingScreen.queryAllByRole("button")).toHaveLength(0);

    loadingScreen.rerender(
      <CalendarDayDetailCard
        title="April 8, 2026"
        contributedToStreak={false}
        vocabularyDays={[]}
        isHistoryLoading={false}
        onPressVocabularyDay={onPressVocabularyDay}
      />,
    );

    expect(
      loadingScreen.getByText("No completed vocabulary day recorded for this date."),
    ).toBeTruthy();
    expect(loadingScreen.queryAllByRole("button")).toHaveLength(0);
  });
});
