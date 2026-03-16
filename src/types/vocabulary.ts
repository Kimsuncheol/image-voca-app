import type { PartOfSpeech, WordForms } from "../services/linguisticDataService";

export interface VocabularyCard {
  id: string;
  word: string;
  meaning: string;
  translation?: string;
  pronunciation?: string;
  example: string;
  imageUrl?: string;
  course: CourseType;
  // Linguistic data fields
  partOfSpeech?: PartOfSpeech;
  synonyms?: string[];
  antonyms?: string[];
  relatedWords?: string[];
  wordForms?: WordForms;
}

export type { PartOfSpeech, WordForms };

export type CourseType =
  | "수능"
  | "TOEIC"
  | "TOEFL_IELTS"
  | "COLLOCATION";

export interface Course {
  id: CourseType;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  color: string;
  wordCount: number;
}

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
    id: "COLLOCATION",
    title: "Collocations",
    titleKey: "courses.collocation.title",
    description: "Common Word Pairs",
    descriptionKey: "courses.collocation.description",
    icon: "layers",
    color: "#4A90E2",
    wordCount: 50,
  },
];
