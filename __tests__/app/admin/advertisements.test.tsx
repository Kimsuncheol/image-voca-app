import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import { getDoc } from "firebase/firestore";
import React from "react";
import { Alert } from "react-native";
import AdvertisementsAdmin from "../../../app/admin/advertisements";
import { useAuth } from "../../../src/context/AuthContext";
import {
  deleteAdvertisement,
  getAllAdvertisements,
  toggleAdStatus,
} from "../../../src/services/advertisementService";

// Mock @expo/vector-icons to prevent NativeModules errors
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// Mock dependencies
jest.mock("expo-router", () => ({
  Stack: {
    Screen: jest.fn(() => null),
  },
  useRouter: jest.fn(),
}));

jest.mock("../../../src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../src/context/ThemeContext", () => ({
  useTheme: jest.fn(() => ({ isDark: false })),
}));

// Mock Firebase
jest.mock("../../../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock Services
jest.mock("../../../src/services/advertisementService", () => ({
  getAllAdvertisements: jest.fn(),
  deleteAdvertisement: jest.fn(),
  toggleAdStatus: jest.fn(),
}));

// Mock Child Components
// Note: We mock the specific path imported in the component
jest.mock("../../../app/admin/advertisements/components", () => ({
  AdForm: ({ onAdCreated }: any) => {
    const { View, Button } = require("react-native");
    return (
      <View testID="ad-form">
        <Button
          testID="trigger-created"
          title="Trigger Created"
          onPress={onAdCreated}
        />
      </View>
    );
  },
  AdList: ({ ads, loading, onRefresh, onDelete, onToggleStatus }: any) => {
    const { View, Button, Text } = require("react-native");
    return (
      <View testID="ad-list">
        <Text>Ad List Count: {ads?.length}</Text>
        <Button
          testID="trigger-delete"
          title="Trigger Delete"
          onPress={() => onDelete("1")}
        />
        <Button
          testID="trigger-toggle"
          title="Trigger Toggle"
          onPress={() => onToggleStatus("1", false)}
        />
      </View>
    );
  },
}));

describe("AdvertisementsAdmin", () => {
  const mockRouter = { back: jest.fn() };
  const mockUser = { uid: "test-user-id" };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.spyOn(Alert, "alert");
  });

  describe("Permissions", () => {
    it("renders access denied for non-admin users", async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "user" }),
      });

      const { getByText } = render(<AdvertisementsAdmin />);

      await waitFor(() => {
        expect(getByText("Access Denied")).toBeTruthy();
        expect(getByText("Go Back")).toBeTruthy();
      });
    });

    it("renders admin interface for admin users", async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "admin" }),
      });
      (getAllAdvertisements as jest.Mock).mockResolvedValue([]);

      const { getByText } = render(<AdvertisementsAdmin />);

      await waitFor(() => {
        expect(getByText("Add Advertisement")).toBeTruthy();
        expect(getByText("Manage Ads")).toBeTruthy();
      });
    });
  });

  describe("Functionality", () => {
    beforeEach(() => {
      // Setup successful admin login for these tests
      (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ role: "admin" }),
      });
    });

    it("defaults to 'Add Advertisement' tab", async () => {
      const { getByTestId, queryByTestId, getByText } = render(
        <AdvertisementsAdmin />,
      );

      await waitFor(() => {
        expect(getByText("Add Advertisement")).toBeTruthy();
      });

      // AdForm should be visible
      expect(getByTestId("ad-form")).toBeTruthy();
      // AdList should not be visible
      expect(queryByTestId("ad-list")).toBeNull();
    });

    it("switches to 'Manage Ads' tab and loads ads", async () => {
      const mockAds = [{ id: "1", title: "Ad 1" }];
      (getAllAdvertisements as jest.Mock).mockResolvedValue(mockAds);

      const { getByText, getByTestId, queryByTestId } = render(
        <AdvertisementsAdmin />,
      );

      // Wait for load
      await waitFor(() => expect(getByText("Add Advertisement")).toBeTruthy());

      // Click Manage Ads tab
      fireEvent.press(getByText("Manage Ads"));

      await waitFor(() => {
        expect(queryByTestId("ad-form")).toBeNull();
        expect(getByTestId("ad-list")).toBeTruthy();
        expect(getAllAdvertisements).toHaveBeenCalled();
        expect(getByText("Ad List Count: 1")).toBeTruthy();
      });
    });

    it("reloads ads when an ad is created", async () => {
      (getAllAdvertisements as jest.Mock).mockResolvedValue([{ id: "1" }]);
      const { getByTestId } = render(<AdvertisementsAdmin />);

      await waitFor(() => expect(getByTestId("ad-form")).toBeTruthy());

      // Trigger creation callback
      fireEvent.press(getByTestId("trigger-created"));

      await waitFor(() => {
        // Should switch to list
        expect(getByTestId("ad-list")).toBeTruthy();
        expect(getAllAdvertisements).toHaveBeenCalled();
      });
    });

    it("handles delete ad interaction", async () => {
      const mockAds = [{ id: "1", title: "Ad 1" }];
      (getAllAdvertisements as jest.Mock).mockResolvedValue(mockAds);
      (deleteAdvertisement as jest.Mock).mockResolvedValue(undefined);

      const { getByText, getByTestId } = render(<AdvertisementsAdmin />);

      // Go to manage tab
      await waitFor(() => expect(getByText("Add Advertisement")).toBeTruthy());
      fireEvent.press(getByText("Manage Ads"));
      await waitFor(() => expect(getByTestId("ad-list")).toBeTruthy());

      // Trigger delete
      fireEvent.press(getByTestId("trigger-delete"));

      // Alert should be shown
      expect(Alert.alert).toHaveBeenCalled();

      // We need to simulate pressing "Delete" in the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      // Alert.alert(title, message, buttons)
      const buttons = alertCalls[0][2];
      const deleteButton = buttons.find((b: any) => b.text === "Delete");

      // Execute the delete action
      await deleteButton.onPress();

      expect(deleteAdvertisement).toHaveBeenCalledWith("1");
      expect(getAllAdvertisements).toHaveBeenCalledTimes(2); // Initial load + reload
    });

    it("handles toggle status interaction", async () => {
      const mockAds = [{ id: "1", title: "Ad 1", active: true }];
      (getAllAdvertisements as jest.Mock).mockResolvedValue(mockAds);
      (toggleAdStatus as jest.Mock).mockResolvedValue(undefined);

      const { getByText, getByTestId } = render(<AdvertisementsAdmin />);

      // Go to manage
      await waitFor(() => expect(getByText("Add Advertisement")).toBeTruthy());
      fireEvent.press(getByText("Manage Ads"));
      await waitFor(() => expect(getByTestId("ad-list")).toBeTruthy());

      // Trigger toggle
      fireEvent.press(getByTestId("trigger-toggle"));

      await waitFor(() => {
        expect(toggleAdStatus).toHaveBeenCalledWith("1", false);
        expect(getAllAdvertisements).toHaveBeenCalledTimes(2);
      });
    });
  });
});
