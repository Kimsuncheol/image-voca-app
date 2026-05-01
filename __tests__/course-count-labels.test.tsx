import { render } from "@testing-library/react-native";
import React from "react";

import { DayCard } from "../components/course/DayCard";
import { WordBankCourseGrid } from "../components/wordbank/WordBankCourseGrid";
import { COURSES } from "../src/types/vocabulary";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock("../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: { children: React.ReactNode }) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) => {
      const table: Record<string, string> = {
        "course.dayTitle": `Day ${options?.day}`,
        "course.wordCount": `${options?.count} words`,
        "course.checked": "Checked",
        "course.quiz": "Quiz",
        "course.retake": "Retake",
        "wordBank.wordsCount": `${options?.count} words`,
      };

      return table[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

describe("course count labels", () => {
  it("does not render the day card word count", () => {
    const screen = render(
      <DayCard
        day={1}
        progress={{
          completed: true,
          totalWords: 20,
        }}
        isLocked={false}
        courseColor="#007AFF"
        onDayPress={jest.fn()}
        onQuizPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Day 1")).toBeTruthy();
    expect(screen.getByText("Checked")).toBeTruthy();
    expect(screen.queryByText("20 words")).toBeNull();
  });

  it("does not render word-bank course saved-word counts", () => {
    const screen = render(
      <WordBankCourseGrid courses={[COURSES[0]]} onCoursePress={jest.fn()} />,
    );

    expect(screen.getByText(COURSES[0].title)).toBeTruthy();
    expect(screen.getByText(COURSES[0].description)).toBeTruthy();
    expect(screen.queryByText("3 words")).toBeNull();
  });
});
