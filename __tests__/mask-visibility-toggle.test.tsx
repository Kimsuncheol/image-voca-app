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
  it("renders Mask as the next action when masking is disabled", () => {
    const { getByText, getByTestId, queryByText } = render(
      <MaskVisibilityToggle
        isDark={false}
        isMaskEnabled={false}
        testID="mask-toggle"
      />,
    );

    expect(getByText("Mask")).toBeTruthy();
    expect(queryByText("Show")).toBeNull();
    expect(getByTestId("mask-toggle-button").props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it("renders Show as the next action when masking is enabled", () => {
    const { getByText, queryByText } = render(
      <MaskVisibilityToggle
        isDark={false}
        isMaskEnabled={true}
        testID="mask-toggle"
      />,
    );

    expect(getByText("Show")).toBeTruthy();
    expect(queryByText("Mask")).toBeNull();
  });

  it("calls onMaskChange with the opposite state when pressed", () => {
    const onMaskChange = jest.fn();
    const { getByTestId, rerender } = render(
      <MaskVisibilityToggle
        isDark={false}
        isMaskEnabled={false}
        onMaskChange={onMaskChange}
        testID="mask-toggle"
      />,
    );

    fireEvent.press(getByTestId("mask-toggle-button"));

    rerender(
      <MaskVisibilityToggle
        isDark={false}
        isMaskEnabled={true}
        onMaskChange={onMaskChange}
        testID="mask-toggle"
      />,
    );

    fireEvent.press(getByTestId("mask-toggle-button"));

    expect(onMaskChange).toHaveBeenNthCalledWith(1, true);
    expect(onMaskChange).toHaveBeenNthCalledWith(2, false);
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

    fireEvent(getByTestId("mask-toggle-button"), "press", { stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onMaskChange).toHaveBeenCalledWith(true);
  });
});
