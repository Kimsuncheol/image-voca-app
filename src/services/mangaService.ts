import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchChapterPages(
  mangaId: string,
  chapterId: string,
): Promise<string[]> {
  const chapterRef = doc(db, "mangas", mangaId, "chapters", chapterId);
  const snapshot = await getDoc(chapterRef);
  if (!snapshot.exists()) return [];
  const data = snapshot.data();
  return (data.pageUrls as string[]) ?? [];
}
