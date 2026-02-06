import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import UploadModal from "../UploadModal";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("UploadModal", () => {
  const csvItem = { id: "1", day: "1", file: null };
  const sheetItem = { id: "1", day: "1", sheetId: "", range: "Sheet1!A:E" };

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    modalType: "csv" as const,
    isDark: false,
    csvItem,
    setCsvItem: jest.fn(),
    onPickDocument: jest.fn(),
    sheetItem,
    setSheetItem: jest.fn(),
    loading: false,
    primaryActionLabel: "Add CSV Item",
    onPrimaryAction: jest.fn(),
    primaryActionDisabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders primary action label", () => {
    const { getByText } = render(<UploadModal {...defaultProps} />);

    expect(getByText("Add CSV Item")).toBeTruthy();
  });

  it("shows secondary action only when provided", () => {
    const { queryByText, rerender, getByText } = render(
      <UploadModal {...defaultProps} />,
    );

    expect(queryByText("Done")).toBeNull();

    rerender(
      <UploadModal
        {...defaultProps}
        secondaryActionLabel="Done"
        onSecondaryAction={jest.fn()}
      />,
    );

    expect(getByText("Done")).toBeTruthy();
  });

  it("does not call primary action when primary button is disabled", () => {
    const onPrimaryAction = jest.fn();
    const { getByText } = render(
      <UploadModal
        {...defaultProps}
        onPrimaryAction={onPrimaryAction}
        primaryActionDisabled={true}
      />,
    );

    fireEvent.press(getByText("Add CSV Item"));
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it("calls primary and secondary actions when enabled", () => {
    const onPrimaryAction = jest.fn();
    const onSecondaryAction = jest.fn();
    const { getByText } = render(
      <UploadModal
        {...defaultProps}
        onPrimaryAction={onPrimaryAction}
        secondaryActionLabel="Done"
        onSecondaryAction={onSecondaryAction}
      />,
    );

    fireEvent.press(getByText("Add CSV Item"));
    fireEvent.press(getByText("Done"));

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
  });
});
