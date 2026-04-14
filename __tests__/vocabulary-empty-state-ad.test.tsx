import { render } from "@testing-library/react-native";
import React from "react";
import { VocabularyEmptyState } from "../components/course/vocabulary/VocabularyEmptyState";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

describe("VocabularyEmptyState", () => {
  it("does not render the top native ad", () => {
    const { queryByTestId } = render(<VocabularyEmptyState isDark={false} />);

    expect(queryByTestId("top-install-native-ad")).toBeNull();
  });
});
