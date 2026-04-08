import { FirebaseError } from "firebase/app";
import { collection, getDocs } from "firebase/firestore";
import type { CounterTabId, CounterWord } from "../types/counters";
import { useNetworkStore } from "../stores/networkStore";
import { db } from "./firebase";

const normalizeFirestoreCollectionPath = (path?: string | null) =>
  (path ?? "").trim().replace(/^\/+|\/+$/g, "");

const COUNTER_ROOT_ENV_KEY = "EXPO_PUBLIC_JLPT_COUNTER_PATH";

const COUNTER_TAB_ENV_KEYS: Record<
  CounterTabId,
  { legacy: string; preferred: string }
> = {
  numbers: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_NUMBERS_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH",
  },
  counter_tsuu: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_TSUU_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_TSUU_PATH",
  },
  counter_ko: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_KO_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_KO_PATH",
  },
  counter_kai_floor: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_KAI_FLOOR_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_KAI_FLOOR_PATH",
  },
  counter_kai_times: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_KAI_TIMES_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_KAI_TIMES_PATH",
  },
  counter_ban: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_BAN_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_BAN_PATH",
  },
  counter_years: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_YEARS_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_YEARS_PATH",
  },
  counter_months: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_MONTHS_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_MONTHS_PATH",
  },
  counter_days: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_DAYS_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_DAYS_PATH",
  },
  counter_hours: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_HOURS_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_HOURS_PATH",
  },
  counter_minutes: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_MINUTES_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_MINUTES_PATH",
  },
  counter_weekdays: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_WEEKDAYS_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_WEEKDAYS_PATH",
  },
  counter_hai: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_HAI_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_HAI_PATH",
  },
  counter_bai: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_BAI_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_BAI_PATH",
  },
  counter_hon: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_HON_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_HON_PATH",
  },
  counter_mai: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_MAI_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_MAI_PATH",
  },
  counter_nin: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_NIN_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_NIN_PATH",
  },
  counter_hiki: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_HIKI_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_HIKI_PATH",
  },
  counter_ens: {
    preferred: "EXPO_PUBLIC_JLPT_COUNTER_COUNTER_ENS_PATH",
    legacy: "EXPO_PUBLIC_JLTP_COUNTER_COUNTER_ENS_PATH",
  },
};

let countersRootDocIdCache: string | null = null;
let countersRootDocIdPromise: Promise<string> | null = null;

const isValidCollectionPath = (path: string) => {
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0 && segments.length % 2 === 1;
};

const getConfiguredCounterPath = (tab: CounterTabId) => {
  const envKeys = COUNTER_TAB_ENV_KEYS[tab];
  const preferredPath = normalizeFirestoreCollectionPath(
    process.env[envKeys.preferred],
  );

  if (isValidCollectionPath(preferredPath)) {
    return preferredPath;
  }

  const legacyPath = normalizeFirestoreCollectionPath(process.env[envKeys.legacy]);
  if (isValidCollectionPath(legacyPath)) {
    return legacyPath;
  }

  return "";
};

const getCountersRootCollectionPath = () =>
  normalizeFirestoreCollectionPath(process.env[COUNTER_ROOT_ENV_KEY]);

const getCounterPathErrorMessage = (tab: CounterTabId) => {
  const envKeys = COUNTER_TAB_ENV_KEYS[tab];
  return `Missing or invalid counter collection path for ${tab}. Checked ${envKeys.preferred}, ${envKeys.legacy}, and ${COUNTER_ROOT_ENV_KEY}.`;
};

const resolveCountersRootDocId = async (): Promise<string> => {
  if (countersRootDocIdCache) {
    return countersRootDocIdCache;
  }

  if (!countersRootDocIdPromise) {
    countersRootDocIdPromise = (async () => {
      const rootPath = getCountersRootCollectionPath();
      if (!isValidCollectionPath(rootPath)) {
        throw new Error(`Missing or invalid ${COUNTER_ROOT_ENV_KEY}`);
      }

      const snapshot = await getDocs(collection(db, rootPath));

      if (snapshot.docs.length === 0) {
        throw new Error(
          `No counters root document found at ${COUNTER_ROOT_ENV_KEY}.`,
        );
      }

      if (snapshot.docs.length > 1) {
        throw new Error(
          `Expected exactly one counters root document at ${COUNTER_ROOT_ENV_KEY}, found ${snapshot.docs.length}.`,
        );
      }

      countersRootDocIdCache = snapshot.docs[0].id;
      return countersRootDocIdCache;
    })().catch((error) => {
      countersRootDocIdPromise = null;
      throw error;
    });
  }

  return countersRootDocIdPromise;
};

const resolveCountersCollectionPath = async (tab: CounterTabId) => {
  const configuredPath = getConfiguredCounterPath(tab);
  if (isValidCollectionPath(configuredPath)) {
    return configuredPath;
  }

  const rootPath = getCountersRootCollectionPath();
  if (!isValidCollectionPath(rootPath)) {
    throw new Error(getCounterPathErrorMessage(tab));
  }

  const rootDocId = await resolveCountersRootDocId();
  return `${rootPath}/${rootDocId}/${tab}`;
};

export const getCountersCollectionPath = (tab: CounterTabId) =>
  getConfiguredCounterPath(tab);

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
  const path = await resolveCountersCollectionPath(tab);
  if (!isValidCollectionPath(path)) {
    throw new Error(getCounterPathErrorMessage(tab));
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

export const __resetCountersServiceForTests = () => {
  countersRootDocIdCache = null;
  countersRootDocIdPromise = null;
};
