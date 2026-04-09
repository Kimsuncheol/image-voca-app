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
  it("places CSAT idioms immediately after CSAT in English course ordering", () => {
    expect(ENGLISH_COURSES).toEqual([
      "수능",
      "CSAT_IDIOMS",
      "TOEIC",
      "TOEFL_IELTS",
      "COLLOCATION",
    ]);
    expect(COURSES.map((course) => course.id)).toEqual([
      "수능",
      "CSAT_IDIOMS",
      "TOEIC",
      "TOEFL_IELTS",
      "COLLOCATION",
      "JLPT",
    ]);
  });

  it("returns CSAT idioms in top-level English course lists and pop quiz config", () => {
    expect(getTopLevelCoursesForLanguage("en").map((course) => course.id)).toEqual([
      "수능",
      "CSAT_IDIOMS",
      "TOEIC",
      "TOEFL_IELTS",
      "COLLOCATION",
    ]);
    expect(getQuizCoursesForLanguage("en").map(({ id }) => id)).toEqual([
      "수능",
      "CSAT_IDIOMS",
      "COLLOCATION",
      "TOEIC",
      "TOEFL_IELTS",
    ]);
    expect(getDebugTotalDaysCourses("en")).toContain("CSAT_IDIOMS");
  });
});
