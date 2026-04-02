import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { MangaPageView } from "../../components/manga/MangaPageView";
import { MangaReaderControls } from "../../components/manga/MangaReaderControls";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchMangaDayPages } from "../../src/services/mangaService";

export default function MangaReaderScreen() {
  const { courseId, day } = useLocalSearchParams<{
    courseId: string;
    day: string;
  }>();
  const router = useRouter();
  const { isDark } = useTheme();

  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tappingCount, setTappingCount] = useState(0);

  const pagerRef = useRef<PagerView>(null);
  const showControls = tappingCount % 2 === 1;

  useEffect(() => {
    if (!courseId || !day) return;
    void (async () => {
      try {
        const urls = await fetchMangaDayPages(courseId, day);
        setPageUrls(urls);
      } catch (error) {
        console.warn("Failed to fetch chapter pages:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, day]);

  const handlePrevious = useCallback(() => {
    if (currentPage <= 0) return;
    pagerRef.current?.setPage(currentPage - 1);
  }, [currentPage]);

  const handleNext = useCallback(() => {
    if (currentPage >= pageUrls.length - 1) return;
    pagerRef.current?.setPage(currentPage + 1);
  }, [currentPage, pageUrls.length]);

  const handleSwipeLeft = useCallback(() => {
    handlePrevious();
  }, [handlePrevious]);

  const handleSwipeRight = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handlePageTap = useCallback(() => {
    setTappingCount((prev) => prev + 1);
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
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        layoutDirection="rtl"
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {pageUrls.map((uri, index) => (
          <View key={index} style={styles.page}>
            <MangaPageView
              uri={uri}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onTap={handlePageTap}
            />
          </View>
        ))}
      </PagerView>
      <MangaReaderControls
        currentPage={currentPage}
        totalPages={pageUrls.length}
        onBack={() => router.back()}
        visible={showControls}
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
