import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { LearningLanguage } from "../../src/types/vocabulary";
import {
import { FontSizes } from "@/constants/fontSizes";
  splitJapaneseTextSegments,
  stripKanaParens,
} from "../../src/utils/japaneseText";
import { ThemedText } from "../themed-text";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const LANGUAGE_MAP: Record<LearningLanguage, "English" | "Japanese"> = {
  en: "English",
  ja: "Japanese",
};

interface FamousQuote {
  id: string;
  quote: string;
  translation: string;
  author: string;
  language: "English" | "Japanese";
}

interface CachedQuote {
  quote: FamousQuote;
  fetchedAt: number;
}

async function loadQuote(
  language: LearningLanguage,
): Promise<FamousQuote | null> {
  const cacheKey = `@famous_quote_cache_${language}`;

  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) {
      const cached: CachedQuote = JSON.parse(raw);
      if (Date.now() - cached.fetchedAt < ONE_DAY_MS) {
        return cached.quote;
      }
    }
  } catch {
    // cache miss — fetch fresh
  }

  try {
    const q = query(
      collection(db, "famous_quote"),
      where("language", "==", LANGUAGE_MAP[language]),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docs = snapshot.docs;
    const randomDoc = docs[Math.floor(Math.random() * docs.length)];
    const quote: FamousQuote = {
      id: randomDoc.id,
      ...(randomDoc.data() as Omit<FamousQuote, "id">),
    };

    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ quote, fetchedAt: Date.now() }),
    );
    return quote;
  } catch (error) {
    console.error("Failed to fetch famous quote", error);
    return null;
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FamousQuoteSkeleton() {
  const { isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  const skeletonBg = isDark ? "#333" : "#E1E9EE";
  const cardBg = isDark ? "#1c1c1e" : "#fff";

  return (
    <View style={[skeletonStyles.card, { backgroundColor: cardBg }]}>
      {/* Today's quote label */}
      <Animated.View
        style={[
          skeletonStyles.bar,
          {
            width: 100,
            height: 12,
            marginBottom: 14,
            opacity: animatedValue,
            backgroundColor: skeletonBg,
          },
        ]}
      />
      {/* Opening quote mark placeholder */}
      <Animated.View
        style={[
          skeletonStyles.bar,
          {
            width: 28,
            height: 28,
            marginBottom: 8,
            opacity: animatedValue,
            backgroundColor: skeletonBg,
          },
        ]}
      />
      {/* Quote lines */}
      <Animated.View
        style={[
          skeletonStyles.bar,
          {
            width: "100%",
            height: 14,
            opacity: animatedValue,
            backgroundColor: skeletonBg,
          },
        ]}
      />
      <Animated.View
        style={[
          skeletonStyles.bar,
          {
            width: "90%",
            height: 14,
            marginTop: 6,
            opacity: animatedValue,
            backgroundColor: skeletonBg,
          },
        ]}
      />
      <Animated.View
        style={[
          skeletonStyles.bar,
          {
            width: "60%",
            height: 14,
            marginTop: 6,
            marginBottom: 10,
            opacity: animatedValue,
            backgroundColor: skeletonBg,
          },
        ]}
      />
      {/* Translation line */}
      <Animated.View
        style={[
          skeletonStyles.bar,
          {
            width: "80%",
            height: 12,
            opacity: animatedValue,
            backgroundColor: skeletonBg,
          },
        ]}
      />
      {/* Author line */}
      <Animated.View
        style={[
          skeletonStyles.bar,
          {
            width: 100,
            height: 12,
            marginTop: 12,
            alignSelf: "flex-end",
            opacity: animatedValue,
            backgroundColor: skeletonBg,
          },
        ]}
      />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  bar: {
    borderRadius: 4,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardPopFamousQuote() {
  const { isDark } = useTheme();
  const { learningLanguage } = useLearningLanguage();
  const [quote, setQuote] = useState<FamousQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKana, setShowKana] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadQuote(learningLanguage)
      .then(setQuote)
      .finally(() => setLoading(false));
  }, [learningLanguage]);

  if (loading) {
    return <FamousQuoteSkeleton />;
  }

  if (!quote) return null;

  const isJapanese = quote.language === "Japanese";
  const cardBg = isDark ? "#1c1c1e" : "#fff";
  const textColor = isDark ? "#fff" : "#1c1c1e";
  const mutedColor = isDark ? "#8e8e93" : "#6d6d72";

  const quoteSegments = isJapanese
    ? splitJapaneseTextSegments(
        showKana ? quote.quote : stripKanaParens(quote.quote),
      )
    : null;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <ThemedText style={[styles.label, { color: mutedColor }]}>
        Today&apos;s quote
      </ThemedText>
      {quoteSegments ? (
        <Text style={[styles.quoteText, { color: textColor }]}>
          {quoteSegments.map((segment, i) => (
            <Text
              key={i}
              style={segment.isKanaParen ? styles.furigana : undefined}
            >
              {segment.text}
            </Text>
          ))}
        </Text>
      ) : (
        <ThemedText style={[styles.quoteText, { color: textColor }]}>
          {quote.quote}
        </ThemedText>
      )}
      <ThemedText style={[styles.translation, { color: mutedColor }]}>
        {quote.translation}
      </ThemedText>
      {quote.author.length > 0 && (
        <ThemedText style={[styles.author, { color: mutedColor }]}>
          — {quote.author}
        </ThemedText>
      )}
      {isJapanese && (
        <View style={styles.kanaToggleBar}>
          <Pressable
            onPress={() => setShowKana((prev) => !prev)}
            style={[
              styles.kanaTogglePill,
              showKana && styles.kanaTogglePillActive,
              {
                borderColor: showKana
                  ? "rgba(46, 160, 67, 0.95)"
                  : isDark
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(17,24,28,0.16)",
              },
            ]}
          >
            <Text
              style={[
                styles.kanaToggleText,
                { color: showKana ? "#FFFFFF" : isDark ? "#8e8e93" : "#666" },
              ]}
            >
              がな
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: FontSizes.caption,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  quoteText: {
    fontSize: FontSizes.titleLg,
    fontWeight: "bold",
    lineHeight: 32,
  },
  translation: {
    fontSize: FontSizes.body,
    lineHeight: 20,
    marginTop: 10,
  },
  author: {
    fontSize: FontSizes.label,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "right",
  },
  furigana: {
    fontSize: FontSizes.caption,
    color: "#9A9A9A",
  },
  kanaToggleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  kanaTogglePill: {
    minHeight: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  kanaTogglePillActive: {
    backgroundColor: "#2EA043",
  },
  kanaToggleText: {
    fontSize: FontSizes.caption,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
