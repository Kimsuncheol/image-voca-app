export const COUNTER_TAB_IDS = [
  "numbers",
  "counter_tsuu",
  "counter_ko",
  "counter_kai_floor",
  "counter_kai_times",
  "counter_ban",
  "counter_ens",
  "counter_years",
  "counter_months",
  "counter_days",
  "counter_hours",
  "counter_minutes",
  "counter_weekdays",
  "counter_hai",
  "counter_bai",
  "counter_hon",
  "counter_mai",
  "counter_nin",
  "counter_hiki",
] as const;

export type CounterTabId = (typeof COUNTER_TAB_IDS)[number];

export interface CounterWord {
  id: string;
  word: string;
  meaningEnglish: string;
  meaningKorean: string;
  pronunciation: string;
  pronunciationRoman: string;
  example: string;
  exampleRoman: string;
  translationEnglish: string;
  translationKorean: string;
  category: string;
}
