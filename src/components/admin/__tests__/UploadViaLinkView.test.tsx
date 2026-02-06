import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import UploadViaLinkView from "../UploadViaLinkView";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("UploadViaLinkView", () => {
  const mockSetItem = jest.fn();

  const initialItem = { id: "1", day: "1", sheetId: "", range: "Sheet1!A:E" };

  const defaultProps = {
    item: initialItem,
    setItem: mockSetItem,
    loading: false,
    isDark: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { getByText, getByPlaceholderText } = render(
      <UploadViaLinkView {...defaultProps} />,
    );

    expect(getByText("Import from Google Sheets")).toBeTruthy();
    expect(getByText("Import")).toBeTruthy();
    expect(getByPlaceholderText("e.g. 1BxiMVs...")).toBeTruthy();
  });

  it("updates sheet ID input", () => {
    const { getByPlaceholderText } = render(
      <UploadViaLinkView {...defaultProps} />,
    );

    const input = getByPlaceholderText("e.g. 1BxiMVs...");
    fireEvent.changeText(input, "new-sheet-id");

    expect(mockSetItem).toHaveBeenCalled();
    const updater = mockSetItem.mock.calls[0][0];
    const newItem = updater(initialItem);
    expect(newItem.sheetId).toBe("new-sheet-id");
  });

  it("updates range input", () => {
    const { getByPlaceholderText } = render(
      <UploadViaLinkView {...defaultProps} />,
    );

    const input = getByPlaceholderText("Sheet1!A:E");
    fireEvent.changeText(input, "Sheet2!A:B");

    expect(mockSetItem).toHaveBeenCalled();
    const updater = mockSetItem.mock.calls[0][0];
    const newItem = updater(initialItem);
    expect(newItem.range).toBe("Sheet2!A:B");
  });
});
