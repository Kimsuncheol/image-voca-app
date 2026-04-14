import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { NativeAd } from "react-native-google-mobile-ads";
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

  it("registers the CTA asset around the open control", async () => {
    const { getByTestId } = render(<TopInstallNativeAd />);

    await waitFor(() => {
      expect(getByTestId("native-asset-callToAction")).toBeTruthy();
    });

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
