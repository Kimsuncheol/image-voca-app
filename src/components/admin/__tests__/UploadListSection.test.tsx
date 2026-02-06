import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import UploadListSection from "../UploadListSection";

const mockCloseRefs = new Map<string, jest.Mock>();

jest.mock("../UploadListItem", () => {
  const React = require("react");
  const { Pressable, View } = require("react-native");

  const MockUploadListItem = ({
    itemKey,
    onSwipeableOpen,
    registerSwipeableRef,
    onDelete,
    onPress,
  }: any) => {
    const methodsRef = React.useRef({
      close: jest.fn(),
      openLeft: jest.fn(),
      openRight: jest.fn(),
      reset: jest.fn(),
    });

    React.useEffect(() => {
      mockCloseRefs.set(itemKey, methodsRef.current.close);
      registerSwipeableRef(itemKey, methodsRef.current);
      return () => {
        mockCloseRefs.delete(itemKey);
        registerSwipeableRef(itemKey, null);
      };
    }, [itemKey, registerSwipeableRef]);

    return (
      <View>
        <Pressable
          testID={`open-${itemKey}`}
          onPress={() => onSwipeableOpen(itemKey)}
        />
        <Pressable testID={`delete-${itemKey}`} onPress={onDelete} />
        <Pressable testID={`press-${itemKey}`} onPress={onPress} />
      </View>
    );
  };

  return {
    __esModule: true,
    default: MockUploadListItem,
  };
});

describe("UploadListSection", () => {
  const items = [
    {
      id: "a",
      day: "1",
      file: { name: "a.csv" },
    },
    {
      id: "b",
      day: "2",
      file: { name: "b.csv" },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCloseRefs.clear();
  });

  it("closes previously open row when a different row opens", () => {
    const onPressItem = jest.fn();
    const onDeleteItem = jest.fn();
    const { getByTestId } = render(
      <UploadListSection
        type="csv"
        items={items}
        onPressItem={onPressItem}
        onDeleteItem={onDeleteItem}
        isDark={false}
      />,
    );

    fireEvent.press(getByTestId("open-a-0"));
    fireEvent.press(getByTestId("open-b-1"));

    const closeA = mockCloseRefs.get("a-0");
    expect(closeA).toBeDefined();
    expect(closeA).toHaveBeenCalledTimes(1);
  });

  it("clears active row state after deleting the open row", () => {
    const onPressItem = jest.fn();
    const onDeleteItem = jest.fn();
    const { getByTestId } = render(
      <UploadListSection
        type="csv"
        items={items}
        onPressItem={onPressItem}
        onDeleteItem={onDeleteItem}
        isDark={false}
      />,
    );

    fireEvent.press(getByTestId("open-b-1"));
    fireEvent.press(getByTestId("delete-b-1"));

    const closeB = mockCloseRefs.get("b-1");
    expect(closeB).toBeDefined();
    expect(closeB).toHaveBeenCalledTimes(1);
    expect(onDeleteItem).toHaveBeenCalledWith(1);

    fireEvent.press(getByTestId("open-a-0"));
    expect(closeB).toHaveBeenCalledTimes(1);
  });

  it("closes active row before handling row press", () => {
    const onPressItem = jest.fn();
    const onDeleteItem = jest.fn();
    const { getByTestId } = render(
      <UploadListSection
        type="csv"
        items={items}
        onPressItem={onPressItem}
        onDeleteItem={onDeleteItem}
        isDark={false}
      />,
    );

    fireEvent.press(getByTestId("open-a-0"));
    fireEvent.press(getByTestId("press-b-1"));

    const closeA = mockCloseRefs.get("a-0");
    expect(closeA).toBeDefined();
    expect(closeA).toHaveBeenCalledTimes(1);
    expect(onPressItem).toHaveBeenCalledWith(1);
  });
});
