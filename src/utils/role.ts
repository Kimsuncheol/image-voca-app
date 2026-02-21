import type { UserRole } from "../types/member";

/**
 * Normalizes persisted user roles.
 * Legacy "teacher" and unknown values are treated as "student".
 */
export const normalizeUserRole = (role: unknown): UserRole => {
  if (typeof role === "string" && role.includes("admin")) {
    return "admin";
  }
  return "student";
};
