/**
 * AdCard Component
 *
 * Displays individual advertisement card with thumbnail, metadata, and actions.
 * Pattern based on MemberCard.tsx from the admin screens.
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Advertisement } from "../../../../src/types/advertisement";

interface AdCardProps {
  ad: Advertisement;
  onDelete: () => void;
  onToggleStatus: () => void;
  isDark: boolean;
}

export function AdCard({ ad, onDelete, onToggleStatus, isDark }: AdCardProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.card}>
      {/* Thumbnail Preview */}
      <View style={styles.thumbnailContainer}>
        {ad.type === "image" && ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons
              name="play-circle"
              size={48}
              color={isDark ? "#666" : "#999"}
            />
          </View>
        )}
      </View>

      {/* Ad Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {ad.title}
          </Text>
          <View
            style={[
              styles.badge,
              ad.active ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <Text style={styles.badgeText}>
              {ad.active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {ad.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {ad.description}
          </Text>
        ) : null}

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {ad.type === "image" ? "📷 Image" : "🎬 Video"}
          </Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>
            {new Date(ad.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onToggleStatus}
          style={styles.actionButton}
        >
          <Ionicons
            name={ad.active ? "pause-circle" : "play-circle"}
            size={28}
            color={ad.active ? "#ff9500" : "#28a745"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={28} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    thumbnailContainer: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
      marginRight: 12,
    },
    thumbnail: {
      width: "100%",
      height: "100%",
    },
    videoPlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      flex: 1,
      justifyContent: "space-between",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      flex: 1,
      marginRight: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    activeBadge: {
      backgroundColor: "#28a74520",
    },
    inactiveBadge: {
      backgroundColor: isDark ? "#444" : "#ddd",
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: isDark ? "#aaa" : "#666",
    },
    description: {
      fontSize: 13,
      color: isDark ? "#aaa" : "#666",
      marginBottom: 6,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaText: {
      fontSize: 12,
      color: isDark ? "#888" : "#999",
    },
    actions: {
      justifyContent: "space-around",
      alignItems: "center",
      marginLeft: 8,
    },
    actionButton: {
      padding: 4,
    },
  });
}
