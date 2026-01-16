export interface VocabularyCard {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  example: string;
  image?: string;
  course: CourseType;
}

export type CourseType = 
  | "수능"
  | "TOEIC"
  | "TOEFL"
  | "TOEIC_SPEAKING"
  | "IELTS"
  | "OPIC";

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
    id: "TOEFL",
    title: "TOEFL",
    titleKey: "courses.toefl.title",
    description: "Academic English",
    descriptionKey: "courses.toefl.description",
    icon: "library",
    color: "#FFE66D",
    wordCount: 1100,
  },
  {
    id: "IELTS",
    title: "IELTS",
    titleKey: "courses.ielts.title",
    description: "International English",
    descriptionKey: "courses.ielts.description",
    icon: "globe",
    color: "#DDA0DD",
    wordCount: 1000,
  },
];

