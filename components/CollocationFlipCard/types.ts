import { CourseType } from "../../src/types/vocabulary";

export interface CollocationData {
  collocation: string;
  meaning: string;
  explanation: string;
  example: string;
  translation: string;
  imageUrl?: string;
  synonyms?: string[];
}

export interface CollocationWordBankConfig {
  id: string;
  course: CourseType;
  day?: number;
  initialIsSaved?: boolean;
  enableAdd?: boolean;
  enableDelete?: boolean;
  onDelete?: (id: string) => void;
  isDeleteMode?: boolean;
  isSelected?: boolean;
  onStartDeleteMode?: (id: string) => void;
  onToggleSelection?: (id: string) => void;
  onSavedStateChange?: (id: string, isSaved: boolean) => void;
}
