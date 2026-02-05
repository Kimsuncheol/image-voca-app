/**
 * AdList Component
 *
 * Displays list of all advertisements with refresh functionality.
 * Pattern based on ActiveCodesList.tsx from the admin screens.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Advertisement } from "../../../../src/types/advertisement";
import { AdCard } from "./AdCard";

interface AdListProps {
  ads: Advertisement[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (adId: string) => void;
  onToggleStatus: (adId: string, active: boolean) => void;
  isDark: boolean;
}

export function AdList({
  ads,
  loading,
  onRefresh,
  onDelete,
  onToggleStatus,
  isDark,
}: AdListProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Advertisements ({ads.length})
        </Text>
        <TouchableOpacity onPress={onRefresh} disabled={loading}>
          <Ionicons
            name="refresh"
            size={24}
            color={isDark ? "#007AFF" : "#007AFF"}
          />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading advertisements...</Text>
        </View>
      ) : ads.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Ionicons
            name="megaphone-outline"
            size={64}
            color={isDark ? "#666" : "#999"}
          />
          <Text style={styles.emptyTitle}>No Advertisements Yet</Text>
          <Text style={styles.emptyText}>
            Create your first advertisement to get started
          </Text>
        </View>
      ) : (
        /* Ad List */
        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              tintColor={isDark ? "#fff" : "#000"}
            />
          }
        >
          {ads.map((ad) => (
            <AdCard
              key={ad.adId}
              ad={ad}
              onDelete={() => onDelete(ad.adId)}
              onToggleStatus={() => onToggleStatus(ad.adId, !ad.active)}
              isDark={isDark}
            />
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: isDark ? "#aaa" : "#666",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: isDark ? "#aaa" : "#666",
      textAlign: "center",
    },
    list: {
      flex: 1,
    },
    bottomSpacer: {
      height: 24,
    },
  });
}
