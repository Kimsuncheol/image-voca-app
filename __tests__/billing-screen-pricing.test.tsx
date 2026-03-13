import React from "react";
import { render } from "@testing-library/react-native";
import BillingScreen from "../app/billing/index";

const mockPush = jest.fn();
const mockFetchSubscription = jest.fn();
const mockGetDeviceBillingPrice = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    push: mockPush,
  }),
  useFocusEffect: (callback: () => void) => {
    callback();
  },
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      uid: "user_123",
    },
  }),
}));

jest.mock("../src/billing/storefront", () => ({
  getDeviceBillingPrice: () => mockGetDeviceBillingPrice(),
}));

jest.mock("../src/stores", () => ({
  PLANS: [
    {
      id: "free",
      name: "Free",
      features: ["Limited vocabulary access"],
    },
    {
      id: "voca_unlimited",
      name: "Voca Unlimited",
      features: ["Unlimited vocabulary access"],
      recommended: true,
    },
  ],
  useSubscriptionStore: () => ({
    currentPlan: "free",
    fetchSubscription: mockFetchSubscription,
  }),
}));

jest.mock("../components/promotion/PromotionCodeInput", () => ({
  PromotionCodeInput: () => null,
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require("react-native");
    return <Text>{children}</Text>;
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; plan?: string }) => {
      if (options?.plan) return options.plan;
      return options?.defaultValue ?? key;
    },
  }),
}));

describe("BillingScreen pricing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders USD price for US storefronts", () => {
    mockGetDeviceBillingPrice.mockReturnValue({
      storefront: "US",
      amount: 9.99,
      currency: "USD",
      country: "US",
      displayAmount: "$9.99",
    });

    const screen = render(<BillingScreen />);

    expect(screen.getByText("$9.99")).toBeTruthy();
    expect(mockFetchSubscription).toHaveBeenCalledWith("user_123");
  });

  test("renders KRW price for KR storefronts", () => {
    mockGetDeviceBillingPrice.mockReturnValue({
      storefront: "KR",
      amount: 12_000,
      currency: "KRW",
      country: "KR",
      displayAmount: "KRW 12,000",
    });

    const screen = render(<BillingScreen />);

    expect(screen.getByText("KRW 12,000")).toBeTruthy();
  });
});
