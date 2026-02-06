import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import UploadListItem from "../UploadListItem";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { Pressable, View } = require("react-native");

  return {
    Swipeable: ({
      children,
      renderRightActions,
      onSwipeableOpen,
    }: any) => (
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
        {renderRightActions ? renderRightActions(null, null) : null}
      </View>
    ),
  };
});

describe("UploadListItem", () => {
  const defaultProps = {
    type: "csv" as const,
    item: {
      id: "1",
      day: "1",
      file: { name: "sample.csv" },
    },
    index: 0,
    onPress: jest.fn(),
    onDelete: jest.fn(),
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

  it("calls onDelete when swiped fully to the left", () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <UploadListItem {...defaultProps} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("swipe-open-right"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not call onDelete for left open event", () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <UploadListItem {...defaultProps} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("swipe-open-left"));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("guards against duplicate delete calls after first full swipe", () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <UploadListItem {...defaultProps} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("swipe-open-right"));
    fireEvent.press(getByTestId("swipe-open-right"));
    expect(onDelete).toHaveBeenCalledTimes(1);
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
