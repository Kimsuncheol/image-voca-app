import { FirebaseError } from "firebase/app";
import { collection, getDocs } from "firebase/firestore";
import { useNetworkStore } from "../stores/networkStore";
import type { PostfixWord, PrefixWord } from "../types/prefixPostfix";
import { db } from "./firebase";

export type PrefixPostfixData = {
  postfixes: PostfixWord[];
  prefixes: PrefixWord[];
};

const normalizeFirestoreCollectionPath = (path?: string | null) =>
  (path ?? "").trim().replace(/^\/+|\/+$/g, "");

const getPrefixCollectionPath = () =>
  normalizeFirestoreCollectionPath(process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX);

const getPostfixCollectionPath = () =>
  normalizeFirestoreCollectionPath(process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_POSTFIX);

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

const mapPrefixWord = (
  id: string,
  data: Record<string, unknown>,
): PrefixWord => ({
  id,
  prefix: typeof data.prefix === "string" ? data.prefix : "",
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
});

const mapPostfixWord = (
  id: string,
  data: Record<string, unknown>,
): PostfixWord => ({
  id,
  postfix: typeof data.postfix === "string" ? data.postfix : "",
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
});

const sortById = <T extends { id: string }>(items: T[]) =>
  [...items].sort((a, b) => a.id.localeCompare(b.id));

const fetchPrefixCollection = async (path: string) => {
  const snapshot = await getDocs(collection(db, path));
  return sortById(
    snapshot.docs.map((entry) =>
      mapPrefixWord(entry.id, entry.data() as Record<string, unknown>),
    ),
  );
};

const fetchPostfixCollection = async (path: string) => {
  const snapshot = await getDocs(collection(db, path));
  return sortById(
    snapshot.docs.map((entry) =>
      mapPostfixWord(entry.id, entry.data() as Record<string, unknown>),
    ),
  );
};

export const fetchPrefixPostfixDataFromFirestore = async () => {
  const prefixPath = getPrefixCollectionPath();
  const postfixPath = getPostfixCollectionPath();

  if (!isValidCollectionPath(prefixPath)) {
    throw new Error("Missing or invalid EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX");
  }

  if (!isValidCollectionPath(postfixPath)) {
    throw new Error("Missing or invalid EXPO_PUBLIC_COURSE_PATH_JLPT_POSTFIX");
  }

  const [prefixes, postfixes] = await Promise.all([
    fetchPrefixCollection(prefixPath),
    fetchPostfixCollection(postfixPath),
  ]);

  return {
    prefixes: prefixes as PrefixWord[],
    postfixes: postfixes as PostfixWord[],
  };
};

export const getPrefixPostfixData = async (): Promise<PrefixPostfixData> => {
  const prefixPath = getPrefixCollectionPath();
  const postfixPath = getPostfixCollectionPath();

  if (!isValidCollectionPath(prefixPath)) {
    throw new Error("Missing or invalid EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX");
  }

  if (!isValidCollectionPath(postfixPath)) {
    throw new Error("Missing or invalid EXPO_PUBLIC_COURSE_PATH_JLPT_POSTFIX");
  }

  try {
    const remoteData = await fetchPrefixPostfixDataFromFirestore();
    markFirebaseReadSuccess();
    return remoteData;
  } catch (error) {
    markFirebaseReadFailure(error);
    throw error;
  }
};
