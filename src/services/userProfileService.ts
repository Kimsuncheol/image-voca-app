import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { UserRole } from "../types/userRole";
import type { CourseType, LearningLanguage } from "../types/vocabulary";

const ADMIN_EMAILS = ["benjaminadmin@example.com"];

type UserProfileOverrides = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  role?: UserRole;
  learningLanguage?: LearningLanguage;
  recentCourseByLanguage?: Partial<Record<LearningLanguage, CourseType>>;
};

type StoredUserProfile = {
  uid?: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  role?: UserRole;
  createdAt?: string;
  wordBank?: unknown[];
  recentCourse?: string | null;
  learningLanguage?: LearningLanguage;
  recentCourseByLanguage?: Partial<Record<LearningLanguage, CourseType>>;
};

export const getDefaultUserRole = (email?: string | null): UserRole =>
  email && ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "student";

export const getPrimaryAuthProvider = (user: Pick<User, "email" | "providerData">) => {
  const providerIds = (user.providerData || [])
    .map((provider) => provider?.providerId)
    .filter((providerId): providerId is string => Boolean(providerId));

  if (providerIds.includes("google.com")) return "google.com";
  if (providerIds.includes("password")) return "password";
  return user.email ? "password" : "unknown";
};

export const ensureUserProfileDocument = async (
  user: Pick<User, "uid" | "displayName" | "email" | "photoURL" | "providerData">,
  overrides: UserProfileOverrides = {},
) => {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const existing = snapshot.exists()
    ? (snapshot.data() as StoredUserProfile)
    : undefined;
  const now = new Date().toISOString();

  const displayName = overrides.displayName ?? user.displayName ?? existing?.displayName ?? "";
  const email = overrides.email ?? user.email ?? existing?.email ?? null;
  const photoURL = overrides.photoURL ?? user.photoURL ?? existing?.photoURL ?? null;

  const nextProfile = {
    uid: user.uid,
    displayName,
    email,
    photoURL,
    role: existing?.role ?? overrides.role ?? getDefaultUserRole(email),
    createdAt: existing?.createdAt ?? now,
    wordBank: Array.isArray(existing?.wordBank) ? existing.wordBank : [],
    recentCourse: existing?.recentCourse ?? null,
    learningLanguage:
      existing?.learningLanguage ?? overrides.learningLanguage ?? "en",
    recentCourseByLanguage:
      existing?.recentCourseByLanguage ?? overrides.recentCourseByLanguage ?? {},
  };

  await setDoc(userRef, nextProfile, { merge: true });
  return nextProfile;
};
