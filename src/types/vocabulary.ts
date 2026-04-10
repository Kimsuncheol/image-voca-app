import type { PartOfSpeech, WordForms } from "../services/linguisticDataService";

export interface LocalizedVocabularyContent {
  meaning?: string;
  pronunciation?: string;
  translation?: string;
}

export interface VocabularyLocalizationMap {
  en?: LocalizedVocabularyContent;
  ko?: LocalizedVocabularyContent;
}

export interface VocabularyCard {
  id: string;
  word: string;
  meaning: string;
  translation?: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  example: string;
  exampleRoman?: string;
  imageUrl?: string;
  localized?: VocabularyLocalizationMap;
  course: CourseType;
  // Linguistic data fields
  partOfSpeech?: PartOfSpeech;
  synonyms?: string[];
  antonyms?: string[];
  relatedWords?: string[];
  wordForms?: WordForms;
}

export type { PartOfSpeech, WordForms };

export type JLPTLevelId =
  | "JLPT_N1"
  | "JLPT_N2"
  | "JLPT_N3"
  | "JLPT_N4"
  | "JLPT_N5";

export type LearningLanguage = "en" | "ja";

export type TopLevelCourseType =
  | "수능"
  | "CSAT_IDIOMS"
  | "TOEIC"
  | "TOEFL_IELTS"
  | "EXTREMELY_ADVANCED"
  | "COLLOCATION"
  | "JLPT";

export type CourseType = TopLevelCourseType | JLPTLevelId;

export interface Course {
  id: TopLevelCourseType;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  color: string;
  wordCount: number;
}

export interface JLPTLevelCourse {
  id: JLPTLevelId;
  parentId: "JLPT";
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  color: string;
  wordCount: number;
}

export type RuntimeCourse = Course | JLPTLevelCourse;

export const COURSES: Course[] = [
  {
    id: "수능",
    title: "수능",
    titleKey: "courses.csat.title",
    description: "Korean College Entrance Exam",
    descriptionKey: "courses.csat.description",
    icon: "school",
    color: "#FF6B6B",
    wordCount: 1200,
  },
  {
    id: "CSAT_IDIOMS",
    title: "CSAT Idioms",
    titleKey: "courses.csatIdioms.title",
    description: "Idioms for the Korean College Entrance Exam",
    descriptionKey: "courses.csatIdioms.description",
    icon: "chatbubbles",
    color: "#E85D75",
    wordCount: 300,
  },
  {
    id: "TOEIC",
    title: "TOEIC",
    titleKey: "courses.toeic.title",
    description: "Business English",
    descriptionKey: "courses.toeic.description",
    icon: "briefcase",
    color: "#4ECDC4",
    wordCount: 990,
  },
  {
    id: "TOEFL_IELTS",
    title: "TOEFL / IELTS",
    titleKey: "courses.toeflIelts.title",
    description: "Academic & International English",
    descriptionKey: "courses.toeflIelts.description",
    icon: "library",
    color: "#A855F7",
    wordCount: 2100,
  },
  {
    id: "EXTREMELY_ADVANCED",
    title: "Extremely Advanced",
    titleKey: "courses.extremelyAdvanced.title",
    description: "Challenging English vocabulary",
    descriptionKey: "courses.extremelyAdvanced.description",
    icon: "flame",
    color: "#B91C1C",
    wordCount: 300,
  },
  {
    id: "COLLOCATION",
    title: "Collocations",
    titleKey: "courses.collocation.title",
    description: "Common Word Pairs",
    descriptionKey: "courses.collocation.description",
    icon: "layers",
    color: "#4A90E2",
    wordCount: 50,
  },
  {
    id: "JLPT",
    title: "JLPT",
    titleKey: "courses.jlpt.title",
    description: "Japanese Language Proficiency Test",
    descriptionKey: "courses.jlpt.description",
    icon: "language",
    color: "#FF8A65",
    wordCount: 5000,
  },
];

export const JLPT_LEVELS: JLPTLevelCourse[] = [
  {
    id: "JLPT_N1",
    parentId: "JLPT",
    title: "N1",
    titleKey: "courses.jlpt.levels.n1.title",
    description: "Advanced",
    descriptionKey: "courses.jlpt.levels.n1.description",
    icon: "ribbon",
    color: "#D9485F",
    wordCount: 1200,
  },
  {
    id: "JLPT_N2",
    parentId: "JLPT",
    title: "N2",
    titleKey: "courses.jlpt.levels.n2.title",
    description: "Upper Intermediate",
    descriptionKey: "courses.jlpt.levels.n2.description",
    icon: "ribbon",
    color: "#F28C38",
    wordCount: 1100,
  },
  {
    id: "JLPT_N3",
    parentId: "JLPT",
    title: "N3",
    titleKey: "courses.jlpt.levels.n3.title",
    description: "Intermediate",
    descriptionKey: "courses.jlpt.levels.n3.description",
    icon: "ribbon",
    color: "#F6C445",
    wordCount: 1000,
  },
  {
    id: "JLPT_N4",
    parentId: "JLPT",
    title: "N4",
    titleKey: "courses.jlpt.levels.n4.title",
    description: "Elementary",
    descriptionKey: "courses.jlpt.levels.n4.description",
    icon: "ribbon",
    color: "#62B46E",
    wordCount: 900,
  },
  {
    id: "JLPT_N5",
    parentId: "JLPT",
    title: "N5",
    titleKey: "courses.jlpt.levels.n5.title",
    description: "Beginner",
    descriptionKey: "courses.jlpt.levels.n5.description",
    icon: "ribbon",
    color: "#4A90E2",
    wordCount: 800,
  },
];

export const ENGLISH_COURSES: TopLevelCourseType[] = [
  "수능",
  "CSAT_IDIOMS",
  "TOEIC",
  "TOEFL_IELTS",
  "EXTREMELY_ADVANCED",
  "COLLOCATION",
];

export const JAPANESE_COURSES: TopLevelCourseType[] = ["JLPT"];

const JLPT_LEVEL_IDS = new Set<JLPTLevelId>(JLPT_LEVELS.map((level) => level.id));

export const isJlptLevelCourseId = (courseId?: string): courseId is JLPTLevelId =>
  !!courseId && JLPT_LEVEL_IDS.has(courseId as JLPTLevelId);

export const isJlptParentCourseId = (
  courseId?: string,
): courseId is "JLPT" => courseId === "JLPT";

export const isJlptCourseId = (courseId?: string) =>
  isJlptParentCourseId(courseId) || isJlptLevelCourseId(courseId);

export const getTopLevelCoursesForLanguage = (
  language: LearningLanguage,
): Course[] =>
  COURSES.filter((course) =>
    language === "ja"
      ? JAPANESE_COURSES.includes(course.id)
      : ENGLISH_COURSES.includes(course.id),
  );

export const getLearningLanguageForCourse = (
  courseId?: CourseType | string,
): LearningLanguage | undefined => {
  if (!courseId) return undefined;
  if (isJlptCourseId(courseId)) return "ja";
  if (ENGLISH_COURSES.includes(courseId as TopLevelCourseType)) return "en";
  return undefined;
};

export const isCourseAvailableForLanguage = (
  courseId: CourseType | string | undefined,
  language: LearningLanguage,
) => getLearningLanguageForCourse(courseId) === language;

export const findRuntimeCourse = (
  courseId?: string,
): RuntimeCourse | undefined => {
  if (!courseId) return undefined;
  return (
    COURSES.find((course) => course.id === courseId) ??
    JLPT_LEVELS.find((level) => level.id === courseId)
  );
};

export const getTopLevelCourseId = (
  courseId?: CourseType | string,
): TopLevelCourseType | undefined => {
  if (!courseId) return undefined;
  if (isJlptLevelCourseId(courseId)) return "JLPT";
  return courseId as TopLevelCourseType;
};
