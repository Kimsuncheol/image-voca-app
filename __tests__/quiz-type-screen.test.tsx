import { render } from "@testing-library/react-native";
import React from "react";
import QuizTypeSelectionScreen from "../app/course/[courseId]/quiz-type";

const mockRedirect = jest.fn();

jest.mock("expo-router", () => ({
  Redirect: (props: unknown) => {
    mockRedirect(props);
    return null;
  },
  useLocalSearchParams: () => ({
    courseId: "TOEFL_IELTS",
    day: "1",
  }),
}));

describe("QuizTypeSelectionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects stale quiz-type links to standard matching play", () => {
    render(<QuizTypeSelectionScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({
      href: {
        pathname: "/course/[courseId]/quiz-play",
        params: {
          courseId: "TOEFL_IELTS",
          day: "1",
          quizType: "matching",
        },
      },
    });
  });
});
