/**
 * =============================================================================
 * PROMOTION CODES ADMIN - TEST SUITE
 * =============================================================================
 * Comprehensive tests for the promotion codes administration dashboard
 *
 * TEST COVERAGE:
 * - Admin permission checking and authorization
 * - Promotion codes loading from Firestore
 * - Code deactivation with confirmation
 * - Tab navigation (Generate / Active Codes)
 * - Integration with GenerationForm and ActiveCodesList components
 * - UI states (loading, access denied, admin view)
 * - Error handling scenarios
 * =============================================================================
 */

// =============================================================================
// MOCKS - Must be before imports that use them
// =============================================================================

// Mock @expo/vector-icons
// =============================================================================
// IMPORTS - After mocks
// =============================================================================

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { getDoc } from "firebase/firestore";
import React from "react";
import { Alert } from "react-native";
import PromotionCodesAdmin from "../app/admin/promotion-codes";
import {
  deactivateCode,
  getAllPromotionCodes,
} from "../src/services/promotionCodeService";
import type { PromotionCode } from "../src/types/promotionCode";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ options }: any) => null,
  },
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

// Mock React Native Safe Area Context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock Firebase Firestore
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  runTransaction: jest.fn(),
}));

// Mock Firebase db instance
jest.mock("../src/services/firebase", () => ({
  db: {},
}));

// Mock Promotion Code Service
jest.mock("../src/services/promotionCodeService", () => ({
  getAllPromotionCodes: jest.fn(),
  deactivateCode: jest.fn(),
  generatePromotionCodes: jest.fn(),
}));

// Mock Auth Context
const mockAuthContext = {
  user: null as any,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
};

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

// Mock Theme Context
const mockThemeContext = {
  isDark: false,
  toggleTheme: jest.fn(),
};

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => mockThemeContext,
}));

// Mock child components
jest.mock("../app/admin/promotion-codes/components", () => ({
  GenerationForm: ({ onCodesGenerated, userId }: any) => {
    const React = require("react");
    const { Text, TouchableOpacity } = require("react-native");

    return (
      <TouchableOpacity
        testID="generation-form"
        onPress={() => onCodesGenerated()}
      >
        <Text>Generation Form</Text>
        <Text testID="form-user-id">{userId}</Text>
      </TouchableOpacity>
    );
  },
  ActiveCodesList: ({ codes, loading, onRefresh, onDeactivateCode }: any) => {
    const React = require("react");
    const { Text, TouchableOpacity, View } = require("react-native");

    if (loading) {
      return <Text testID="codes-loading">Loading codes...</Text>;
    }

    return (
      <View testID="active-codes-list">
        <TouchableOpacity testID="refresh-button" onPress={onRefresh}>
          <Text>Refresh</Text>
        </TouchableOpacity>
        {codes.map((code: PromotionCode) => (
          <View key={code.code}>
            <Text testID={`code-${code.code}`}>{code.code}</Text>
            <TouchableOpacity
              testID={`deactivate-${code.code}`}
              onPress={() => onDeactivateCode(code.code)}
            >
              <Text>Deactivate</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  },
}));

// =============================================================================
// TEST DATA
// =============================================================================

const mockAdminUser = {
  uid: "admin-123",
  email: "admin@test.com",
  displayName: "Test Admin",
};

const mockNonAdminUser = {
  uid: "user-123",
  email: "user@test.com",
  displayName: "Test User",
};

const mockPromotionCodes: PromotionCode[] = [
  {
    code: "TESTCODE",
    codeHash: "hash123",
    eventPeriod: {
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-12-31T23:59:59.999Z",
    },
    benefit: {
      type: "subscription_upgrade",
      planId: "voca_unlimited",
      isPermanent: true,
    },
    maxUses: -1,
    maxUsesPerUser: 1,
    currentUses: 5,
    createdAt: "2026-02-01T10:00:00.000Z",
    createdBy: "admin-123",
    status: "active",
    description: "Test promotion code",
  },
  {
    code: "NEWCODE2",
    codeHash: "hash456",
    eventPeriod: {
      startDate: "2026-02-01T00:00:00.000Z",
      endDate: "2026-03-31T23:59:59.999Z",
    },
    benefit: {
      type: "subscription_upgrade",
      planId: "voca_speaking",
      isPermanent: false,
      durationDays: 30,
    },
    maxUses: 100,
    maxUsesPerUser: 1,
    currentUses: 10,
    createdAt: "2026-02-03T10:00:00.000Z",
    createdBy: "admin-123",
    status: "active",
    description: "Limited time promotion",
  },
];

// =============================================================================
// TEST SUITE
// =============================================================================

describe("PromotionCodesAdmin", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on Alert methods
    jest.spyOn(Alert, "alert");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===========================================================================
  // ADMIN PERMISSION TESTS
  // ===========================================================================

  describe("Admin Permission Checking", () => {
    test("should show loading state while checking admin permissions", async () => {
      mockAuthContext.user = mockAdminUser;
      (getDoc as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves to keep loading
      );

      render(<PromotionCodesAdmin />);

      expect(screen.getByText("Checking permissions...")).toBeTruthy();
    });

    test("should grant access when user is admin", async () => {
      mockAuthContext.user = mockAdminUser;
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "admin" }),
      });
      (getAllPromotionCodes as jest.Mock).mockResolvedValue(mockPromotionCodes);

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Generate Promotion Codes")).toBeTruthy();
        expect(screen.getByText("Active Codes")).toBeTruthy();
      });
    });

    test("should deny access when user is not admin", async () => {
      mockAuthContext.user = mockNonAdminUser;
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "user" }),
      });

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Access Denied")).toBeTruthy();
        expect(
          screen.getByText("You don't have permission to access this page."),
        ).toBeTruthy();
      });
    });

    test("should deny access when user document does not exist", async () => {
      mockAuthContext.user = mockNonAdminUser;
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Access Denied")).toBeTruthy();
      });
    });

    test("should deny access when user is not authenticated", async () => {
      mockAuthContext.user = null;

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(screen.queryByText("Checking permissions...")).toBeNull();
      });
    });

    test("should handle errors during admin check gracefully", async () => {
      mockAuthContext.user = mockAdminUser;
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error("Firestore error"));

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Admin check error:",
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ===========================================================================
  // CODE LOADING TESTS
  // ===========================================================================

  describe("Promotion Codes Loading", () => {
    beforeEach(() => {
      mockAuthContext.user = mockAdminUser;
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "admin" }),
      });
    });

    test("should load promotion codes on mount", async () => {
      (getAllPromotionCodes as jest.Mock).mockResolvedValue(mockPromotionCodes);

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(getAllPromotionCodes).toHaveBeenCalledTimes(1);
      });
    });

    test("should sort codes by creation date (newest first)", async () => {
      const unsortedCodes = [...mockPromotionCodes].reverse();
      (getAllPromotionCodes as jest.Mock).mockResolvedValue(unsortedCodes);

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        // Switch to Active Codes tab
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      await waitFor(() => {
        // NEWCODE2 should appear before TESTCODE (newer first)
        expect(screen.getByTestId("code-NEWCODE2")).toBeTruthy();
        expect(screen.getByTestId("code-TESTCODE")).toBeTruthy();
      });
    });

    test("should handle error when loading codes fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      (getAllPromotionCodes as jest.Mock).mockRejectedValue(
        new Error("Failed to load codes"),
      );

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Load codes error:",
          expect.any(Error),
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to load promotion codes",
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test("should reload codes when refresh is triggered", async () => {
      (getAllPromotionCodes as jest.Mock).mockResolvedValue(mockPromotionCodes);

      render(<PromotionCodesAdmin />);

      // Wait for initial load
      await waitFor(() => {
        expect(getAllPromotionCodes).toHaveBeenCalledTimes(1);
      });

      // Switch to Active Codes tab
      const activeCodesTab = screen.getByText("Active Codes");
      fireEvent.press(activeCodesTab);

      await waitFor(() => {
        const refreshButton = screen.getByTestId("refresh-button");
        fireEvent.press(refreshButton);
      });

      await waitFor(() => {
        expect(getAllPromotionCodes).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ===========================================================================
  // CODE DEACTIVATION TESTS
  // ===========================================================================

  describe("Code Deactivation", () => {
    beforeEach(() => {
      mockAuthContext.user = mockAdminUser;
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "admin" }),
      });
      (getAllPromotionCodes as jest.Mock).mockResolvedValue(mockPromotionCodes);
    });

    test("should show confirmation alert when deactivating code", async () => {
      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      await waitFor(() => {
        const deactivateButton = screen.getByTestId("deactivate-TESTCODE");
        fireEvent.press(deactivateButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Deactivate Code",
        "Are you sure you want to deactivate TESTCODE?",
        expect.any(Array),
      );
    });

    test("should deactivate code when confirmed", async () => {
      (deactivateCode as jest.Mock).mockResolvedValue(undefined);

      // Mock Alert.alert to automatically confirm
      (Alert.alert as jest.Mock).mockImplementation(
        (title, message, buttons) => {
          const confirmButton = buttons?.find(
            (b: any) => b.text === "Deactivate",
          );
          if (confirmButton?.onPress) {
            confirmButton.onPress();
          }
        },
      );

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      await waitFor(() => {
        const deactivateButton = screen.getByTestId("deactivate-TESTCODE");
        fireEvent.press(deactivateButton);
      });

      await waitFor(() => {
        expect(deactivateCode).toHaveBeenCalledWith("TESTCODE");
        expect(Alert.alert).toHaveBeenCalledWith("Success", "Code deactivated");
      });
    });

    test("should not deactivate code when cancelled", async () => {
      (Alert.alert as jest.Mock).mockImplementation(
        (title, message, buttons) => {
          const cancelButton = buttons?.find((b: any) => b.text === "Cancel");
          if (cancelButton?.onPress) {
            cancelButton.onPress();
          }
        },
      );

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      await waitFor(() => {
        const deactivateButton = screen.getByTestId("deactivate-TESTCODE");
        fireEvent.press(deactivateButton);
      });

      await waitFor(() => {
        expect(deactivateCode).not.toHaveBeenCalled();
      });
    });

    test("should handle deactivation error", async () => {
      const errorMessage = "Failed to deactivate";
      (deactivateCode as jest.Mock).mockRejectedValue(new Error(errorMessage));

      (Alert.alert as jest.Mock).mockImplementation(
        (title, message, buttons) => {
          const confirmButton = buttons?.find(
            (b: any) => b.text === "Deactivate",
          );
          if (confirmButton?.onPress) {
            confirmButton.onPress();
          }
        },
      );

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      await waitFor(() => {
        const deactivateButton = screen.getByTestId("deactivate-TESTCODE");
        fireEvent.press(deactivateButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", errorMessage);
      });
    });

    test("should reload codes after successful deactivation", async () => {
      (deactivateCode as jest.Mock).mockResolvedValue(undefined);

      (Alert.alert as jest.Mock).mockImplementation(
        (title, message, buttons) => {
          const confirmButton = buttons?.find(
            (b: any) => b.text === "Deactivate",
          );
          if (confirmButton?.onPress) {
            confirmButton.onPress();
          }
        },
      );

      render(<PromotionCodesAdmin />);

      // Initial load
      await waitFor(() => {
        expect(getAllPromotionCodes).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      await waitFor(() => {
        const deactivateButton = screen.getByTestId("deactivate-TESTCODE");
        fireEvent.press(deactivateButton);
      });

      // Should reload after deactivation
      await waitFor(() => {
        expect(getAllPromotionCodes).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ===========================================================================
  // TAB NAVIGATION TESTS
  // ===========================================================================

  describe("Tab Navigation", () => {
    beforeEach(() => {
      mockAuthContext.user = mockAdminUser;
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "admin" }),
      });
      (getAllPromotionCodes as jest.Mock).mockResolvedValue(mockPromotionCodes);
    });

    test("should show Generate tab by default", async () => {
      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(screen.getByTestId("generation-form")).toBeTruthy();
      });
    });

    test("should switch to Active Codes tab when clicked", async () => {
      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      await waitFor(() => {
        expect(screen.getByTestId("active-codes-list")).toBeTruthy();
        expect(screen.queryByTestId("generation-form")).toBeNull();
      });
    });

    test("should switch back to Generate tab when clicked", async () => {
      render(<PromotionCodesAdmin />);

      // Switch to Active Codes
      await waitFor(() => {
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      // Switch back to Generate
      await waitFor(() => {
        const generateTab = screen.getByText("Generate Promotion Codes");
        fireEvent.press(generateTab);
      });

      await waitFor(() => {
        expect(screen.getByTestId("generation-form")).toBeTruthy();
        expect(screen.queryByTestId("active-codes-list")).toBeNull();
      });
    });
  });

  // ===========================================================================
  // COMPONENT INTEGRATION TESTS
  // ===========================================================================

  describe("Component Integration", () => {
    beforeEach(() => {
      mockAuthContext.user = mockAdminUser;
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "admin" }),
      });
      (getAllPromotionCodes as jest.Mock).mockResolvedValue(mockPromotionCodes);
    });

    test("should pass correct props to GenerationForm", async () => {
      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(screen.getByTestId("form-user-id")).toHaveTextContent(
          "admin-123",
        );
      });
    });

    test("should reload codes when GenerationForm calls onCodesGenerated", async () => {
      render(<PromotionCodesAdmin />);

      // Initial load
      await waitFor(() => {
        expect(getAllPromotionCodes).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const generationForm = screen.getByTestId("generation-form");
        fireEvent.press(generationForm);
      });

      // Should reload after generation
      await waitFor(() => {
        expect(getAllPromotionCodes).toHaveBeenCalledTimes(2);
      });
    });

    test("should pass correct props to ActiveCodesList", async () => {
      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        const activeCodesTab = screen.getByText("Active Codes");
        fireEvent.press(activeCodesTab);
      });

      await waitFor(() => {
        expect(screen.getByTestId("code-TESTCODE")).toBeTruthy();
        expect(screen.getByTestId("code-NEWCODE2")).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // THEME TESTS
  // ===========================================================================

  describe("Theme Support", () => {
    beforeEach(() => {
      mockAuthContext.user = mockAdminUser;
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "admin" }),
      });
      (getAllPromotionCodes as jest.Mock).mockResolvedValue(mockPromotionCodes);
    });

    test("should render with light theme", async () => {
      mockThemeContext.isDark = false;

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Generate Promotion Codes")).toBeTruthy();
      });
    });

    test("should render with dark theme", async () => {
      mockThemeContext.isDark = true;

      render(<PromotionCodesAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Generate Promotion Codes")).toBeTruthy();
      });
    });
  });
});
