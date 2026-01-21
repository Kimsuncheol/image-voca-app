import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import UploadViaLinkView from "../UploadViaLinkView";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("UploadViaLinkView", () => {
  const mockSetItems = jest.fn();
  const mockOnImport = jest.fn();

  const initialItems = [
    { id: "1", day: "1", sheetId: "", range: "Sheet1!A:E" },
  ];

  const defaultProps = {
    items: initialItems,
    setItems: mockSetItems,
    loading: false,
    progress: "",
    isDark: false,
    token: "mock-token",
    waitingForToken: false,
    onImport: mockOnImport,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { getByText, getByPlaceholderText } = render(
      <UploadViaLinkView {...defaultProps} />,
    );

    expect(getByText("Import from Google Sheets")).toBeTruthy();
    expect(getByText("Import #1")).toBeTruthy();
    expect(getByText("Import 0 Item(s)")).toBeTruthy(); // 0 items because default sheetId is empty
  });

  it("updates sheet ID input", () => {
    const { getByPlaceholderText } = render(
      <UploadViaLinkView {...defaultProps} />,
    );

    const input = getByPlaceholderText("e.g. 1BxiMVs...");
    fireEvent.changeText(input, "new-sheet-id");

    expect(mockSetItems).toHaveBeenCalled();
    const updater = mockSetItems.mock.calls[0][0];
    const newItems = updater(initialItems);
    expect(newItems[0].sheetId).toBe("new-sheet-id");
  });

  it("updates range input", () => {
    const { getByPlaceholderText } = render(
      <UploadViaLinkView {...defaultProps} />,
    );

    const input = getByPlaceholderText("Sheet1!A:E");
    fireEvent.changeText(input, "Sheet2!A:B");

    expect(mockSetItems).toHaveBeenCalled();
    const updater = mockSetItems.mock.calls[0][0];
    const newItems = updater(initialItems);
    expect(newItems[0].range).toBe("Sheet2!A:B");
  });

  it("calls onImport when button is pressed", () => {
    const { getByText } = render(<UploadViaLinkView {...defaultProps} />);

    fireEvent.press(getByText("Import 0 Item(s)"));
    expect(mockOnImport).toHaveBeenCalled();
  });
});
