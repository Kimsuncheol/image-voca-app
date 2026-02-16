/**
 * =============================================================================
 * MEMBER ADMINISTRATION DASHBOARD
 * =============================================================================
 * Main admin screen for viewing and managing app members
 *
 * FEATURES:
 * - Admin-only access control with permission check
 * - Member list with pagination and filtering
 * - Real-time search by name or email
 * - Filter by subscription plan and user role
 * - View detailed member profiles
 * - Edit member roles (student/admin)
 * - Manage subscription plans
 * - View membership statistics
 * - Theme-aware UI (dark/light mode)
 *
 * COMPONENTS USED:
 * - StatsOverview: Displays total members and plan distribution
 * - SearchBar: Search members by name or email
 * - FilterSection: Filter by plan and role
 * - MemberCard: Individual member list item
 * - MemberDetailModal: Full member detail view with editing
 *
 * DATA SOURCES:
 * - Firestore users collection: Member profiles and roles
 * - Firestore subscriptions subcollection: Subscription data
 * - Firestore stats subcollection: Learning statistics
 *
 * PERMISSIONS:
 * - Only users with role='admin' can access this screen
 * - Non-admin users see access denied message
 * - Unauthenticated users are redirected
 *
 * WORKFLOW:
 * 1. Check user authentication and admin status
 * 2. Load all members from Firestore
 * 3. Load subscription plan counts for stats
 * 4. User can search, filter, and view members
 * 5. Tap member card to open detail modal
 * 6. Edit role or subscription in modal
 * 7. Changes are saved to Firestore
 * 8. UI updates reflect changes immediately
 * =============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import {
  getAllMembers,
  getMemberCountsByPlan,
  getMemberDetails,
  updateMemberRole,
  updateMemberSubscription,
} from "../../src/services/memberService";
import type {
  Member,
  MemberListItem,
  SubscriptionPlan,
  UserRole,
} from "../../src/types/member";

// Import extracted components
import {
  FilterSection,
  MemberCard,
  MemberDetailModal,
  SearchBar,
  StatsOverview,
} from "./components";

// =============================================================================
// COMPONENT: MembersAdmin
// =============================================================================

export default function MembersAdmin() {
  // ---------------------------------------------------------------------------
  // HOOKS & CONTEXT
  // ---------------------------------------------------------------------------
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = getStyles(isDark);

  // ---------------------------------------------------------------------------
  // STATE: Authentication & Authorization
  // ---------------------------------------------------------------------------
  /** Admin status flag (true if user has role='admin') */
  const [isAdmin, setIsAdmin] = useState(false);
  /** Loading state for admin permission check */
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // ---------------------------------------------------------------------------
  // STATE: Members List & Filtering
  // ---------------------------------------------------------------------------
  /** Complete list of all members from Firestore */
  const [members, setMembers] = useState<MemberListItem[]>([]);
  /** Loading state for members fetch operation */
  const [loadingMembers, setLoadingMembers] = useState(false);
  /** Search query for filtering by name/email */
  const [searchQuery, setSearchQuery] = useState("");
  /** Selected plan filter ('all' or specific plan) */
  const [filterPlan, setFilterPlan] = useState<SubscriptionPlan | "all">("all");
  /** Selected role filter ('all' or 'admin') */
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");

  // ---------------------------------------------------------------------------
  // STATE: Statistics
  // ---------------------------------------------------------------------------
  /** Count of members by subscription plan */
  const [planCounts, setPlanCounts] = useState<
    Record<SubscriptionPlan, number>
  >({
    free: 0,
    voca_unlimited: 0,
    voca_speaking: 0,
  });

  // ---------------------------------------------------------------------------
  // STATE: Member Detail Modal
  // ---------------------------------------------------------------------------
  /** Currently selected member for detail view */
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  /** Loading state for member details fetch */
  const [loadingDetails, setLoadingDetails] = useState(false);
  /** Modal visibility flag */
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ---------------------------------------------------------------------------
  // STATE: Edit Mode
  // ---------------------------------------------------------------------------
  /** Role editing mode flag */
  const [editingRole, setEditingRole] = useState(false);
  /** Plan editing mode flag */
  const [editingPlan, setEditingPlan] = useState(false);
  /** New role value during editing */
  const [newRole, setNewRole] = useState<UserRole>("student");
  /** New plan value during editing */
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>("free");
  /** Saving operation in progress flag */
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // EFFECT: Admin Permission Check
  // ---------------------------------------------------------------------------
  /**
   * Check if current user has admin role
   *
   * WORKFLOW:
   * 1. Verify user is authenticated
   * 2. Fetch user document from Firestore
   * 3. Check if role field equals 'admin'
   * 4. Update isAdmin state accordingly
   * 5. Set checkingAdmin to false when complete
   *
   * DEPENDENCIES:
   * - user: Re-runs when authentication state changes
   */
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === "admin") {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Admin check error:", error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // ---------------------------------------------------------------------------
  // EFFECT: Load Members on Mount
  // ---------------------------------------------------------------------------
  /**
   * Load all members and plan counts when admin access is confirmed
   *
   * DEPENDENCIES:
   * - isAdmin: Only runs when user is confirmed as admin
   */
  useEffect(() => {
    if (isAdmin) {
      loadMembers();
      loadPlanCounts();
    }
  }, [isAdmin]);

  // ---------------------------------------------------------------------------
  // HANDLER: Load Members List
  // ---------------------------------------------------------------------------
  /**
   * Fetches all members from Firestore via memberService
   *
   * DATA INCLUDES:
   * - Basic profile: uid, displayName, email, photoURL
   * - Role: student or admin
   * - Subscription: current plan
   * - Stats: streak, words learned, last active date
   */
  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const allMembers = await getAllMembers();
      setMembers(allMembers);
    } catch (error) {
      console.error("Load members error:", error);
      Alert.alert(t("common.error"), t("admin.members.loadError"));
    } finally {
      setLoadingMembers(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Load Plan Counts for Statistics
  // ---------------------------------------------------------------------------
  /**
   * Fetches count of members for each subscription plan
   * Used to populate the stats overview cards at the top
   */
  const loadPlanCounts = async () => {
    try {
      const counts = await getMemberCountsByPlan();
      setPlanCounts(counts);
    } catch (error) {
      console.error("Load plan counts error:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: View Member Details
  // ---------------------------------------------------------------------------
  /**
   * Opens member detail modal and loads full member data
   *
   * WORKFLOW:
   * 1. Set loading state and show modal
   * 2. Fetch detailed member data from Firestore
   * 3. Initialize edit mode state with current values
   * 4. Display data in modal
   *
   * @param uid - Member's unique user ID
   */
  const handleViewMember = async (uid: string) => {
    setLoadingDetails(true);
    setShowDetailModal(true);
    try {
      const details = await getMemberDetails(uid);
      if (details) {
        setSelectedMember(details);
        setNewRole(details.role);
        setNewPlan(details.subscription.planId);
      }
    } catch (error) {
      console.error("Load member details error:", error);
      Alert.alert(t("common.error"), t("admin.members.detailsError"));
      setShowDetailModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Save Role Changes
  // ---------------------------------------------------------------------------
  /**
   * Updates member's role in Firestore
   *
   * SIDE EFFECTS:
   * - Updates Firestore users/{uid}/role field
   * - Updates local state (selectedMember)
   * - Updates members list display
   * - Exits edit mode
   * - Shows success alert
   */
  const handleSaveRole = async () => {
    if (!selectedMember) return;

    setSaving(true);
    try {
      await updateMemberRole(selectedMember.uid, newRole);
      setSelectedMember({ ...selectedMember, role: newRole });
      setEditingRole(false);

      // Update list to reflect change
      setMembers((prev) =>
        prev.map((m) =>
          m.uid === selectedMember.uid ? { ...m, role: newRole } : m,
        ),
      );

      Alert.alert(t("common.success"), t("admin.members.roleUpdated"));
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("admin.members.updateError"),
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Save Subscription Plan Changes
  // ---------------------------------------------------------------------------
  /**
   * Updates member's subscription plan in Firestore
   *
   * SIDE EFFECTS:
   * - Updates Firestore subscriptions/{uid} document
   * - Updates local state (selectedMember)
   * - Updates members list display
   * - Refreshes plan counts for stats
   * - Exits edit mode
   * - Shows success alert
   */
  const handleSavePlan = async () => {
    if (!selectedMember) return;

    setSaving(true);
    try {
      await updateMemberSubscription(selectedMember.uid, newPlan, true);
      setSelectedMember({
        ...selectedMember,
        subscription: { ...selectedMember.subscription, planId: newPlan },
      });
      setEditingPlan(false);

      // Update list to reflect change
      setMembers((prev) =>
        prev.map((m) =>
          m.uid === selectedMember.uid ? { ...m, planId: newPlan } : m,
        ),
      );

      // Refresh stats to show updated counts
      loadPlanCounts();

      Alert.alert(t("common.success"), t("admin.members.planUpdated"));
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("admin.members.updateError"),
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Close Member Detail Modal
  // ---------------------------------------------------------------------------
  /**
   * Closes modal and resets all edit-related state
   */
  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedMember(null);
    setEditingRole(false);
    setEditingPlan(false);
  };

  // ---------------------------------------------------------------------------
  // COMPUTED: Filtered Members List
  // ---------------------------------------------------------------------------
  /**
   * Filters member list based on search query and filter selections
   *
   * FILTER LOGIC:
   * 1. Search Filter (optional):
   *    - Case-insensitive search
   *    - Matches against displayName OR email
   *    - Must match at least one field to pass
   *
   * 2. Plan Filter (optional):
   *    - If 'all' is selected, includes all plans
   *    - Otherwise, only includes members with matching planId
   *
   * 3. Role Filter (optional):
   *    - If 'all' is selected, includes all roles
   *    - If 'admin' is selected, only includes admin users
   *
   * PERFORMANCE:
   * - Uses useMemo to prevent unnecessary recalculation
   * - Only recomputes when dependencies change
   *
   * DEPENDENCIES:
   * - members: Raw members list
   * - searchQuery: Search text
   * - filterPlan: Selected plan filter
   * - filterRole: Selected role filter
   */
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter: Check name and email
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = member.displayName.toLowerCase().includes(query);
        const matchesEmail = member.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // Plan filter: Match subscription plan
      if (filterPlan !== "all" && member.planId !== filterPlan) {
        return false;
      }

      // Role filter: Match user role
      if (filterRole !== "all" && member.role !== filterRole) {
        return false;
      }

      return true;
    });
  }, [members, searchQuery, filterPlan, filterRole]);

  /** Total member count (before filtering) */
  const totalMembers = members.length;

  // ---------------------------------------------------------------------------
  // RENDER: Loading State (Checking Permissions)
  // ---------------------------------------------------------------------------
  /**
   * Displayed while verifying admin permissions
   * Shows spinner and loading message
   */
  if (checkingAdmin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
        <Text style={styles.loadingText}>
          {t("admin.members.checkingPermissions")}
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Access Denied State (Non-Admin Users)
  // ---------------------------------------------------------------------------
  /**
   * Displayed when user is authenticated but not an admin
   * Shows lock icon, error message, and back button
   */
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: t("admin.members.accessDenied"),
            headerBackTitle: t("common.back"),
          }}
        />
        <View style={styles.centered}>
          <Ionicons
            name="lock-closed"
            size={64}
            color={isDark ? "#666" : "#ccc"}
          />
          <Text style={styles.errorTitle}>
            {t("admin.members.accessDenied")}
          </Text>
          <Text style={styles.errorText}>
            {t("admin.members.noPermission")}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>{t("common.back")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Main Admin Dashboard (Authorized Users)
  // ---------------------------------------------------------------------------
  /**
   * Main dashboard view for admin users
   *
   * LAYOUT STRUCTURE:
   * 1. Header with navigation
   * 2. Stats Overview - Member counts by plan
   * 3. Search Bar - Filter by name/email
   * 4. Filter Section - Filter by plan and role
   * 5. Members List - Scrollable list of member cards
   * 6. Member Detail Modal - Full member view (shown on card tap)
   */
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Navigation Header */}
      <Stack.Screen
        options={{
          title: t("admin.members.title"),
          headerBackTitle: t("common.back"),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================================
            STATS OVERVIEW SECTION
            Displays total members and plan distribution
            ================================================================= */}
        <StatsOverview
          totalMembers={totalMembers}
          unlimitedCount={planCounts.voca_unlimited}
          speakingCount={planCounts.voca_speaking}
          isDark={isDark}
        />

        {/* =================================================================
            SEARCH BAR SECTION
            Real-time search by name or email
            ================================================================= */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          isDark={isDark}
        />

        {/* =================================================================
            FILTER SECTION
            Filter by subscription plan and user role
            ================================================================= */}
        <FilterSection
          selectedPlan={filterPlan}
          onPlanChange={setFilterPlan}
          selectedRole={filterRole}
          onRoleChange={setFilterRole}
          isDark={isDark}
        />

        {/* =================================================================
            MEMBERS LIST SECTION
            Scrollable list of all members with loading and empty states
            ================================================================= */}
        <View style={styles.section}>
          {/* Section Header with Refresh Button */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("admin.members.members")} ({filteredMembers.length})
            </Text>
            <TouchableOpacity onPress={loadMembers} disabled={loadingMembers}>
              <Ionicons
                name="refresh"
                size={24}
                color={isDark ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {loadingMembers ? (
            <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          ) : filteredMembers.length === 0 ? (
            /* Empty State - No members or no search results */
            <Text style={styles.emptyText}>
              {searchQuery
                ? t("admin.members.noResults")
                : t("admin.members.noMembers")}
            </Text>
          ) : (
            /* Member Cards List */
            filteredMembers.map((member) => (
              <MemberCard
                key={member.uid}
                member={member}
                onPress={() => handleViewMember(member.uid)}
                isDark={isDark}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* =================================================================
          MEMBER DETAIL MODAL
          Full-screen modal for viewing and editing member details
          ================================================================= */}
      <MemberDetailModal
        visible={showDetailModal}
        onClose={closeModal}
        member={selectedMember}
        loading={loadingDetails}
        editingRole={editingRole}
        onToggleRoleEdit={setEditingRole}
        newRole={newRole}
        onRoleChange={setNewRole}
        onSaveRole={handleSaveRole}
        editingPlan={editingPlan}
        onTogglePlanEdit={setEditingPlan}
        newPlan={newPlan}
        onPlanChange={setNewPlan}
        onSavePlan={handleSavePlan}
        saving={saving}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================
/**
 * Styles for main container and states
 * Component-specific styles have been moved to their respective component files
 *
 * REMAINING STYLES:
 * - Container: Main app container and centered layout
 * - Loading State: Permission check loading screen
 * - Access Denied State: Non-admin error screen
 * - Members List Section: Section header and empty state
 *
 * REMOVED STYLES (now in components):
 * - Stats Overview → StatsOverview.tsx
 * - Search Bar → SearchBar.tsx
 * - Filters → FilterSection.tsx
 * - Member Cards → MemberCard.tsx
 * - Modal & Detail Sections → MemberDetailModal.tsx
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    // =========================================================================
    // CONTAINER & LAYOUT
    // =========================================================================
    /** Main container - full screen with theme background */
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
    },
    /** Centered layout - for loading and error states */
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    /** Scroll view content container with padding */
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },

    // =========================================================================
    // LOADING STATE (Permission Check)
    // =========================================================================
    /** Loading text below spinner during permission check */
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? "#666" : "#999",
    },

    // =========================================================================
    // ACCESS DENIED STATE (Non-Admin Users)
    // =========================================================================
    /** Error title for access denied screen */
    errorTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    /** Error description text */
    errorText: {
      fontSize: 16,
      color: isDark ? "#666" : "#999",
      textAlign: "center",
      marginBottom: 24,
    },
    /** Back button for returning from access denied screen */
    backButton: {
      backgroundColor: "#007AFF",
      borderRadius: 12,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    /** Back button text */
    backButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },

    // =========================================================================
    // MEMBERS LIST SECTION
    // =========================================================================
    /** Section container with bottom margin */
    section: {
      marginBottom: 20,
    },
    /** Section header with title and refresh button */
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    /** Section title text (e.g., "Members (10)") */
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    /** Empty state text when no members or no search results */
    emptyText: {
      fontSize: 16,
      color: isDark ? "#666" : "#999",
      textAlign: "center",
      paddingVertical: 40,
    },
  });
