import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import UploadCSVFileView from "../UploadCSVFileView";

// Mock Ionicons to avoid rendering issues
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("UploadCSVFileView", () => {
  const mockSetItem = jest.fn();
  const mockOnPickDocument = jest.fn();

  const initialItem = { id: "1", day: "1", file: null };

  const defaultProps = {
    item: initialItem,
    setItem: mockSetItem,
    loading: false,
    isDark: false,
    onPickDocument: mockOnPickDocument,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with initial items", () => {
    const { getByText, getByPlaceholderText } = render(
      <UploadCSVFileView {...defaultProps} />,
    );

    expect(getByText("Upload")).toBeTruthy();
    expect(getByPlaceholderText("1")).toBeTruthy();
    expect(getByText("Tap to select CSV file")).toBeTruthy();
  });

  it("updates day input", () => {
    const { getByPlaceholderText } = render(
      <UploadCSVFileView {...defaultProps} />,
    );

    const input = getByPlaceholderText("1");
    fireEvent.changeText(input, "2");

    expect(mockSetItem).toHaveBeenCalled();
    const updater = mockSetItem.mock.calls[0][0];
    const newItem = updater(initialItem);
    expect(newItem.day).toBe("2");
  });

  it("calls onPickDocument when file picker is pressed", () => {
    const { getByText } = render(<UploadCSVFileView {...defaultProps} />);

    fireEvent.press(getByText("Tap to select CSV file"));
    expect(mockOnPickDocument).toHaveBeenCalled();
  });
});
