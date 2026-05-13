import { buildAppResetUrl } from "../../app/reset-password";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
}));

jest.mock("../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: true }),
}));

jest.mock("../../app/(auth)/components/PasswordResetFlow", () => ({
  PasswordResetFlow: () => null,
}));

describe("reset-password route helpers", () => {
  it("builds an imagevocaapp reset deep link while preserving Firebase params", () => {
    expect(
      buildAppResetUrl({
        mode: "resetPassword",
        oobCode: "code-123",
        apiKey: "api-key",
      }),
    ).toBe(
      "imagevocaapp://reset-password?mode=resetPassword&oobCode=code-123&apiKey=api-key",
    );
  });
});
