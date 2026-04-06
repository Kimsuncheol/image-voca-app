import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Dimensions } from "react-native";
import { DashboardLayoutModal } from "../../../components/settings/DashboardLayoutModal";
import {
  type DashboardElement,
  useDashboardSettingsStore,
} from "../../../src/stores/dashboardSettingsStore";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.dashboard.layoutModal.title": "Layout",
        "settings.dashboard.layoutModal.hint": "Choose a layout preset",
        "settings.dashboard.layoutModal.quizFirst": "Quiz First",
        "settings.dashboard.layoutModal.quoteFirst": "Quote First",
      };

      return translations[key] ?? key;
    },
  }),
}));

jest.mock("react-native-reanimated", () => {
  const { FlatList, View } = jest.requireActual("react-native");
  const Reanimated = jest.requireActual("react-native-reanimated/mock");
  Reanimated.default = Reanimated;
  Reanimated.View = View;
  Reanimated.FlatList = FlatList;
  Reanimated.useAnimatedStyle = (updater: () => object) => updater();
  Reanimated.useAnimatedScrollHandler = () => jest.fn();
  return Reanimated;
});

describe("DashboardLayoutModal", () => {
  const defaultOrder: DashboardElement[] = ["quiz", "famousQuote"];
  const quoteFirstOrder: DashboardElement[] = ["famousQuote", "quiz"];

  beforeEach(() => {
    jest.clearAllMocks();
    useDashboardSettingsStore.setState((state) => ({
      ...state,
      quizEnabled: true,
      famousQuoteEnabled: true,
      elementOrder: defaultOrder,
      _initialized: true,
    }));
  });

  it("renders the second preset as selected when the store matches it", () => {
    useDashboardSettingsStore.setState((state) => ({
      ...state,
      elementOrder: quoteFirstOrder,
    }));

    const { getByTestId, queryByTestId } = render(
      <DashboardLayoutModal visible={true} onClose={jest.fn()} isDark={false} />,
    );

    expect(getByTestId("preset-radio-1-selected")).toBeTruthy();
    expect(queryByTestId("preset-radio-0-selected")).toBeNull();
  });

  it("updates the store when a different preset card is tapped", async () => {
    const { getByTestId } = render(
      <DashboardLayoutModal visible={true} onClose={jest.fn()} isDark={false} />,
    );

    fireEvent.press(getByTestId("preset-card-1"));

    await waitFor(() => {
      expect(useDashboardSettingsStore.getState().elementOrder).toEqual(
        quoteFirstOrder,
      );
    });

    expect(getByTestId("preset-radio-1-selected")).toBeTruthy();
  });

  it("configures the list as a snapping horizontal carousel", () => {
    const { getByTestId } = render(
      <DashboardLayoutModal visible={true} onClose={jest.fn()} isDark={false} />,
    );

    const carousel = getByTestId("dashboard-layout-carousel");
    const expectedCardWidth = Dimensions.get("window").width * 0.75;

    expect(carousel.props.horizontal).toBe(true);
    expect(carousel.props.decelerationRate).toBe("fast");
    expect(carousel.props.disableIntervalMomentum).toBe(true);
    expect(carousel.props.snapToInterval).toBeGreaterThan(0);
    expect(carousel.props.snapToInterval).toBe(expectedCardWidth + 12);
  });
});
