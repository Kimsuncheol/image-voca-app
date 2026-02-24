import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { AccountActionsSection } from "../../../components/profile/AccountActionsSection";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("AccountActionsSection", () => {
  const styles = {
    section: {},
    sectionTitle: {},
    card: {},
    actionOption: {},
    actionText: {},
    separator: {},
    dangerOption: {},
    dangerText: {},
  };

  const t = (key: string) => {
    const map: Record<string, string> = {
      "profile.sections.accountActions": "Account Actions",
      "profile.resetPassword.title": "Reset Password",
      "profile.delete.title": "Delete Account",
      "profile.delete.processing": "Processing...",
    };
    return map[key] ?? key;
  };

  it("shows reset password for admin and hides delete account", () => {
    const { getByText, queryByText } = render(
      <AccountActionsSection
        styles={styles}
        loading={false}
        isAdmin={true}
        onResetPassword={jest.fn()}
        onDeleteAccount={jest.fn()}
        t={t}
      />,
    );

    expect(getByText("Reset Password")).toBeTruthy();
    expect(queryByText("Delete Account")).toBeNull();
  });

  it("shows both reset and delete for non-admin", () => {
    const { getByText } = render(
      <AccountActionsSection
        styles={styles}
        loading={false}
        isAdmin={false}
        onResetPassword={jest.fn()}
        onDeleteAccount={jest.fn()}
        t={t}
      />,
    );

    expect(getByText("Reset Password")).toBeTruthy();
    expect(getByText("Delete Account")).toBeTruthy();
  });

  it("calls reset handler when reset password is pressed", () => {
    const onResetPassword = jest.fn();

    const { getByText } = render(
      <AccountActionsSection
        styles={styles}
        loading={false}
        isAdmin={false}
        onResetPassword={onResetPassword}
        onDeleteAccount={jest.fn()}
        t={t}
      />,
    );

    fireEvent.press(getByText("Reset Password"));

    expect(onResetPassword).toHaveBeenCalledTimes(1);
  });
});
