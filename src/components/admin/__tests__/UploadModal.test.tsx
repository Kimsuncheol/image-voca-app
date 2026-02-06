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
    const { getByText, queryByText } = render(<UploadModal {...defaultProps} />);

    expect(getByText("Add CSV Item")).toBeTruthy();
    expect(queryByText("Done")).toBeNull();
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

  it("calls primary action when enabled", () => {
    const onPrimaryAction = jest.fn();
    const { getByText } = render(
      <UploadModal
        {...defaultProps}
        onPrimaryAction={onPrimaryAction}
      />,
    );

    fireEvent.press(getByText("Add CSV Item"));

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });
});
