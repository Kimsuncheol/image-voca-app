import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { MangaPageView } from "../../components/manga/MangaPageView";
import { MangaReaderControls } from "../../components/manga/MangaReaderControls";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchChapterPages } from "../../src/services/mangaService";

export default function MangaReaderScreen() {
  const { mangaId, chapterId } = useLocalSearchParams<{
    mangaId: string;
    chapterId: string;
  }>();
  const router = useRouter();
  const { isDark } = useTheme();

  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<"ltr" | "rtl">("rtl");

  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    if (!mangaId || !chapterId) return;
    void (async () => {
      try {
        const urls = await fetchChapterPages(mangaId, chapterId);
        setPageUrls(urls);
      } catch (error) {
        console.warn("Failed to fetch chapter pages:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [mangaId, chapterId]);

  const handleToggleDirection = useCallback(() => {
    setDirection((prev) => (prev === "rtl" ? "ltr" : "rtl"));
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PagerView
        key={direction}
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        layoutDirection={direction}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {pageUrls.map((uri, index) => (
          <View key={index} style={styles.page}>
            <MangaPageView uri={uri} />
          </View>
        ))}
      </PagerView>
      <MangaReaderControls
        currentPage={currentPage}
        totalPages={pageUrls.length}
        direction={direction}
        onBack={() => router.back()}
        onToggleDirection={handleToggleDirection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
