import { parsePasswordResetQueryParams } from "../../src/hooks/usePasswordResetDeepLink";

jest.mock("expo-linking", () => ({
  parse: (url: string) => {
    const parsed = new URL(url);
    return {
      queryParams: Object.fromEntries(parsed.searchParams.entries()),
    };
  },
  useURL: () => null,
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
}));

describe("parsePasswordResetQueryParams", () => {
  it("reads direct Firebase reset params", () => {
    expect(
      parsePasswordResetQueryParams({
        mode: "resetPassword",
        oobCode: "direct-code",
        apiKey: "api-key",
        continueUrl: "https://example.com/after",
      }),
    ).toEqual({
      mode: "resetPassword",
      oobCode: "direct-code",
      apiKey: "api-key",
      continueUrl: "https://example.com/after",
    });
  });

  it("reads nested Firebase reset params from link", () => {
    const nestedLink = encodeURIComponent(
      "https://example.com/reset-password?mode=resetPassword&oobCode=nested-code&apiKey=api-key&continueUrl=https%3A%2F%2Fexample.com%2Fafter",
    );

    expect(parsePasswordResetQueryParams({ link: nestedLink })).toEqual({
      mode: "resetPassword",
      oobCode: "nested-code",
      apiKey: "api-key",
      continueUrl: "https://example.com/after",
    });
  });
});
