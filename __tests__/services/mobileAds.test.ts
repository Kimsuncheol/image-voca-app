const mockExpoConstants = (
  executionEnvironment: "bare" | "standalone" | "storeClient",
  appOwnership: "expo" | null = null,
) => {
  jest.doMock("expo-constants", () => ({
    __esModule: true,
    default: {
      appOwnership,
      executionEnvironment,
    },
    ExecutionEnvironment: {
      Bare: "bare",
      Standalone: "standalone",
      StoreClient: "storeClient",
    },
  }));
};

const loadMobileAdsService = () => {
  const { Platform } = require("react-native");
  Platform.OS = "ios";
  return require("../../src/services/mobileAds") as typeof import("../../src/services/mobileAds");
};

describe("mobileAds service", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns no ad unit and no-ops initialization in Expo Go", async () => {
    mockExpoConstants("storeClient", "expo");
    const { initializeMobileAds, resolveTopInstallNativeAdUnitId } =
      loadMobileAdsService();

    expect(resolveTopInstallNativeAdUnitId()).toBeNull();
    await expect(initializeMobileAds()).resolves.toBeNull();
  });

  it("uses the native test ad unit in development native runtimes", async () => {
    mockExpoConstants("bare");
    const { initializeMobileAds, resolveTopInstallNativeAdUnitId } =
      loadMobileAdsService();

    expect(resolveTopInstallNativeAdUnitId()).toBe("test-native-unit-id");
    await expect(initializeMobileAds()).resolves.toEqual({
      adapterStatuses: [],
    });
  });

  it("returns null when the ads native module cannot be loaded", async () => {
    mockExpoConstants("bare");
    jest.doMock("react-native-google-mobile-ads", () => {
      throw new Error("RNGoogleMobileAdsModule missing");
    });
    const { initializeMobileAds, resolveTopInstallNativeAdUnitId } =
      loadMobileAdsService();

    expect(resolveTopInstallNativeAdUnitId()).toBeNull();
    await expect(initializeMobileAds()).resolves.toBeNull();
  });
});
