import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { CourseCard } from "../components/course/CourseCard";
import { JlptLevelCard } from "../components/course/JlptLevelCard";
import { JLPT_LEVELS, RuntimeCourse } from "../src/types/vocabulary";

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      key === "common.completed"
        ? "Completed"
        : (options?.defaultValue ?? key),
  }),
}));

jest.mock("../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: { children: React.ReactNode }) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

const course: RuntimeCourse = {
  id: "TOEIC",
  title: "Basic",
  titleKey: "courses.basic.title",
  description: "Basic vocabulary",
  descriptionKey: "courses.basic.description",
  icon: "book-outline",
  color: "#007AFF",
  wordCount: 10,
};

describe("completed course cards", () => {
  it("renders a completed stamp on course cards while keeping press enabled", () => {
    const onPress = jest.fn();
    const screen = render(
      <CourseCard course={course} onPress={onPress} isCompleted />,
    );

    expect(screen.getByTestId("course-card-completed-TOEIC")).toBeTruthy();

    fireEvent.press(screen.getByText("Basic"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a completed stamp on JLPT level cards while keeping press enabled", () => {
    const onPress = jest.fn();
    const level = JLPT_LEVELS[0];
    const screen = render(
      <JlptLevelCard level={level} onPress={onPress} isCompleted />,
    );

    expect(screen.getByTestId("jlpt-level-completed-JLPT_N1")).toBeTruthy();

    fireEvent.press(screen.getAllByText("N1")[0]);

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
