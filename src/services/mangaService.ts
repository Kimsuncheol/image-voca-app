import { collection, getDocs } from "firebase/firestore";
import { isJlptLevelCourseId } from "../types/vocabulary";
import { db } from "./firebase";

function mapJlptLevelCourseIdToMangaLevel(courseId: string) {
  return courseId.replace(/^JLPT_/, "");
}

function toMangaDayDocumentId(day: string) {
  return `Day${day}`;
}

function resolveMangaItemsPath(courseId: string, day: string) {
  if (isJlptLevelCourseId(courseId)) {
    return [
      "manga",
      "JLPT",
      "levels",
      mapJlptLevelCourseIdToMangaLevel(courseId),
      "days",
      toMangaDayDocumentId(day),
      "items",
    ] as const;
  }

  return ["manga", courseId, "days", toMangaDayDocumentId(day), "items"] as const;
}

export async function fetchMangaDayPages(
  courseId: string,
  day: string,
): Promise<string[]> {
  const itemsPath = resolveMangaItemsPath(courseId, day);
  console.log("[Manga] Fetch requested", {
    courseId,
    day,
    itemsPath: itemsPath.join("/"),
  });

  const itemsRef = collection(db, ...itemsPath);
  const snapshot = await getDocs(itemsRef);
  const pageUrls = snapshot.docs
    .map((itemDoc) => {
      const data = itemDoc.data() as {
        uploadIndex?: unknown;
        imageUrl?: unknown;
      };
      return {
        uploadIndex:
          typeof data.uploadIndex === "number"
            ? data.uploadIndex
            : Number.POSITIVE_INFINITY,
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl.trim() : "",
      };
    })
    .filter((item) => item.imageUrl.length > 0)
    .sort((a, b) => a.uploadIndex - b.uploadIndex)
    .map((item) => item.imageUrl);

  if (pageUrls.length > 0) {
    console.log("[Manga] Resolved manga items path", {
      path: itemsPath.join("/"),
      itemCount: pageUrls.length,
      pageUrls,
    });
    return pageUrls;
  }

  console.log("[Manga] No manga document found", {
    path: itemsPath.join("/"),
  });
  return [];
}
