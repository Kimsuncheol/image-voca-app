import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { AllCoursesSection } from "../components/course/AllCoursesSection";
import type { Course } from "../src/types/vocabulary";

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

jest.mock("../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
    }) => <Text {...props}>{children}</Text>,
  };
});

const courses: Course[] = [
  {
    id: "TOEIC",
    title: "TOEIC",
    titleKey: "courses.toeic.title",
    description: "Business English",
    descriptionKey: "courses.toeic.description",
    icon: "book-outline",
    color: "#007AFF",
    wordCount: 10,
  },
  {
    id: "TOEFL_IELTS",
    title: "TOEFL IELTS",
    titleKey: "courses.toeflIelts.title",
    description: "Academic English",
    descriptionKey: "courses.toeflIelts.description",
    icon: "school-outline",
    color: "#34C759",
    wordCount: 20,
  },
  {
    id: "COLLOCATION",
    title: "Collocations",
    titleKey: "courses.collocation.title",
    description: "Natural phrases",
    descriptionKey: "courses.collocation.description",
    icon: "library-outline",
    color: "#FF9500",
    wordCount: 30,
  },
];

describe("AllCoursesSection", () => {
  it("renders course cards in a two-column grid and keeps interactions", () => {
    const onCoursePress = jest.fn();
    const screen = render(
      <AllCoursesSection
        courses={courses}
        completedCourseIds={{ TOEIC: true }}
        onCoursePress={onCoursePress}
      />,
    );

    expect(
      StyleSheet.flatten(
        screen.getByTestId("wordbank-course-grid").props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        flexDirection: "row",
        flexWrap: "wrap",
      }),
    );

    courses.forEach((course) => {
      expect(screen.getByText(course.title)).toBeTruthy();
      expect(
        StyleSheet.flatten(
          screen.getByTestId(`wordbank-course-card-${course.id}`).props.style,
        ),
      ).toEqual(
        expect.objectContaining({
          width: "47%",
          alignItems: "center",
        }),
      );
    });

    expect(screen.getByTestId("course-card-completed-TOEIC")).toBeTruthy();

    fireEvent.press(screen.getByTestId("wordbank-course-card-TOEFL_IELTS"));

    expect(onCoursePress).toHaveBeenCalledTimes(1);
    expect(onCoursePress).toHaveBeenCalledWith(courses[1]);
  });
});
