jest.mock("expo-localization", () => ({
  getLocales: jest.fn(),
}));

import { getLocales } from "expo-localization";
import {
  formatBillingPrice,
  getBillingPriceForStorefront,
  getDeviceBillingPrice,
  resolveBillingStorefront,
} from "../../src/billing/storefront";

describe("billing storefront", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns KR pricing for KR storefront", () => {
    expect(getBillingPriceForStorefront("KR")).toEqual({
      storefront: "KR",
      amount: 12_000,
      currency: "KRW",
      country: "KR",
      displayAmount: "KRW 12,000",
    });
  });

  test("returns USD pricing for US storefront", () => {
    expect(getBillingPriceForStorefront("US")).toEqual({
      storefront: "US",
      amount: 9.99,
      currency: "USD",
      country: "US",
      displayAmount: "$9.99",
    });
  });

  test("falls back to US when region code is missing or unsupported", () => {
    expect(resolveBillingStorefront(undefined)).toBe("US");
    expect(resolveBillingStorefront(null)).toBe("US");
    expect(resolveBillingStorefront("CA")).toBe("US");
  });

  test("reads KR device locale from expo-localization", () => {
    (getLocales as jest.Mock).mockReturnValue([
      {
        regionCode: "KR",
      },
    ]);

    expect(getDeviceBillingPrice()).toEqual({
      storefront: "KR",
      amount: 12_000,
      currency: "KRW",
      country: "KR",
      displayAmount: "KRW 12,000",
    });
  });

  test("formats billing prices consistently", () => {
    expect(formatBillingPrice("KRW", 12_000)).toBe("KRW 12,000");
    expect(formatBillingPrice("USD", 9.99)).toBe("$9.99");
  });
});
