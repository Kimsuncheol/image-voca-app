import { render } from "@testing-library/react-native";
import React from "react";
import NotificationCardScreen from "../app/notification-card";

const mockReplace = jest.fn();
let mockPayload: any = null;

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

jest.mock("../src/hooks/useNotificationCard", () => ({
  useNotificationCard: () => ({
    payload: mockPayload,
  }),
}));

jest.mock("../components/common/AppSplashScreen", () => ({
  AppSplashScreen: () => null,
}));

jest.mock("../components/notification/NotificationHeader", () => () => null);

jest.mock("../components/notification/EmptyState", () => ({
  __esModule: true,
  default: () => {
    const React = require("react");
    const { View } = require("react-native");

    return <View testID="mock-notification-empty-state" />;
  },
}));

jest.mock("../components/ads/TopInstallNativeAd", () => ({
  __esModule: true,
  TopInstallNativeAd: () => {
    const React = require("react");
    const { View } = require("react-native");

    return <View testID="mock-top-install-native-ad" />;
  },
}));

jest.mock("../components/notification/CollocationCardSection", () => ({
  __esModule: true,
  default: () => {
    const React = require("react");
    const { View } = require("react-native");

    return <View testID="mock-notification-collocation-card" />;
  },
}));

jest.mock("../components/notification/KanjiCardSection", () => ({
  __esModule: true,
  default: () => {
    const React = require("react");
    const { View } = require("react-native");

    return <View testID="mock-notification-kanji-card" />;
  },
}));

describe("NotificationCardScreen ad placement", () => {
  beforeEach(() => {
    mockPayload = null;
    mockReplace.mockClear();
  });

  it("renders the collocation notification path with the top native ad", () => {
    mockPayload = {
      type: "pop_word",
      cardKind: "collocation",
      course: "COLLOCATION",
      word: "make a decision",
      meaning: "decide",
      pronunciation: "desc",
      example: "Make a decision.",
      translation: "결정을 내리다.",
    };

    const screen = render(<NotificationCardScreen />);

    expect(screen.getByTestId("mock-notification-collocation-card")).toBeTruthy();
    expect(screen.getByTestId("mock-top-install-native-ad")).toBeTruthy();
  });

  it("renders the kanji notification path with the top native ad", () => {
    mockPayload = {
      type: "pop_word",
      cardKind: "kanji",
      course: "KANJI",
      kanji: "語",
    };

    const screen = render(<NotificationCardScreen />);

    expect(screen.getByTestId("mock-notification-kanji-card")).toBeTruthy();
    expect(screen.getByTestId("mock-top-install-native-ad")).toBeTruthy();
  });

  it("does not render the top native ad for the notification empty state", () => {
    mockPayload = null;

    const screen = render(<NotificationCardScreen />);

    expect(screen.getByTestId("mock-notification-empty-state")).toBeTruthy();
    expect(screen.queryByTestId("mock-top-install-native-ad")).toBeNull();
  });
});
