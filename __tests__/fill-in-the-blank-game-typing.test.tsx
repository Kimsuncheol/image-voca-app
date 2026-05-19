import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { FillInTheBlankGame } from "../components/course/FillInTheBlankGame";
import {
  getCurrentKeyboardLanguage,
  preferKeyboardLanguage,
} from "../src/native/keyboardLanguage";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../components/themed-text", () => ({
  ThemedText: ({ children, style }: any) => {
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return <Text style={style}>{children}</Text>;
  },
}));

jest.mock("../components/common/AppToast", () => ({
  AppToast: ({ message }: { message?: string | null }) => {
    const { Text } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );
    return message ? <Text>{message}</Text> : null;
  },
}));

jest.mock("../components/CollocationFlipCard/RoleplayRenderer", () => ({
  RoleplayRenderer: ({ content, renderText }: any) => <>{renderText(content)}</>,
}));

jest.mock("../src/native/keyboardLanguage", () => ({
  doesKeyboardLanguageMatch: (current: string, target: string) =>
    current.split("-")[0] === target,
  getCurrentKeyboardLanguage: jest.fn(async () => "en-US"),
  preferKeyboardLanguage: jest.fn(async () => "en-US"),
}));

describe("FillInTheBlankGame typed input", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderGame = (props: Partial<React.ComponentProps<typeof FillInTheBlankGame>> = {}) =>
    render(
      <FillInTheBlankGame
        word="alpha"
        courseId="TOEIC"
        clozeSentence="Pick ____."
        options={[]}
        correctAnswer="alpha"
        userAnswer=""
        showResult={false}
        onAnswer={jest.fn()}
        {...props}
      />,
    );

  it("wires the input for autofocus and native submit", () => {
    const onAnswer = jest.fn();
    const screen = renderGame({ onAnswer });
    const input = screen.getByTestId("fill-in-blank-input");

    expect(input.props.autoFocus).toBe(true);
    expect(screen.queryByText("Type the answer")).toBeNull();

    fireEvent.changeText(input, "alpha");
    expect(screen.getAllByText("alpha").length).toBeGreaterThan(0);

    fireEvent(input, "submitEditing");
    expect(onAnswer).toHaveBeenCalledWith("alpha");
  });

  it("ignores empty Enter submissions", () => {
    const onAnswer = jest.fn();
    const screen = renderGame({ onAnswer });

    fireEvent.changeText(screen.getByTestId("fill-in-blank-input"), "   ");
    fireEvent(screen.getByTestId("fill-in-blank-input"), "submitEditing");

    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("lets a blank press re-run the keyboard preference guard", () => {
    const screen = renderGame();

    fireEvent.press(screen.getByTestId("fill-in-blank-cloze-blank-0"));

    expect(preferKeyboardLanguage).toHaveBeenCalledWith("en");
    expect(getCurrentKeyboardLanguage).toHaveBeenCalled();
  });

  it("disables editing and shows accepted correct forms during result feedback", () => {
    const screen = renderGame({
      correctAnswer: "go",
      correctForms: ["went"],
      userAnswer: "went",
      showResult: true,
    });

    expect(screen.getByTestId("fill-in-blank-input").props.editable).toBe(false);
    expect(screen.getAllByText("went").length).toBeGreaterThan(0);
  });

  it("shows a toast when the active keyboard language differs", async () => {
    (getCurrentKeyboardLanguage as jest.Mock).mockResolvedValueOnce("ja-JP");
    const screen = renderGame();

    fireEvent(screen.getByTestId("fill-in-blank-input"), "focus");

    expect(await screen.findByText("Switch to the English keyboard to answer this quiz.")).toBeTruthy();
  });
});
