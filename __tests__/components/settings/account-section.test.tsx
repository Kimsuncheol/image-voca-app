import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { AccountSection } from "../../../components/settings/AccountSection";

const mockLinkPress = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactElement }) => {
    const React = jest.requireActual("react");
    return React.cloneElement(children, {
      onPress: () => mockLinkPress(href),
    });
  },
}));

describe("AccountSection", () => {
  const styles = {
    section: {},
    sectionTitle: {},
    card: {},
    option: {},
    optionLeft: {},
    optionText: {},
    separator: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("includes a Manage Devices row that navigates to the screen", () => {
    const { getByText } = render(
      <AccountSection
        styles={styles}
        isDark={false}
        t={(key) =>
          ({
            "settings.account.title": "Account",
            "settings.account.profile": "Profile",
            "settings.account.manageDevices": "Manage Devices",
            "settings.account.billing": "Billing & Plans",
          })[key] || key
        }
      />,
    );

    fireEvent.press(getByText("Manage Devices"));

    expect(mockLinkPress).toHaveBeenCalledWith("/manage-devices");
  });
});
