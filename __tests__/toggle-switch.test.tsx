import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { ToggleSwitch } from "../components/common/ToggleSwitch";

describe("ToggleSwitch", () => {
  it("toggles value when pressed", () => {
    const onValueChange = jest.fn();
    const screen = render(
      <ToggleSwitch value={false} onValueChange={onValueChange} />,
    );

    fireEvent.press(screen.getByRole("switch"));

    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("preserves switch accessibility state", () => {
    const screen = render(<ToggleSwitch value onValueChange={jest.fn()} />);
    const toggle = screen.getByRole("switch");

    expect(toggle.props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });
  });

  it("dims and blocks interaction when disabled", () => {
    const onValueChange = jest.fn();
    const screen = render(
      <ToggleSwitch value onValueChange={onValueChange} disabled />,
    );
    const toggle = screen.getByRole("switch");

    fireEvent.press(toggle);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(StyleSheet.flatten(toggle.props.style)).toEqual(
      expect.objectContaining({ opacity: 0.5 }),
    );
    expect(toggle.props.accessibilityState).toEqual({
      checked: true,
      disabled: true,
    });
  });
});
