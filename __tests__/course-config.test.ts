import {
  COURSES,
  ENGLISH_COURSES,
  getTopLevelCoursesForLanguage,
} from "../src/types/vocabulary";
import {
  getDebugTotalDaysCourses,
  getQuizCoursesForLanguage,
} from "../components/dashboard/constants/quizConfig";

describe("course configuration", () => {
  it("places English courses in the configured top-level order", () => {
    expect(ENGLISH_COURSES).toEqual([
      "수능",
      "CSAT_IDIOMS",
      "TOEIC",
      "TOEFL_IELTS",
      "EXTREMELY_ADVANCED",
      "COLLOCATION",
    ]);
    expect(COURSES.map((course) => course.id)).toEqual([
      "수능",
      "CSAT_IDIOMS",
      "TOEIC",
      "TOEFL_IELTS",
      "EXTREMELY_ADVANCED",
      "COLLOCATION",
      "JLPT",
    ]);
  });

  it("returns English courses in top-level course lists and pop quiz config", () => {
    expect(getTopLevelCoursesForLanguage("en").map((course) => course.id)).toEqual([
      "수능",
      "CSAT_IDIOMS",
      "TOEIC",
      "TOEFL_IELTS",
      "EXTREMELY_ADVANCED",
      "COLLOCATION",
    ]);
    expect(getQuizCoursesForLanguage("en").map(({ id }) => id)).toEqual([
      "수능",
      "CSAT_IDIOMS",
      "TOEIC",
      "TOEFL_IELTS",
      "EXTREMELY_ADVANCED",
      "COLLOCATION",
    ]);
    expect(getDebugTotalDaysCourses("en")).toContain("CSAT_IDIOMS");
    expect(getDebugTotalDaysCourses("en")).toContain("EXTREMELY_ADVANCED");
  });
});
