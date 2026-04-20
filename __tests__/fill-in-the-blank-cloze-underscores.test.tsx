import { render } from "@testing-library/react-native";
import React from "react";
import { FillInTheBlankGameClozeSentenceCard } from "../components/course/FillInTheBlankGameClozeSentenceCard";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, style }: any) => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text style={style}>{children}</Text>;
  },
}));

jest.mock("../components/CollocationFlipCard/RoleplayRenderer", () => ({
  RoleplayRenderer: ({ content, renderText }: any) => <>{renderText(content)}</>,
}));

describe("FillInTheBlankGameClozeSentenceCard", () => {
  it("renders underscore runs as blanks", () => {
    const screen = render(
      <FillInTheBlankGameClozeSentenceCard
        clozeSentence="Alpha __ beta _____ gamma."
        userAnswer="word"
      />,
    );

    expect(screen.getAllByText("word")).toHaveLength(2);
    expect(screen.queryByText("__")).toBeNull();
    expect(screen.queryByText("_____")).toBeNull();
  });
});
