import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import UploadListItem from "../UploadListItem";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.View = View;
  Reanimated.default = Reanimated;
  Reanimated.useAnimatedStyle = (updater: () => object) => updater();
  return Reanimated;
});

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const React = require("react");
  const { Pressable, View } = require("react-native");

  const MockReanimatedSwipeable = React.forwardRef(
    ({ children, renderRightActions, onSwipeableOpen }: any, ref: any) => {
      const methods = {
        close: jest.fn(),
        openLeft: jest.fn(),
        openRight: jest.fn(),
        reset: jest.fn(),
      };

      React.useImperativeHandle(ref, () => methods, []);

      return (
        <View>
          <Pressable
            testID="swipe-open-left"
            onPress={() => onSwipeableOpen?.("left")}
          />
          <Pressable
            testID="swipe-open-right"
            onPress={() => onSwipeableOpen?.("right")}
          />
          {children}
          {renderRightActions
            ? renderRightActions({ value: 1 }, { value: -90 }, methods)
            : null}
        </View>
      );
    },
  );

  MockReanimatedSwipeable.displayName = "MockReanimatedSwipeable";

  return {
    __esModule: true,
    default: MockReanimatedSwipeable,
  };
});

describe("UploadListItem", () => {
  const defaultProps = {
    itemKey: "1-0",
    type: "csv" as const,
    item: {
      id: "1",
      day: "1",
      file: { name: "sample.csv" },
    },
    index: 0,
    onPress: jest.fn(),
    onDelete: jest.fn(),
    onSwipeableOpen: jest.fn(),
    registerSwipeableRef: jest.fn(),
    showDelete: true,
    isDark: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders row content", () => {
    const { getByText } = render(<UploadListItem {...defaultProps} />);

    expect(getByText("Day 1")).toBeTruthy();
    expect(getByText("sample.csv")).toBeTruthy();
  });

  it("renders swipe delete action when delete is enabled", () => {
    const { getByText } = render(<UploadListItem {...defaultProps} />);

    expect(getByText("Delete")).toBeTruthy();
  });

  it("calls onDelete when delete action is pressed", () => {
    const onDelete = jest.fn();
    const { getByText } = render(
      <UploadListItem {...defaultProps} onDelete={onDelete} />,
    );

    fireEvent.press(getByText("Delete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("notifies list when swiped open to the right", () => {
    const onSwipeableOpen = jest.fn();
    const { getByTestId } = render(
      <UploadListItem {...defaultProps} onSwipeableOpen={onSwipeableOpen} />,
    );

    fireEvent.press(getByTestId("swipe-open-right"));
    expect(onSwipeableOpen).toHaveBeenCalledWith("1-0");
  });

  it("does not notify list for left open event", () => {
    const onSwipeableOpen = jest.fn();
    const { getByTestId } = render(
      <UploadListItem {...defaultProps} onSwipeableOpen={onSwipeableOpen} />,
    );

    fireEvent.press(getByTestId("swipe-open-left"));
    expect(onSwipeableOpen).not.toHaveBeenCalled();
  });

  it("does not render swipe wrapper controls when delete is disabled", () => {
    const { queryByTestId } = render(
      <UploadListItem {...defaultProps} showDelete={false} />,
    );

    expect(queryByTestId("swipe-open-right")).toBeNull();
  });

  it("keeps row press behavior", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <UploadListItem {...defaultProps} onPress={onPress} />,
    );

    fireEvent.press(getByText("Day 1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
