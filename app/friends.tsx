// ============================================================================
// IMPORTS
// ============================================================================

// React and React Native core imports
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Third-party libraries
import { router } from "expo-router"; // Navigation routing
import { useTranslation } from "react-i18next"; // i18n internationalization support

// Context and state management
import { useAuth } from "../src/context/AuthContext"; // User authentication state
import { useTheme } from "../src/context/ThemeContext"; // Dark/Light theme management
import { useFriendStore } from "../src/stores/friendStore"; // Zustand store for friend operations

// Custom components
import { SafeAreaView } from "react-native-safe-area-context";
import { FriendRequestsList } from "../components/friends/FriendRequestsList"; // Friend requests display
import { FriendsList } from "../components/friends/FriendsList"; // Friends list display
import { ThemedText } from "../components/themed-text"; // Theme-aware text component
import { IconSymbol } from "../components/ui/icon-symbol"; // SF Symbols icons

// Constants and types

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Tab types for the friends screen navigation
 * - friends: Shows the user's current friends list
 * - received: Shows incoming friend requests
 * - sent: Shows outgoing friend requests (pending)
 */
type TabType = "friends" | "received" | "sent";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * FriendsScreen - Main screen for managing friendships and social connections
 *
 * Features:
 * - View current friends with their stats (streak, words learned)
 * - Search for new users by name or email
 * - Send friend requests to discovered users
 * - Manage incoming friend requests (accept/reject)
 * - Manage outgoing friend requests (cancel)
 * - Remove existing friends with confirmation
 * - Navigate to friend profiles
 *
 * The screen uses a tab-based interface to organize different friend-related views.
 */
export default function FriendsScreen() {
  // --------------------------------------------------------------------------
  // HOOKS - Core functionality hooks
  // --------------------------------------------------------------------------

  // Internationalization hook for multi-language support
  const { t } = useTranslation();

  // Authentication context - provides current logged-in user data
  const { user } = useAuth();

  // Theme context - provides dark mode state for styling
  const { isDark } = useTheme();

  // Zustand friend store - centralized state management for all friend operations
  const {
    friends, // Array of accepted friends with their profiles
    pendingRequestsReceived, // Array of incoming friend requests
    pendingRequestsSent, // Array of outgoing friend requests
    searchResults, // Array of users found via search
    loading, // Loading state for async operations
    fetchFriends, // Action: Fetch user's friends list
    fetchPendingRequests, // Action: Fetch pending friend requests
    sendFriendRequest, // Action: Send a friend request to another user
    acceptFriendRequest, // Action: Accept an incoming friend request
    rejectFriendRequest, // Action: Reject an incoming friend request
    removeFriend, // Action: Remove an existing friend or cancel sent request
    searchUsers, // Action: Search for users by name/email
    clearSearchResults, // Action: Clear search results
  } = useFriendStore();

  // --------------------------------------------------------------------------
  // LOCAL STATE - Component-level state management
  // --------------------------------------------------------------------------

  // Current active tab (friends, received requests, or sent requests)
  const [activeTab, setActiveTab] = useState<TabType>("friends");

  // User's search input for finding new friends
  const [searchQuery, setSearchQuery] = useState("");

  // Loading state specifically for search operations
  const [isSearching, setIsSearching] = useState(false);

  // --------------------------------------------------------------------------
  // EFFECTS - Data fetching and side effects
  // --------------------------------------------------------------------------

  /**
   * Initial data fetch effect
   * Runs once when component mounts or when user authentication changes
   * Fetches both the user's friends list and any pending friend requests
   */
  useEffect(() => {
    if (user?.uid) {
      fetchFriends(user.uid);
      fetchPendingRequests(user.uid);
    }
  }, [user?.uid]);

  // --------------------------------------------------------------------------
  // SEARCH HANDLERS - User search functionality
  // --------------------------------------------------------------------------

  /**
   * Handle user search submission
   * Searches Firestore for users matching the query (by name or email)
   * Excludes current user and already-connected friends from results
   */
  const handleSearch = async () => {
    if (!searchQuery.trim() || !user?.uid) return;

    setIsSearching(true);
    await searchUsers(searchQuery, user.uid);
    setIsSearching(false);
  };

  /**
   * Clear search input and results
   * Resets the search UI back to the default tab view
   */
  const handleClearSearch = () => {
    setSearchQuery("");
    clearSearchResults();
  };

  // --------------------------------------------------------------------------
  // FRIEND REQUEST HANDLERS - Send and manage friend requests
  // --------------------------------------------------------------------------

  /**
   * Send a friend request to a discovered user
   * Creates a pending friend request in Firestore
   * Shows success/error feedback via Alert
   * Clears search results on success
   *
   * @param toUserId - Firebase UID of the user to send request to
   */
  const handleSendRequest = async (toUserId: string) => {
    if (!user?.uid) return;

    try {
      await sendFriendRequest(user.uid, toUserId);
      Alert.alert(t("friends.success"), t("friends.requestSent"));
      handleClearSearch();
    } catch (error) {
      Alert.alert(
        t("friends.error"),
        error instanceof Error ? error.message : t("friends.requestFailed"),
      );
    }
  };

  /**
   * Accept an incoming friend request
   * Updates Firestore to mark request as accepted and creates friendship
   * Triggers re-fetch of friends list
   * Shows success/error feedback via Alert
   *
   * @param requestId - Firestore document ID of the friend request
   */
  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await acceptFriendRequest(requestId, user.uid);
      Alert.alert(t("friends.success"), t("friends.requestAccepted"));
    } catch (error) {
      Alert.alert(t("friends.error"), t("friends.acceptFailed"));
    }
  };

  /**
   * Reject an incoming friend request
   * Deletes the friend request from Firestore
   * Shows error feedback if operation fails (silent success)
   *
   * @param requestId - Firestore document ID of the friend request
   */
  const handleRejectRequest = async (requestId: string) => {
    if (!user?.uid) return;

    try {
      await rejectFriendRequest(requestId, user.uid);
    } catch (error) {
      Alert.alert(t("friends.error"), t("friends.rejectFailed"));
    }
  };

  // --------------------------------------------------------------------------
  // FRIEND MANAGEMENT HANDLERS - Remove friends and cancel requests
  // --------------------------------------------------------------------------

  /**
   * Remove an existing friend with confirmation dialog
   * Shows a destructive confirmation alert before proceeding
   * Removes the friendship relationship from Firestore
   * Triggered by long-press on a friend card
   *
   * @param friendshipId - Firestore document ID of the friendship
   * @param friendName - Display name of the friend (for confirmation message)
   */
  const handleRemoveFriend = (friendshipId: string, friendName: string) => {
    Alert.alert(
      t("friends.removeFriend"),
      t("friends.removeFriendConfirm", { name: friendName }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("friends.remove"),
          style: "destructive",
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await removeFriend(friendshipId, user.uid);
              Alert.alert(t("friends.success"), t("friends.friendRemoved"));
            } catch (error) {
              Alert.alert(t("friends.error"), t("friends.removeFailed"));
            }
          },
        },
      ],
    );
  };

  /**
   * Cancel an outgoing friend request with confirmation dialog
   * Shows a destructive confirmation alert before proceeding
   * Removes the pending request from Firestore
   * Triggered by the cancel button on sent request cards
   *
   * @param requestId - Firestore document ID of the friend request
   */
  const handleCancelRequest = (requestId: string) => {
    Alert.alert(t("friends.cancelRequest"), t("friends.cancelRequestConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("friends.cancelButton"),
        style: "destructive",
        onPress: async () => {
          if (!user?.uid) return;
          try {
            await removeFriend(requestId, user.uid);
          } catch (error) {
            Alert.alert(t("friends.error"), t("friends.cancelFailed"));
          }
        },
      },
    ]);
  };

  // --------------------------------------------------------------------------
  // NAVIGATION HANDLERS - Screen navigation
  // --------------------------------------------------------------------------

  /**
   * Navigate to a friend's profile screen
   * Passes the friend's user ID as a query parameter
   *
   * @param friendUserId - Firebase UID of the friend to view
   */
  const handleViewFriendProfile = (friendUserId: string) => {
    router.push(`/friend-profile?userId=${friendUserId}`);
  };

  // --------------------------------------------------------------------------
  // RENDER FUNCTIONS - UI rendering helpers
  // --------------------------------------------------------------------------

  /**
   * Render search results list
   * Displays users found via search with an "Add Friend" button
   * Shows "No users found" message when search returns empty
   */
  const renderSearchResults = () => (
    <ScrollView style={styles.searchResults}>
      {searchResults.map((result) => (
        <View
          key={result.uid}
          style={[
            styles.searchResultCard,
            { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
          ]}
        >
          <View style={styles.searchResultInfo}>
            <ThemedText style={styles.searchResultName}>
              {result.displayName}
            </ThemedText>
            <ThemedText style={styles.searchResultEmail}>
              {result.email}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendRequest(result.uid)}
          >
            <IconSymbol name="person.badge.plus" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      ))}
      {searchResults.length === 0 && !loading && (
        <ThemedText style={styles.noResults}>
          {t("friends.noUsersFound")}
        </ThemedText>
      )}
    </ScrollView>
  );

  /**
   * Render tab content based on active tab and search state
   * Priority: Search results > Tab-specific content
   *
   * Tab content:
   * - friends: Shows accepted friends with profile navigation and remove option
   * - received: Shows incoming friend requests with accept/reject actions
   * - sent: Shows outgoing friend requests with cancel action
   */
  const renderTabContent = () => {
    // If there are search results, always show them (overrides tabs)
    if (searchResults.length > 0) {
      return renderSearchResults();
    }

    // Otherwise, render content based on active tab
    switch (activeTab) {
      case "friends":
        return (
          <FriendsList
            friends={friends}
            loading={loading}
            onFriendPress={(friend) =>
              handleViewFriendProfile(friend.userProfile.uid)
            }
            onRemoveFriend={handleRemoveFriend}
          />
        );
      case "received":
        return (
          <FriendRequestsList
            requests={pendingRequestsReceived}
            loading={loading}
            type="received"
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        );
      case "sent":
        return (
          <FriendRequestsList
            requests={pendingRequestsSent}
            loading={loading}
            type="sent"
            onCancel={handleCancelRequest}
          />
        );
      default:
        return null;
    }
  };

  // --------------------------------------------------------------------------
  // MAIN RENDER - Component UI structure
  // --------------------------------------------------------------------------

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* ============================================
            HEADER SECTION
            - Back button for navigation
            - Screen title
            - Spacer for layout balance
            ============================================ */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            {t("friends.title")}
          </ThemedText>
          {/* Empty spacer to center title */}
          <View style={{ width: 44 }} />
        </View>

        {/* ============================================
            SEARCH BAR SECTION
            - Search input with magnifying glass icon
            - Clear button (X) when text is entered
            - Search submit button
            - Submit on keyboard "return" key
            ============================================ */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
            ]}
          >
            <IconSymbol
              name="magnifyingglass"
              size={20}
              color={isDark ? "#8e8e93" : "#636366"}
            />
            <TextInput
              style={[styles.searchInput, { color: isDark ? "#fff" : "#000" }]}
              placeholder={t("friends.searchPlaceholder")}
              placeholderTextColor={isDark ? "#8e8e93" : "#636366"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={20}
                  color={isDark ? "#8e8e93" : "#636366"}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={!searchQuery.trim()}
          >
            <ThemedText style={styles.searchButtonText}>
              {t("friends.search")}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* ============================================
            TABS SECTION
            - Three tabs: Friends, Received, Sent
            - Each tab shows a badge count
            - Received requests badge is highlighted (red)
            - Hidden when search results are displayed
            ============================================ */}
        {searchResults.length === 0 && (
          <View style={styles.tabs}>
            {/* Friends Tab - Shows count of current friends */}
            <TouchableOpacity
              style={[styles.tab, activeTab === "friends" && styles.activeTab]}
              onPress={() => setActiveTab("friends")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "friends" && styles.activeTabText,
                ]}
              >
                {t("friends.myFriends")}
              </ThemedText>
              {friends.length > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {friends.length}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>

            {/* Received Requests Tab - Shows count with red notification badge */}
            <TouchableOpacity
              style={[styles.tab, activeTab === "received" && styles.activeTab]}
              onPress={() => setActiveTab("received")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "received" && styles.activeTabText,
                ]}
              >
                {t("friends.received")}
              </ThemedText>
              {pendingRequestsReceived.length > 0 && (
                <View style={[styles.badge, styles.notificationBadge]}>
                  <ThemedText style={styles.badgeText}>
                    {pendingRequestsReceived.length}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>

            {/* Sent Requests Tab - Shows count of pending outgoing requests */}
            <TouchableOpacity
              style={[styles.tab, activeTab === "sent" && styles.activeTab]}
              onPress={() => setActiveTab("sent")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "sent" && styles.activeTabText,
                ]}
              >
                {t("friends.sent")}
              </ThemedText>
              {pendingRequestsSent.length > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {pendingRequestsSent.length}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================
            CONTENT SECTION
            - Dynamically renders based on active tab or search state
            - Shows FriendsList, FriendRequestsList, or search results
            ============================================ */}
        <View style={styles.content}>{renderTabContent()}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Layout containers
  container: {
    flex: 1,
  },

  // Header section styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  // Search bar styles
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Tab navigation styles
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#007AFF20", // Blue tint for active tab
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.6,
  },
  activeTabText: {
    opacity: 1,
    color: "#007AFF",
    fontWeight: "700",
  },

  // Badge styles for tab counters
  badge: {
    backgroundColor: "#8e8e93", // Gray badge
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  notificationBadge: {
    backgroundColor: "#FF3B30", // Red notification badge for received requests
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // Content area
  content: {
    flex: 1,
    marginTop: 8,
  },

  // Search results styles
  searchResults: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 13,
    opacity: 0.6,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  noResults: {
    textAlign: "center",
    marginTop: 24,
    opacity: 0.6,
  },
});
