import { CourseType } from "../../src/types/vocabulary";

export interface CollocationData {
  collocation: string;
  meaning: string;
  explanation: string;
  example: string;
  translation: string;
}

export interface CollocationWordBankConfig {
  id: string;
  course: CourseType;
  day?: number;
  initialIsSaved?: boolean;
  enableAdd?: boolean;
  enableDelete?: boolean;
  onDelete?: (id: string) => void;
}
