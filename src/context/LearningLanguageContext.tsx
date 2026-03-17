import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { db } from "../services/firebase";
import {
  CourseType,
  LearningLanguage,
  getLearningLanguageForCourse,
  isCourseAvailableForLanguage,
} from "../types/vocabulary";

export const LEARNING_LANGUAGE_STORAGE_KEY = "@learningLanguage";
export const RECENT_COURSE_BY_LANGUAGE_STORAGE_KEY = "@recentCourseByLanguage";
export const LEGACY_LEARNING_LANGUAGES_KEY = "@learningLanguages";
export const RECENT_COURSE_STORAGE_KEY = "recentCourse";

const AVAILABLE_LANGUAGES: LearningLanguage[] = ["en", "ja"];

type RecentCourseByLanguage = Partial<Record<LearningLanguage, CourseType>>;

interface LearningLanguageContextValue {
  learningLanguage: LearningLanguage;
  setLearningLanguage: (language: LearningLanguage) => Promise<void>;
  availableLanguages: LearningLanguage[];
  recentCourseByLanguage: RecentCourseByLanguage;
  setRecentCourseForLanguage: (
    language: LearningLanguage,
    courseId: CourseType,
  ) => Promise<void>;
  isReady: boolean;
}

const LearningLanguageContext = createContext<LearningLanguageContextValue>({
  learningLanguage: "en",
  setLearningLanguage: async () => {},
  availableLanguages: AVAILABLE_LANGUAGES,
  recentCourseByLanguage: {},
  setRecentCourseForLanguage: async () => {},
  isReady: false,
});

const isLearningLanguage = (value: unknown): value is LearningLanguage =>
  value === "en" || value === "ja";

const normalizeLearningLanguage = (
  value: unknown,
): LearningLanguage | undefined => (isLearningLanguage(value) ? value : undefined);

const migrateLegacyLearningLanguages = (
  value: string | null,
): LearningLanguage | undefined => {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    if (parsed.includes("ja") && !parsed.includes("en")) return "ja";
    if (parsed.includes("en")) return "en";
  } catch (error) {
    console.warn("Failed to parse legacy learning languages", error);
  }

  return undefined;
};

const normalizeRecentCourseByLanguage = (
  value: unknown,
): RecentCourseByLanguage => {
  if (!value || typeof value !== "object") return {};

  return (Object.entries(value) as [string, unknown][]).reduce<RecentCourseByLanguage>(
    (acc, [language, courseId]) => {
      const normalizedLanguage = normalizeLearningLanguage(language);
      if (
        normalizedLanguage &&
        typeof courseId === "string" &&
        isCourseAvailableForLanguage(courseId, normalizedLanguage)
      ) {
        acc[normalizedLanguage] = courseId as CourseType;
      }
      return acc;
    },
    {},
  );
};

const withLegacyRecentCourse = (
  recentCourseByLanguage: RecentCourseByLanguage,
  legacyRecentCourse: string | null | undefined,
) => {
  if (!legacyRecentCourse) return recentCourseByLanguage;

  const language = getLearningLanguageForCourse(legacyRecentCourse);
  if (!language || recentCourseByLanguage[language]) {
    return recentCourseByLanguage;
  }

  return {
    ...recentCourseByLanguage,
    [language]: legacyRecentCourse as CourseType,
  };
};

const readLocalPreferences = async () => {
  const [storedLanguage, legacyLanguages, storedRecentCourseByLanguage, legacyRecentCourse] =
    await Promise.all([
      AsyncStorage.getItem(LEARNING_LANGUAGE_STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_LEARNING_LANGUAGES_KEY),
      AsyncStorage.getItem(RECENT_COURSE_BY_LANGUAGE_STORAGE_KEY),
      AsyncStorage.getItem(RECENT_COURSE_STORAGE_KEY),
    ]);

  const learningLanguage =
    normalizeLearningLanguage(storedLanguage) ??
    migrateLegacyLearningLanguages(legacyLanguages) ??
    "en";

  let recentCourseByLanguage: RecentCourseByLanguage = {};
  if (storedRecentCourseByLanguage) {
    try {
      recentCourseByLanguage = normalizeRecentCourseByLanguage(
        JSON.parse(storedRecentCourseByLanguage),
      );
    } catch (error) {
      console.warn("Failed to parse stored recent course map", error);
    }
  }

  return {
    learningLanguage,
    recentCourseByLanguage: withLegacyRecentCourse(
      recentCourseByLanguage,
      legacyRecentCourse,
    ),
  };
};

export const useLearningLanguage = () => useContext(LearningLanguageContext);

export function LearningLanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [learningLanguage, setLearningLanguageState] =
    useState<LearningLanguage>("en");
  const [recentCourseByLanguage, setRecentCourseByLanguageState] =
    useState<RecentCourseByLanguage>({});
  const [hasLocalHydrated, setHasLocalHydrated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const learningLanguageRef = useRef<LearningLanguage>("en");
  const recentCourseByLanguageRef = useRef<RecentCourseByLanguage>({});

  useEffect(() => {
    learningLanguageRef.current = learningLanguage;
  }, [learningLanguage]);

  useEffect(() => {
    recentCourseByLanguageRef.current = recentCourseByLanguage;
  }, [recentCourseByLanguage]);

  const persistLocalPreferences = useCallback(
    async (
      nextLanguage: LearningLanguage,
      nextRecentCourseByLanguage: RecentCourseByLanguage,
    ) => {
      await Promise.all([
        AsyncStorage.setItem(LEARNING_LANGUAGE_STORAGE_KEY, nextLanguage),
        AsyncStorage.setItem(
          RECENT_COURSE_BY_LANGUAGE_STORAGE_KEY,
          JSON.stringify(nextRecentCourseByLanguage),
        ),
        AsyncStorage.removeItem(LEGACY_LEARNING_LANGUAGES_KEY),
      ]);
    },
    [],
  );

  useEffect(() => {
    let isActive = true;

    const hydrateLocalPreferences = async () => {
      try {
        const localState = await readLocalPreferences();
        if (!isActive) return;

        setLearningLanguageState(localState.learningLanguage);
        setRecentCourseByLanguageState(localState.recentCourseByLanguage);
        await persistLocalPreferences(
          localState.learningLanguage,
          localState.recentCourseByLanguage,
        );
      } catch (error) {
        console.warn("Failed to hydrate learning language preferences", error);
      } finally {
        if (isActive) {
          setHasLocalHydrated(true);
        }
      }
    };

    void hydrateLocalPreferences();

    return () => {
      isActive = false;
    };
  }, [persistLocalPreferences]);

  useEffect(() => {
    if (!hasLocalHydrated || authLoading) {
      return;
    }

    let isActive = true;

    const hydrateRemotePreferences = async () => {
      if (!user) {
        setIsReady(true);
        return;
      }

      setIsReady(false);

      try {
        const userSnapshot = await getDoc(doc(db, "users", user.uid));
        const userData = userSnapshot.exists() ? userSnapshot.data() : {};

        const nextLanguage =
          normalizeLearningLanguage(userData.learningLanguage) ??
          learningLanguageRef.current ??
          "en";

        const nextRecentCourseByLanguage = {
          ...recentCourseByLanguageRef.current,
          ...withLegacyRecentCourse(
            normalizeRecentCourseByLanguage(userData.recentCourseByLanguage),
            typeof userData.recentCourse === "string"
              ? userData.recentCourse
              : null,
          ),
        };

        if (!isActive) return;

        setLearningLanguageState(nextLanguage);
        setRecentCourseByLanguageState(nextRecentCourseByLanguage);

        await Promise.all([
          persistLocalPreferences(nextLanguage, nextRecentCourseByLanguage),
          setDoc(
            doc(db, "users", user.uid),
            {
              learningLanguage: nextLanguage,
              recentCourseByLanguage: nextRecentCourseByLanguage,
            },
            { merge: true },
          ),
        ]);
      } catch (error) {
        console.warn("Failed to hydrate remote learning language preferences", error);
      } finally {
        if (isActive) {
          setIsReady(true);
        }
      }
    };

    void hydrateRemotePreferences();

    return () => {
      isActive = false;
    };
  }, [authLoading, hasLocalHydrated, persistLocalPreferences, user]);

  const setLearningLanguage = useCallback(
    async (nextLanguage: LearningLanguage) => {
      if (!isLearningLanguage(nextLanguage)) return;

      setLearningLanguageState(nextLanguage);

      try {
        await persistLocalPreferences(
          nextLanguage,
          recentCourseByLanguageRef.current,
        );
        if (user) {
          await setDoc(
            doc(db, "users", user.uid),
            { learningLanguage: nextLanguage },
            { merge: true },
          );
        }
      } catch (error) {
        console.warn("Failed to persist learning language", error);
      }
    },
    [persistLocalPreferences, user],
  );

  const setRecentCourseForLanguage = useCallback(
    async (language: LearningLanguage, courseId: CourseType) => {
      if (!isCourseAvailableForLanguage(courseId, language)) {
        return;
      }

      const nextRecentCourseByLanguage = {
        ...recentCourseByLanguageRef.current,
        [language]: courseId,
      };

      setRecentCourseByLanguageState(nextRecentCourseByLanguage);

      try {
        await Promise.all([
          AsyncStorage.setItem(RECENT_COURSE_STORAGE_KEY, courseId),
          persistLocalPreferences(
            learningLanguageRef.current,
            nextRecentCourseByLanguage,
          ),
        ]);

        if (user) {
          await setDoc(
            doc(db, "users", user.uid),
            {
              recentCourse: courseId,
              recentCourseByLanguage: nextRecentCourseByLanguage,
            },
            { merge: true },
          );
        }
      } catch (error) {
        console.warn("Failed to persist recent course by language", error);
      }
    },
    [persistLocalPreferences, user],
  );

  const value = useMemo(
    () => ({
      learningLanguage,
      setLearningLanguage,
      availableLanguages: AVAILABLE_LANGUAGES,
      recentCourseByLanguage,
      setRecentCourseForLanguage,
      isReady,
    }),
    [
      isReady,
      learningLanguage,
      recentCourseByLanguage,
      setLearningLanguage,
      setRecentCourseForLanguage,
    ],
  );

  return (
    <LearningLanguageContext.Provider value={value}>
      {children}
    </LearningLanguageContext.Provider>
  );
}
