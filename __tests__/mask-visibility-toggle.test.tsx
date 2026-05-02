import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { MaskVisibilityToggle } from "../components/common/MaskVisibilityToggle";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

describe("MaskVisibilityToggle", () => {
  it("renders Mask and Show with selected state", () => {
    const { getByText, getByTestId } = render(
      <MaskVisibilityToggle
        isDark={false}
        isMaskEnabled={true}
        testID="mask-toggle"
      />,
    );

    expect(getByText("Mask")).toBeTruthy();
    expect(getByText("Show")).toBeTruthy();
    expect(getByTestId("mask-toggle-mask").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(getByTestId("mask-toggle-show").props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it("calls onMaskChange with the pressed segment value", () => {
    const onMaskChange = jest.fn();
    const { getByTestId } = render(
      <MaskVisibilityToggle
        isDark={false}
        isMaskEnabled={true}
        onMaskChange={onMaskChange}
        testID="mask-toggle"
      />,
    );

    fireEvent.press(getByTestId("mask-toggle-show"));
    fireEvent.press(getByTestId("mask-toggle-mask"));

    expect(onMaskChange).toHaveBeenNthCalledWith(1, false);
    expect(onMaskChange).toHaveBeenNthCalledWith(2, true);
  });

  it("stops propagation when requested", () => {
    const onMaskChange = jest.fn();
    const stopPropagation = jest.fn();
    const { getByTestId } = render(
      <MaskVisibilityToggle
        isDark={false}
        isMaskEnabled={false}
        onMaskChange={onMaskChange}
        stopPropagation
        testID="mask-toggle"
      />,
    );

    fireEvent(getByTestId("mask-toggle-mask"), "press", { stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onMaskChange).toHaveBeenCalledWith(true);
  });
});
