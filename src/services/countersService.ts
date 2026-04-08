import { FirebaseError } from "firebase/app";
import { collection, getDocs } from "firebase/firestore";
import type { CounterTabId, CounterWord } from "../types/counters";
import { useNetworkStore } from "../stores/networkStore";
import { db } from "./firebase";

const normalizeFirestoreCollectionPath = (path?: string | null) =>
  (path ?? "").trim().replace(/^\/+|\/+$/g, "");

const COUNTER_TAB_ENV_KEYS: Record<CounterTabId, string> = {
  numbers: "EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH",
  counter_tsuu: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_TSUU_PATH",
  counter_ko: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_KO_PATH",
  counter_kai_floor: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_KAI_FLOOR_PATH",
  counter_kai_times: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_KAI_TIMES_PATH",
  counter_ban: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_BAN_PATH",
  counter_years: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_YEARS_PATH",
  counter_months: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_MONTHS_PATH",
  counter_days: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_DAYS_PATH",
  counter_hours: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_HOURS_PATH",
  counter_minutes: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_MINUTES_PATH",
  counter_weekdays: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_WEEKDAYS_PATH",
  counter_hai: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_HAI_PATH",
  counter_bai: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_BAI_PATH",
  counter_hon: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_HON_PATH",
  counter_mai: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_MAI_PATH",
  counter_nin: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_NIN_PATH",
  counter_hiki: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_HIKI_PATH",
  counter_ens: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_ENS_PATH",
};

export const getCountersCollectionPath = (tab: CounterTabId) =>
  normalizeFirestoreCollectionPath(process.env[COUNTER_TAB_ENV_KEYS[tab]]);

const isValidCollectionPath = (path: string) => {
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0 && segments.length % 2 === 1;
};

const markFirebaseReadSuccess = () => {
  useNetworkStore.getState().setFirebaseOnline();
};

const markFirebaseReadFailure = (error: unknown) => {
  if (error instanceof FirebaseError) {
    useNetworkStore.getState().setFirebaseOffline(true);
  }
};

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

export const fetchCountersDataFromFirestore = async (tab: CounterTabId) => {
  const path = getCountersCollectionPath(tab);
  if (!isValidCollectionPath(path)) {
    throw new Error(`Missing or invalid ${COUNTER_TAB_ENV_KEYS[tab]}`);
  }

  const snapshot = await getDocs(collection(db, path));
  return sortCounters(
    snapshot.docs.map((entry) =>
      mapCounterWord(entry.id, entry.data() as Record<string, unknown>),
    ),
  );
};

export const getCountersData = async (
  tab: CounterTabId,
): Promise<CounterWord[]> => {
  try {
    const remoteData = await fetchCountersDataFromFirestore(tab);
    markFirebaseReadSuccess();
    return remoteData;
  } catch (error) {
    markFirebaseReadFailure(error);
    throw error;
  }
};
