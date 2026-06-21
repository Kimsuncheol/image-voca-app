import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";

import { CourseType } from "../../../src/types/vocabulary";

export default function QuizTypeSelectionScreen() {
  const { courseId, day } = useLocalSearchParams<{
    courseId: CourseType;
    day: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: "/course/[courseId]/quiz-play",
        params: { courseId, day, quizType: "matching" },
      }}
    />
  );
}
