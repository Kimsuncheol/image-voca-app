import { useEffect } from "react";
import type { CourseType } from "../types/vocabulary";
import { isJlptLevelCourseId } from "../types/vocabulary";
import {
  type JapaneseContentLanguageMode,
  useJapaneseContentLanguageStore,
} from "../stores/japaneseContentLanguageStore";

export const isJapaneseVocabularyCourse = (courseId?: CourseType | string) =>
  courseId === "KANJI" || isJlptLevelCourseId(courseId);

export const resolveJapaneseContentLanguage = ({
  courseId,
  mode,
  uiLanguage,
}: {
  courseId?: CourseType | string;
  mode: JapaneseContentLanguageMode;
  uiLanguage?: string;
}) => (isJapaneseVocabularyCourse(courseId) && mode === "ko" ? "ko" : uiLanguage);

export function useJapaneseContentLanguage(
  courseId: CourseType | string | undefined,
  uiLanguage?: string,
) {
  const mode = useJapaneseContentLanguageStore((state) => state.mode);
  const isInitialized = useJapaneseContentLanguageStore(
    (state) => state._initialized,
  );
  const hydrate = useJapaneseContentLanguageStore((state) => state.hydrate);

  useEffect(() => {
    if (!isInitialized) {
      void hydrate();
    }
  }, [hydrate, isInitialized]);

  return resolveJapaneseContentLanguage({ courseId, mode, uiLanguage });
}
