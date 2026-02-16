import { normalizeUserRole } from "../src/utils/role";

describe("normalizeUserRole", () => {
  test("returns admin for admin role", () => {
    expect(normalizeUserRole("admin")).toBe("admin");
  });

  test("returns student for student role", () => {
    expect(normalizeUserRole("student")).toBe("student");
  });

  test("maps legacy teacher role to student", () => {
    expect(normalizeUserRole("teacher")).toBe("student");
  });

  test("maps unknown role to student", () => {
    expect(normalizeUserRole("something-else")).toBe("student");
  });

  test("maps missing role to student", () => {
    expect(normalizeUserRole(undefined)).toBe("student");
  });
});
