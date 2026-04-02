import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";
import MangaReaderScreen from "../app/manga/reader";

const mockBack = jest.fn();
const mockSetPage = jest.fn();
let mockPagerProps: any = null;
const mangaPageViewInstances: Array<{
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
}> = [];

function getLatestMangaPageViewInstance() {
  const instance = mangaPageViewInstances.at(-1);
  if (!instance) {
    throw new Error("Expected MangaPageView to be rendered");
  }

  return instance;
}

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({
    courseId: "JLPT_N5",
    day: "1",
  }),
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../src/services/mangaService", () => ({
  fetchMangaDayPages: jest.fn(async () => [
    "https://cdn.example.com/page-1.png",
    "https://cdn.example.com/page-2.png",
    "https://cdn.example.com/page-3.png",
  ]),
}));

jest.mock("../components/manga/MangaPageView", () => ({
  MangaPageView: ({
    uri,
    onSwipeLeft,
    onSwipeRight,
    onTap,
  }: {
    uri: string;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onTap?: () => void;
  }) => {
    const ReactModule = require("react");
    const { Text } = require("react-native");
    mangaPageViewInstances.push({ onSwipeLeft, onSwipeRight, onTap });
    return <Text>{uri}</Text>;
  },
}));

jest.mock("react-native-pager-view", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");

  const MockPagerView = ReactModule.forwardRef(function MockPagerView(
    props: any,
    ref: any,
  ) {
    mockPagerProps = props;
    ReactModule.useImperativeHandle(ref, () => ({
      setPage: mockSetPage,
    }));
    return <View testID="mock-manga-pager">{props.children}</View>;
  });

  return {
    __esModule: true,
    default: MockPagerView,
  };
});

describe("MangaReaderScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPagerProps = null;
    mangaPageViewInstances.length = 0;
  });

  it("uses ltr swipe for next and rtl swipe for previous", async () => {
    const screen = render(<MangaReaderScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("mock-manga-pager")).toBeTruthy();
    });

    expect(mockPagerProps.layoutDirection).toBe("rtl");
    expect(screen.queryByText("✕")).toBeNull();
    expect(screen.queryByText("1 / 3")).toBeNull();
    expect(screen.queryByTestId("manga-previous-button")).toBeNull();
    expect(screen.queryByTestId("manga-next-button")).toBeNull();

    act(() => {
      getLatestMangaPageViewInstance().onSwipeLeft?.();
    });
    expect(mockSetPage).not.toHaveBeenCalled();

    act(() => {
      getLatestMangaPageViewInstance().onSwipeRight?.();
    });
    expect(mockSetPage).toHaveBeenCalledWith(1);

    act(() => {
      mockPagerProps.onPageSelected({ nativeEvent: { position: 1 } });
    });

    expect(screen.queryByText("2 / 3")).toBeNull();

    act(() => {
      getLatestMangaPageViewInstance().onSwipeLeft?.();
    });
    expect(mockSetPage).toHaveBeenCalledWith(0);

    act(() => {
      mockPagerProps.onPageSelected({ nativeEvent: { position: 2 } });
    });

    expect(screen.queryByText("3 / 3")).toBeNull();

    act(() => {
      getLatestMangaPageViewInstance().onSwipeRight?.();
    });
    expect(mockSetPage).toHaveBeenCalledTimes(2);
  });

  it("toggles the overlays based on page taps", async () => {
    const screen = render(<MangaReaderScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("mock-manga-pager")).toBeTruthy();
    });

    expect(screen.queryByText("✕")).toBeNull();
    expect(screen.queryByText("1 / 3")).toBeNull();

    act(() => {
      getLatestMangaPageViewInstance().onTap?.();
    });

    expect(screen.getByText("✕")).toBeTruthy();
    expect(screen.getByText("1 / 3")).toBeTruthy();

    act(() => {
      mockPagerProps.onPageSelected({ nativeEvent: { position: 1 } });
    });

    expect(screen.getByText("2 / 3")).toBeTruthy();

    act(() => {
      getLatestMangaPageViewInstance().onTap?.();
    });

    expect(screen.queryByText("✕")).toBeNull();
    expect(screen.queryByText("2 / 3")).toBeNull();
  });

  it("does not render the rtl/ltr toggle in the top bar", async () => {
    const screen = render(<MangaReaderScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("mock-manga-pager")).toBeTruthy();
    });

    expect(screen.queryByText("← RTL")).toBeNull();
    expect(screen.queryByText("LTR →")).toBeNull();
  });
});
