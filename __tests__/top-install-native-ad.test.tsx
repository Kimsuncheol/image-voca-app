import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import {
  __mockNativeAd,
  NativeAd,
  NativeAdEventType,
} from "react-native-google-mobile-ads";
import { TopInstallNativeAd } from "../components/ads/TopInstallNativeAd";

const mockCreateForAdRequest = NativeAd.createForAdRequest as jest.Mock;

describe("TopInstallNativeAd", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockCreateForAdRequest.mockClear();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("renders nothing before the native ad finishes loading", () => {
    mockCreateForAdRequest.mockImplementationOnce(
      () => new Promise(() => undefined),
    );

    const { queryByTestId } = render(<TopInstallNativeAd />);

    expect(queryByTestId("top-install-native-ad")).toBeNull();
  });

  it("renders headline, icon, and CTA once the native ad loads", async () => {
    const { getByTestId, getByText } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(getByTestId("top-install-native-ad")).toBeTruthy();
    });

    expect(getByTestId("top-install-native-ad-icon")).toBeTruthy();
    expect(getByTestId("top-install-native-ad-headline").props.children).toBe(
      "Mock App",
    );
    expect(getByText("OPEN")).toBeTruthy();
  });

  it("requests AdChoices placement at the bottom-left corner", async () => {
    render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(mockCreateForAdRequest).toHaveBeenCalledWith(
        "test-native-unit-id",
        expect.objectContaining({
          adChoicesPlacement: 3,
        }),
      );
    });
  });

  it("falls back to OPEN when the native ad omits the CTA label", async () => {
    mockCreateForAdRequest.mockImplementationOnce(async () => ({
      ...__mockNativeAd.current,
      responseId: "test-response-id-fallback",
      callToAction: "   ",
      addAdEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllAdEventListeners: jest.fn(),
      destroy: jest.fn(),
    }));

    const { getByText } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(getByText("OPEN")).toBeTruthy();
    });
  });

  it("registers the CTA asset around the open control", async () => {
    const { getByTestId } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(getByTestId("native-asset-callToAction")).toBeTruthy();
    });

    expect(getByTestId("top-install-native-ad-cta")).toBeTruthy();
    expect(getByTestId("top-install-native-ad-cta").props.collapsable).toBe(false);
  });

  it("renders the disclosure trigger on the face side", async () => {
    const { getByTestId } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(getByTestId("top-install-native-ad-disclosure-trigger")).toBeTruthy();
    });
  });

  it("opens the disclosure overlay with exact English copy", async () => {
    const { getByTestId, getByText } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(getByTestId("top-install-native-ad-disclosure-trigger")).toBeTruthy();
    });

    fireEvent.press(getByTestId("top-install-native-ad-disclosure-trigger"));

    await waitFor(() => {
      expect(getByTestId("top-install-native-ad-disclosure-panel")).toBeTruthy();
    });

    expect(getByText("Ads By Google")).toBeTruthy();
    expect(getByText("Why this ad?")).toBeTruthy();
    expect(getByText("Google AdChoices")).toBeTruthy();
  });

  it("dismisses the disclosure overlay when the outside backdrop is tapped", async () => {
    const { getByTestId, queryByTestId } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(getByTestId("top-install-native-ad-disclosure-trigger")).toBeTruthy();
    });

    fireEvent.press(getByTestId("top-install-native-ad-disclosure-trigger"));

    await waitFor(() => {
      expect(getByTestId("top-install-native-ad-disclosure-panel")).toBeTruthy();
    });

    fireEvent.press(getByTestId("top-install-native-ad-disclosure-backdrop"));

    await waitFor(() => {
      expect(queryByTestId("top-install-native-ad-disclosure-panel")).toBeNull();
    });
  });

  it("subscribes to native CLICKED and OPENED events and cleans them up", async () => {
    const { unmount } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(__mockNativeAd.current?.addAdEventListener).toHaveBeenCalledWith(
        NativeAdEventType.CLICKED,
        expect.any(Function),
      );
    });

    expect(__mockNativeAd.current?.addAdEventListener).toHaveBeenCalledWith(
      NativeAdEventType.OPENED,
      expect.any(Function),
    );

    const clickedSubscription =
      __mockNativeAd.current?.__subscriptions?.[NativeAdEventType.CLICKED];
    const openedSubscription =
      __mockNativeAd.current?.__subscriptions?.[NativeAdEventType.OPENED];

    unmount();

    expect(clickedSubscription?.remove).toHaveBeenCalled();
    expect(openedSubscription?.remove).toHaveBeenCalled();
    expect(__mockNativeAd.current?.removeAllAdEventListeners).toHaveBeenCalled();
    expect(__mockNativeAd.current?.destroy).toHaveBeenCalled();
  });

  it("handles a native OPENED event without breaking the component", async () => {
    const { getByTestId } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(getByTestId("top-install-native-ad")).toBeTruthy();
    });

    expect(() => {
      __mockNativeAd.emit(NativeAdEventType.OPENED);
    }).not.toThrow();

    expect(getByTestId("top-install-native-ad-cta")).toBeTruthy();
  });

  it("renders nothing when the native ad request fails", async () => {
    mockCreateForAdRequest.mockRejectedValueOnce(new Error("load failed"));

    const { queryByTestId } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(mockCreateForAdRequest).toHaveBeenCalled();
    });

    expect(queryByTestId("top-install-native-ad")).toBeNull();
  });
});
