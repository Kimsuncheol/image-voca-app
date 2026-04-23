import { render } from "@testing-library/react-native";
import React from "react";
import { QuizTimer } from "../components/course/QuizTimer";

type MockSharedValue = {
  value: number | unknown;
  __setValue: (value: number) => void;
};

let mockLastSharedValue: MockSharedValue | null = null;
const mockCancelAnimation = jest.fn();
const mockWithTiming = jest.fn(
  (
    toValue: number,
    config?: { duration?: number; easing?: unknown },
    callback?: (finished?: boolean) => void,
  ) => ({
    __animation: true,
    callback,
    config,
    toValue,
  }),
);

jest.mock("react-native-reanimated", () => {
  const ReactModule = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual("react-native");

  return {
    __esModule: true,
    default: {
      View,
    },
    View,
    Easing: {
      linear: "linear",
    },
    cancelAnimation: (...args: unknown[]) => mockCancelAnimation(...args),
    interpolateColor: (
      _value: number,
      _inputRange: number[],
      outputRange: string[],
    ) => outputRange[outputRange.length - 1],
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    useAnimatedStyle: (updater: () => object) => updater(),
    useSharedValue: (initialValue: number) => {
      const sharedValueRef = ReactModule.useRef<MockSharedValue | null>(null);

      if (!sharedValueRef.current) {
        let currentValue: unknown = initialValue;
        sharedValueRef.current = {
          get value() {
            return currentValue;
          },
          set value(nextValue: unknown) {
            if (
              nextValue &&
              typeof nextValue === "object" &&
              "__animation" in nextValue
            ) {
              return;
            }
            currentValue = nextValue;
          },
          __setValue(nextValue: number) {
            currentValue = nextValue;
          },
        };
        mockLastSharedValue = sharedValueRef.current;
      }

      return sharedValueRef.current;
    },
    withTiming: (
      toValue: number,
      config?: { duration?: number; easing?: unknown },
      callback?: (finished?: boolean) => void,
    ) => mockWithTiming(toValue, config, callback),
  };
});

const latestTimingDuration = () => {
  const calls = mockWithTiming.mock.calls;
  return calls[calls.length - 1]?.[1]?.duration;
};

describe("QuizTimer", () => {
  beforeEach(() => {
    mockLastSharedValue = null;
    mockCancelAnimation.mockClear();
    mockWithTiming.mockClear();
  });

  it("uses the full duration on initial start", () => {
    render(
      <QuizTimer
        duration={15}
        isRunning
        onTimeUp={jest.fn()}
        quizKey="question-1"
      />,
    );

    expect(latestTimingDuration()).toBe(15000);
  });

  it("uses the full duration when quizKey changes after partial progress", () => {
    const screen = render(
      <QuizTimer
        duration={15}
        isRunning
        onTimeUp={jest.fn()}
        quizKey="question-1"
      />,
    );

    mockLastSharedValue?.__setValue(0.4);

    screen.rerender(
      <QuizTimer
        duration={15}
        isRunning
        onTimeUp={jest.fn()}
        quizKey="question-2"
      />,
    );

    expect(latestTimingDuration()).toBe(15000);
  });

  it("resumes from remaining progress when isRunning toggles without a reset", () => {
    const screen = render(
      <QuizTimer
        duration={15}
        isRunning
        onTimeUp={jest.fn()}
        quizKey="question-1"
      />,
    );

    mockLastSharedValue?.__setValue(0.4);

    screen.rerender(
      <QuizTimer
        duration={15}
        isRunning={false}
        onTimeUp={jest.fn()}
        quizKey="question-1"
      />,
    );
    screen.rerender(
      <QuizTimer
        duration={15}
        isRunning
        onTimeUp={jest.fn()}
        quizKey="question-1"
      />,
    );

    expect(latestTimingDuration()).toBe(6000);
  });
});
