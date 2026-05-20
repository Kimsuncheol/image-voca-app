import {
  isCourseFullyCompleted,
  isJlptParentCompleted,
} from "../src/utils/courseCompletion";

describe("course completion helpers", () => {
  it("returns false when total days is zero", () => {
    expect(isCourseFullyCompleted({}, 0)).toBe(false);
  });

  it("returns false when any day is missing or incomplete", () => {
    expect(
      isCourseFullyCompleted(
        {
          1: { completed: true },
          2: { completed: false },
          3: { completed: true },
        },
        3,
      ),
    ).toBe(false);
    expect(isCourseFullyCompleted({ 1: { completed: true } }, 2)).toBe(false);
  });

  it("returns true when every day is completed", () => {
    expect(
      isCourseFullyCompleted(
        {
          1: { completed: true },
          2: { completed: true },
          3: { completed: true },
        },
        3,
      ),
    ).toBe(true);
  });

  it("marks JLPT parent complete only when every level is complete", () => {
    expect(isJlptParentCompleted({ JLPT_N1: true, JLPT_N2: true })).toBe(true);
    expect(isJlptParentCompleted({ JLPT_N1: true, JLPT_N2: false })).toBe(
      false,
    );
    expect(isJlptParentCompleted({})).toBe(false);
  });
});
