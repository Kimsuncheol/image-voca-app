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
  tutorialCompletedAt?: string | null;
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
  tutorialCompletedAt?: string | null;
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
    tutorialCompletedAt:
      existing?.tutorialCompletedAt ?? overrides.tutorialCompletedAt ?? null,
  };

  await setDoc(userRef, nextProfile, { merge: true });
  return nextProfile;
};

export const getHasCompletedTutorial = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return false;
  }

  const data = snapshot.data() as StoredUserProfile;
  return typeof data.tutorialCompletedAt === "string" &&
    data.tutorialCompletedAt.length > 0;
};

export const markTutorialCompleted = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const tutorialCompletedAt = new Date().toISOString();
  await setDoc(userRef, { tutorialCompletedAt }, { merge: true });
  return tutorialCompletedAt;
};
