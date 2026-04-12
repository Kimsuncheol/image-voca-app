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
  "settings.notifications.push": "Push Notifications",
  "settings.notifications.studyReminder": "Study Reminder",
  "settings.notifications.wordOfTheDay": "Word of the Day",
  "settings.notifications.muteAtNight": "Mute at Night",
  "settings.notifications.permissionRequired":
    "Notifications are blocked. Tap to open Settings.",
};

const t = (key: string) => translations[key] ?? key;

describe("NotificationsSection", () => {
  it("renders the mute at night row", () => {
    const screen = render(
      <NotificationsSection
        styles={styles}
        isDark={false}
        pushEnabled
        notificationPermissionDenied={false}
        studyReminderEnabled
        popWordEnabled
        muteAtNightEnabled
        onTogglePush={jest.fn()}
        onToggleStudyReminder={jest.fn()}
        onTogglePopWord={jest.fn()}
        onToggleMuteAtNight={jest.fn()}
        onOpenPermissionSettings={jest.fn()}
        t={t}
      />,
    );

    expect(screen.getByText("Mute at Night")).toBeTruthy();
  });

  it("calls the mute at night handler when the toggle is pressed", () => {
    const onToggleMuteAtNight = jest.fn();

    const screen = render(
      <NotificationsSection
        styles={styles}
        isDark={false}
        pushEnabled
        notificationPermissionDenied={false}
        studyReminderEnabled
        popWordEnabled
        muteAtNightEnabled
        onTogglePush={jest.fn()}
        onToggleStudyReminder={jest.fn()}
        onTogglePopWord={jest.fn()}
        onToggleMuteAtNight={onToggleMuteAtNight}
        onOpenPermissionSettings={jest.fn()}
        t={t}
      />,
    );

    fireEvent.press(screen.getAllByTestId("toggle-on")[3]);

    expect(onToggleMuteAtNight).toHaveBeenCalledWith(false);
  });
});
