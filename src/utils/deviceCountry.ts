import { getLocales } from "expo-localization";

const COUNTRY_NAME_FALLBACK: Record<string, string> = {
  KR: "South Korea",
  US: "United States",
};

export const getDeviceCountryCode = (): string | null =>
  getLocales()[0]?.regionCode?.toUpperCase() ?? null;

export const getDeviceCountryDisplayName = (): string | null => {
  const locale = getLocales()[0];
  const countryCode = locale?.regionCode?.toUpperCase();

  if (!countryCode) {
    return null;
  }

  const displayNamesConstructor = Intl?.DisplayNames;
  if (displayNamesConstructor) {
    const displayNames = new displayNamesConstructor(
      [locale?.languageTag ?? "en-US"],
      { type: "region" },
    );
    const countryName = displayNames.of(countryCode);
    if (countryName) {
      return countryName;
    }
  }

  return COUNTRY_NAME_FALLBACK[countryCode] ?? countryCode;
};
