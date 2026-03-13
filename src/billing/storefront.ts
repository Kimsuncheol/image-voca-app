import { getLocales } from "expo-localization";

export type BillingStorefront = "KR" | "US";
export type BillingCurrency = "KRW" | "USD";

export interface BillingPrice {
  storefront: BillingStorefront;
  amount: number;
  currency: BillingCurrency;
  country: BillingStorefront;
  displayAmount: string;
}

const STOREFRONT_PRICES: Record<
  BillingStorefront,
  Omit<BillingPrice, "storefront" | "displayAmount">
> = {
  KR: {
    amount: 12_000,
    currency: "KRW",
    country: "KR",
  },
  US: {
    amount: 9.99,
    currency: "USD",
    country: "US",
  },
};

export const resolveBillingStorefront = (
  regionCode?: string | null,
): BillingStorefront => (regionCode?.toUpperCase() === "KR" ? "KR" : "US");

export const formatBillingPrice = (
  currency: BillingCurrency,
  amount: number,
): string => {
  if (currency === "KRW") {
    return `KRW ${amount.toLocaleString("en-US")}`;
  }

  return `$${amount.toFixed(2)}`;
};

export const getBillingPriceForStorefront = (
  storefront: BillingStorefront,
): BillingPrice => {
  const price = STOREFRONT_PRICES[storefront];

  return {
    storefront,
    ...price,
    displayAmount: formatBillingPrice(price.currency, price.amount),
  };
};

export const getDeviceBillingStorefront = (): BillingStorefront => {
  const primaryLocale = getLocales()[0];
  return resolveBillingStorefront(primaryLocale?.regionCode);
};

export const getDeviceBillingPrice = (): BillingPrice =>
  getBillingPriceForStorefront(getDeviceBillingStorefront());
