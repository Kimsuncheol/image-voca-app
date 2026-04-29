import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { NotificationsSection } from "../components/settings/NotificationsSection";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../components/common/ToggleSwitch", () => ({
  ToggleSwitch: ({
    value,
    onValueChange,
  }: {
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => {
    const ReactNative = require("react-native");
    return (
      <ReactNative.Pressable
        testID={`toggle-${value ? "on" : "off"}`}
        onPress={() => onValueChange(!value)}
      >
        <ReactNative.Text>{value ? "on" : "off"}</ReactNative.Text>
      </ReactNative.Pressable>
    );
  },
}));

const styles = {
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14 },
  card: { borderRadius: 10 },
  option: { flexDirection: "row", justifyContent: "space-between" },
  optionLeft: { flexDirection: "row", alignItems: "center" },
  optionText: { fontSize: 17 },
  separator: { height: 1 },
};

const translations: Record<string, string> = {
  "settings.notifications.title": "Notifications",
  "settings.notifications.studyReminder": "Study Reminder",
  "settings.notifications.permissionRequired":
    "Notifications are blocked. Tap to open Settings.",
};

const t = (key: string) => translations[key] ?? key;

describe("NotificationsSection", () => {
  it("renders the study reminder row only", () => {
    const screen = render(
      <NotificationsSection
        styles={styles}
        isDark={false}
        notificationPermissionDenied={false}
        studyReminderEnabled
        onToggleStudyReminder={jest.fn()}
        onOpenPermissionSettings={jest.fn()}
        t={t}
      />,
    );

    expect(screen.getByText("Study Reminder")).toBeTruthy();
    expect(screen.queryByText("Push Notifications")).toBeNull();
    expect(screen.queryByText("Word of the Day")).toBeNull();
    expect(screen.queryByText("Mute at Night")).toBeNull();
  });

  it("shows the permission warning when notifications are blocked", () => {
    const screen = render(
      <NotificationsSection
        styles={styles}
        isDark={false}
        notificationPermissionDenied
        studyReminderEnabled={false}
        onToggleStudyReminder={jest.fn()}
        onOpenPermissionSettings={jest.fn()}
        t={t}
      />,
    );

    expect(
      screen.getByText("Notifications are blocked. Tap to open Settings."),
    ).toBeTruthy();
  });

  it("calls the study reminder handler when the toggle is pressed", () => {
    const onToggleStudyReminder = jest.fn();

    const screen = render(
      <NotificationsSection
        styles={styles}
        isDark={false}
        notificationPermissionDenied={false}
        studyReminderEnabled
        onToggleStudyReminder={onToggleStudyReminder}
        onOpenPermissionSettings={jest.fn()}
        t={t}
      />,
    );

    fireEvent.press(screen.getByTestId("toggle-on"));

    expect(onToggleStudyReminder).toHaveBeenCalledWith(false);
  });
});
