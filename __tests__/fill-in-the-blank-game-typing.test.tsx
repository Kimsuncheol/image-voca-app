import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Keyboard } from "react-native";
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
  let keyboardDidHideHandler: (() => void) | undefined;
  let keyboardAddListenerSpy: jest.SpyInstance;
  let keyboardDismissSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    keyboardDidHideHandler = undefined;
    keyboardAddListenerSpy = jest
      .spyOn(Keyboard, "addListener")
      .mockImplementation((eventName: any, handler: any) => {
        if (eventName === "keyboardDidHide") {
          keyboardDidHideHandler = handler;
        }
        return { remove: jest.fn() } as any;
      });
    keyboardDismissSpy = jest.spyOn(Keyboard, "dismiss").mockImplementation();
  });

  afterEach(() => {
    keyboardAddListenerSpy.mockRestore();
    keyboardDismissSpy.mockRestore();
    jest.useRealTimers();
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
    expect(input.props.submitBehavior).toBe("submit");
    expect(input.props.blurOnSubmit).toBe(false);
    expect(screen.queryByText("Type the answer")).toBeNull();

    fireEvent.changeText(input, "alpha");
    expect(screen.getAllByText("alpha").length).toBeGreaterThan(0);

    fireEvent(input, "submitEditing");
    expect(onAnswer).toHaveBeenCalledWith("alpha");
    expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
  });

  it("ignores empty Enter submissions", () => {
    const onAnswer = jest.fn();
    const screen = renderGame({ onAnswer });

    fireEvent.changeText(screen.getByTestId("fill-in-blank-input"), "   ");
    fireEvent(screen.getByTestId("fill-in-blank-input"), "submitEditing");

    expect(onAnswer).not.toHaveBeenCalled();
    expect(keyboardDismissSpy).not.toHaveBeenCalled();
  });

  it("lets a blank press force a delayed keyboard reopen", () => {
    jest.useFakeTimers();
    const screen = renderGame();

    jest.runOnlyPendingTimers();
    jest.clearAllMocks();
    fireEvent.press(screen.getByTestId("fill-in-blank-cloze-blank-0"));

    expect(keyboardDismissSpy).not.toHaveBeenCalled();
    expect(preferKeyboardLanguage).not.toHaveBeenCalled();
    expect(getCurrentKeyboardLanguage).not.toHaveBeenCalled();

    jest.advanceTimersByTime(40);

    expect(preferKeyboardLanguage).toHaveBeenCalledWith("en");
    expect(getCurrentKeyboardLanguage).toHaveBeenCalled();
  });

  it("remounts and reopens the keyboard when pressing a blank after outside unmount", () => {
    jest.useFakeTimers();
    const screen = renderGame();

    jest.runOnlyPendingTimers();
    jest.clearAllMocks();
    fireEvent.press(screen.getByTestId("fill-in-blank-dismiss-area"));
    expect(screen.queryByTestId("fill-in-blank-input")).toBeNull();
    jest.clearAllMocks();

    fireEvent.press(screen.getByTestId("fill-in-blank-cloze-blank-0"));

    expect(screen.getByTestId("fill-in-blank-input")).toBeTruthy();
    expect(keyboardDismissSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(40);

    expect(preferKeyboardLanguage).toHaveBeenCalledWith("en");
    expect(getCurrentKeyboardLanguage).toHaveBeenCalled();
  });

  it("dismisses the keyboard from outside the example container without refocusing", () => {
    jest.useFakeTimers();
    const screen = renderGame();

    jest.runOnlyPendingTimers();
    jest.clearAllMocks();
    fireEvent.press(screen.getByTestId("fill-in-blank-dismiss-area"));

    expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("fill-in-blank-input")).toBeNull();

    keyboardDidHideHandler?.();
    jest.advanceTimersByTime(120);

    expect(screen.queryByTestId("fill-in-blank-input")).toBeNull();
    expect(preferKeyboardLanguage).not.toHaveBeenCalled();
    expect(getCurrentKeyboardLanguage).not.toHaveBeenCalled();
  });

  it("remounts and reopens the keyboard when pressing inside the example container", () => {
    jest.useFakeTimers();
    const screen = renderGame();

    jest.runOnlyPendingTimers();
    jest.clearAllMocks();
    fireEvent.press(screen.getByTestId("fill-in-blank-dismiss-area"));
    expect(screen.queryByTestId("fill-in-blank-input")).toBeNull();
    jest.clearAllMocks();

    fireEvent.press(screen.getByTestId("fill-in-blank-example-container"));

    expect(screen.getByTestId("fill-in-blank-input")).toBeTruthy();
    expect(keyboardDismissSpy).not.toHaveBeenCalled();
    expect(preferKeyboardLanguage).not.toHaveBeenCalled();
    expect(getCurrentKeyboardLanguage).not.toHaveBeenCalled();

    jest.advanceTimersByTime(40);

    expect(preferKeyboardLanguage).toHaveBeenCalledWith("en");
    expect(getCurrentKeyboardLanguage).toHaveBeenCalled();
  });

  it("remounts and auto-focuses the input on the next question after outside unmount", () => {
    jest.useFakeTimers();
    const screen = renderGame();

    jest.runOnlyPendingTimers();
    jest.clearAllMocks();
    fireEvent.press(screen.getByTestId("fill-in-blank-dismiss-area"));
    expect(screen.queryByTestId("fill-in-blank-input")).toBeNull();

    screen.rerender(
      <FillInTheBlankGame
        word="beta"
        courseId="TOEIC"
        clozeSentence="Pick ____ again."
        options={[]}
        correctAnswer="beta"
        userAnswer=""
        showResult={false}
        onAnswer={jest.fn()}
      />,
    );

    expect(screen.getByTestId("fill-in-blank-input")).toBeTruthy();
    jest.clearAllMocks();
    jest.advanceTimersByTime(80);

    expect(preferKeyboardLanguage).toHaveBeenCalledWith("en");
    expect(getCurrentKeyboardLanguage).toHaveBeenCalled();
  });

  it("does not reopen from an example container tap during result feedback", () => {
    jest.useFakeTimers();
    const screen = renderGame({
      userAnswer: "alpha",
      showResult: true,
    });

    fireEvent.press(screen.getByTestId("fill-in-blank-example-container"));
    jest.advanceTimersByTime(40);

    expect(keyboardDismissSpy).not.toHaveBeenCalled();
    expect(preferKeyboardLanguage).not.toHaveBeenCalled();
    expect(getCurrentKeyboardLanguage).not.toHaveBeenCalled();
  });

  it("does not dismiss from an outside tap during result feedback", () => {
    jest.useFakeTimers();
    const screen = renderGame({
      userAnswer: "alpha",
      showResult: true,
    });

    fireEvent.press(screen.getByTestId("fill-in-blank-dismiss-area"));
    keyboardDidHideHandler?.();
    jest.advanceTimersByTime(120);

    expect(keyboardDismissSpy).not.toHaveBeenCalled();
    expect(preferKeyboardLanguage).not.toHaveBeenCalled();
    expect(getCurrentKeyboardLanguage).not.toHaveBeenCalled();
  });

  it("does not reopen the keyboard from a blank press during result feedback", () => {
    jest.useFakeTimers();
    const screen = renderGame({
      userAnswer: "alpha",
      showResult: true,
    });

    fireEvent.press(screen.getByTestId("fill-in-blank-cloze-blank-0"));
    jest.advanceTimersByTime(40);

    expect(preferKeyboardLanguage).not.toHaveBeenCalled();
    expect(getCurrentKeyboardLanguage).not.toHaveBeenCalled();
  });

  it("refocuses the hidden input when the keyboard hides during active input", () => {
    jest.useFakeTimers();
    const screen = renderGame();

    keyboardDidHideHandler?.();

    expect(preferKeyboardLanguage).not.toHaveBeenCalledWith("en");

    jest.advanceTimersByTime(120);

    expect(preferKeyboardLanguage).toHaveBeenCalledWith("en");
    expect(getCurrentKeyboardLanguage).toHaveBeenCalled();
    expect(screen.getByTestId("fill-in-blank-input")).toBeTruthy();
  });

  it("does not refocus when the keyboard hides during result feedback", () => {
    jest.useFakeTimers();
    renderGame({
      userAnswer: "alpha",
      showResult: true,
    });

    keyboardDidHideHandler?.();
    jest.advanceTimersByTime(120);

    expect(preferKeyboardLanguage).not.toHaveBeenCalled();
    expect(getCurrentKeyboardLanguage).not.toHaveBeenCalled();
  });

  it("does not refocus when the keyboard hides after an intentional submit dismissal", () => {
    jest.useFakeTimers();
    const onAnswer = jest.fn();
    const screen = renderGame({ onAnswer });
    const input = screen.getByTestId("fill-in-blank-input");

    jest.runOnlyPendingTimers();
    jest.clearAllMocks();

    fireEvent.changeText(input, "alpha");
    fireEvent(input, "submitEditing");
    screen.rerender(
      <FillInTheBlankGame
        word="alpha"
        courseId="TOEIC"
        clozeSentence="Pick ____."
        options={[]}
        correctAnswer="alpha"
        userAnswer="alpha"
        showResult
        onAnswer={onAnswer}
      />,
    );
    const preferCallCountBeforeHide = (preferKeyboardLanguage as jest.Mock).mock
      .calls.length;
    const getCurrentCallCountBeforeHide = (getCurrentKeyboardLanguage as jest.Mock)
      .mock.calls.length;
    keyboardDidHideHandler?.();
    jest.advanceTimersByTime(120);

    expect(onAnswer).toHaveBeenCalledWith("alpha");
    expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
    expect(preferKeyboardLanguage).toHaveBeenCalledTimes(
      preferCallCountBeforeHide,
    );
    expect(getCurrentKeyboardLanguage).toHaveBeenCalledTimes(
      getCurrentCallCountBeforeHide,
    );
  });

  it("keeps the hidden input focusable and shows accepted correct forms during result feedback", () => {
    const screen = renderGame({
      correctAnswer: "go",
      correctForms: ["went"],
      userAnswer: "went",
      showResult: true,
    });

    expect(screen.getByTestId("fill-in-blank-input").props.editable).toBe(true);
    expect(screen.getAllByText("went").length).toBeGreaterThan(0);
  });

  it("ignores typing and submit events during result feedback", () => {
    const onAnswer = jest.fn();
    const screen = renderGame({
      onAnswer,
      userAnswer: "alpha",
      showResult: true,
    });
    const input = screen.getByTestId("fill-in-blank-input");

    fireEvent.changeText(input, "beta");
    fireEvent(input, "submitEditing");

    expect(onAnswer).not.toHaveBeenCalled();
    expect(keyboardDismissSpy).not.toHaveBeenCalled();
    expect(screen.queryByText("beta")).toBeNull();
  });

  it("shows a toast when the active keyboard language differs", async () => {
    (getCurrentKeyboardLanguage as jest.Mock).mockResolvedValueOnce("ja-JP");
    const screen = renderGame();

    fireEvent(screen.getByTestId("fill-in-blank-input"), "focus");

    expect(await screen.findByText("Switch to the English keyboard to answer this quiz.")).toBeTruthy();
  });
});
