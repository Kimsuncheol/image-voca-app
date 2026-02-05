/**
 * =============================================================================
 * IPA INPUT FIELD COMPONENT
 * =============================================================================
 * Auto-fetching IPA pronunciation input with US/UK variants
 *
 * FEATURES:
 * - Automatically fetches IPA from Wiktionary when word changes
 * - Separate inputs for US and UK pronunciations
 * - Loading states during fetch
 * - Manual editing always allowed
 * - Clear visual feedback when IPA not found
 * - Theme-aware styling
 * =============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getIpaUSUK } from "../../services/ipa/wiktionaryIpaService";

// =============================================================================
// TYPES
// =============================================================================

interface IpaInputFieldProps {
  word: string;
  ipaUS: string;
  ipaUK: string;
  onChangeIpaUS: (value: string) => void;
  onChangeIpaUK: (value: string) => void;
  isDark?: boolean;
  autoFetch?: boolean; // Enable/disable auto-fetch
}

// =============================================================================
// COMPONENT
// =============================================================================

export const IpaInputField: React.FC<IpaInputFieldProps> = ({
  word,
  ipaUS,
  ipaUK,
  onChangeIpaUS,
  onChangeIpaUK,
  isDark = false,
  autoFetch = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState({ us: false, uk: false });
  const [lastFetchedWord, setLastFetchedWord] = useState("");

  const styles = getStyles(isDark);

  // Auto-fetch IPA when word changes
  useEffect(() => {
    if (!autoFetch || !word || word === lastFetchedWord) return;

    const fetchIpa = async () => {
      setLoading(true);
      setNotFound({ us: false, uk: false });

      try {
        const result = await getIpaUSUK(word);

        if (result.source === "wiktionary") {
          if (result.us) {
            onChangeIpaUS(result.us);
          }
          if (result.uk) {
            onChangeIpaUK(result.uk);
          }

          // Mark which ones were not found
          setNotFound({
            us: !result.us,
            uk: !result.uk,
          });
        } else {
          // Nothing found
          setNotFound({ us: true, uk: true });
        }
      } catch (error) {
        console.error("[IpaInput] Fetch error:", error);
        setNotFound({ us: true, uk: true });
      } finally {
        setLoading(false);
        setLastFetchedWord(word);
      }
    };

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(fetchIpa, 500);

    return () => clearTimeout(timeoutId);
  }, [word, autoFetch, lastFetchedWord]);

  // Manual refresh button
  const handleRefresh = async () => {
    if (!word) return;

    setLoading(true);
    setNotFound({ us: false, uk: false });
    setLastFetchedWord(""); // Clear to force refetch

    try {
      const result = await getIpaUSUK(word);

      if (result.source === "wiktionary") {
        if (result.us) onChangeIpaUS(result.us);
        if (result.uk) onChangeIpaUK(result.uk);

        setNotFound({
          us: !result.us,
          uk: !result.uk,
        });
      } else {
        setNotFound({ us: true, uk: true });
      }
    } catch (error) {
      console.error("[IpaInput] Manual refresh error:", error);
      setNotFound({ us: true, uk: true });
    } finally {
      setLoading(false);
      setLastFetchedWord(word);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with refresh button */}
      <View style={styles.header}>
        <Text style={styles.label}>Pronunciation (IPA)</Text>
        {autoFetch && word && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={loading ? (isDark ? "#555" : "#ccc") : "#007AFF"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* US Pronunciation */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.sublabel}>US (General American)</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : notFound.us && lastFetchedWord === word ? (
            <Text style={styles.notFoundText}>Auto-fill failed</Text>
          ) : null}
        </View>
        <TextInput
          style={styles.input}
          value={ipaUS}
          onChangeText={onChangeIpaUS}
          placeholder="/ˈhɛloʊ/"
          placeholderTextColor={isDark ? "#666" : "#999"}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* UK Pronunciation */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.sublabel}>UK (Received Pronunciation)</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : notFound.uk && lastFetchedWord === word ? (
            <Text style={styles.notFoundText}>Auto-fill failed</Text>
          ) : null}
        </View>
        <TextInput
          style={styles.input}
          value={ipaUK}
          onChangeText={onChangeIpaUK}
          placeholder="/həˈləʊ/"
          placeholderTextColor={isDark ? "#666" : "#999"}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Helper text */}
      {autoFetch && (
        <Text style={styles.helperText}>
          IPA auto-fills from Wiktionary. Edit manually if needed.
        </Text>
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    refreshButton: {
      padding: 4,
    },
    inputGroup: {
      marginBottom: 12,
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    sublabel: {
      fontSize: 14,
      fontWeight: "500",
      color: isDark ? "#aaa" : "#666",
    },
    notFoundText: {
      fontSize: 12,
      color: "#FF9500",
      fontStyle: "italic",
    },
    input: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#38383a" : "#d1d1d6",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
      fontFamily: "monospace", // Better for IPA symbols
    },
    helperText: {
      fontSize: 12,
      color: isDark ? "#666" : "#999",
      marginTop: 4,
      fontStyle: "italic",
    },
  });
