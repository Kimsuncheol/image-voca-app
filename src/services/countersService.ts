import { COUNTERS_DATA } from "../data/counters";
import type { CounterTabId, CounterWord } from "../types/counters";

const mapCounterWord = (
  id: string,
  data: Record<string, unknown>,
): CounterWord => ({
  id,
  word: typeof data.word === "string" ? data.word : "",
  meaningEnglish:
    typeof data.meaningEnglish === "string" ? data.meaningEnglish : "",
  meaningKorean:
    typeof data.meaningKorean === "string" ? data.meaningKorean : "",
  pronunciation:
    typeof data.pronunciation === "string" ? data.pronunciation : "",
  pronunciationRoman:
    typeof data.pronunciationRoman === "string" ? data.pronunciationRoman : "",
  example: typeof data.example === "string" ? data.example : "",
  exampleRoman:
    typeof data.exampleRoman === "string" ? data.exampleRoman : "",
  translationEnglish:
    typeof data.translationEnglish === "string" ? data.translationEnglish : "",
  translationKorean:
    typeof data.translationKorean === "string" ? data.translationKorean : "",
  category: typeof data.category === "string" ? data.category : "",
});

const sortCounters = (items: CounterWord[]) =>
  [...items].sort((a, b) => a.id.localeCompare(b.id));

export const getCountersData = async (
  tab: CounterTabId,
): Promise<CounterWord[]> =>
  sortCounters(
    (COUNTERS_DATA[tab] ?? []).map((item) =>
      mapCounterWord(item.id, item as unknown as Record<string, unknown>),
    ),
  );
