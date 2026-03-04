import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { ThemedText } from "../themed-text";

const CACHE_KEY = "@famous_quote_cache";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface FamousQuote {
  id: string;
  quote: string;
  translation: string;
  author: string;
}

interface CachedQuote {
  quote: FamousQuote;
  fetchedAt: number;
}

async function loadQuote(): Promise<FamousQuote | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
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
    const snapshot = await getDocs(collection(db, "famous_quote"));
    if (snapshot.empty) return null;

    const docs = snapshot.docs;
    const randomDoc = docs[Math.floor(Math.random() * docs.length)];
    const quote: FamousQuote = {
      id: randomDoc.id,
      ...(randomDoc.data() as Omit<FamousQuote, "id">),
    };

    await AsyncStorage.setItem(
      CACHE_KEY,
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
  const [quote, setQuote] = useState<FamousQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote()
      .then(setQuote)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <FamousQuoteSkeleton />;
  }

  if (!quote) return null;

  const cardBg = isDark ? "#1c1c1e" : "#fff";
  const textColor = isDark ? "#fff" : "#1c1c1e";
  const mutedColor = isDark ? "#8e8e93" : "#6d6d72";

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <ThemedText style={[styles.label, { color: mutedColor }]}>
        Today&apos;s quote
      </ThemedText>
      <ThemedText style={[styles.quoteText, { color: textColor }]}>
        {quote.quote}
      </ThemedText>
      <ThemedText style={[styles.translation, { color: mutedColor }]}>
        {quote.translation}
      </ThemedText>
      <ThemedText style={[styles.author, { color: mutedColor }]}>
        — {quote.author}
      </ThemedText>
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
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 32,
  },
  translation: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  author: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "right",
  },
});
