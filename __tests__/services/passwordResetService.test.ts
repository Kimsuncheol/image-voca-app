import { sendPasswordResetEmail } from "firebase/auth";

import {
  buildPasswordResetActionCodeSettings,
  getPasswordResetActionUrl,
  sendCurrentUserPasswordResetEmail,
  sendPasswordResetEmailForAddress,
} from "../../src/services/passwordResetService";

jest.mock("expo-constants", () => ({
  expoConfig: {
    ios: { bundleIdentifier: "com.test.imagevocaapp" },
    android: { package: "com.test.imagevocaapp" },
  },
}));

jest.mock("firebase/auth", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  auth: { currentUser: { email: "current@example.com" } },
}));

const mockSendPasswordResetEmail = sendPasswordResetEmail as jest.Mock;

describe("passwordResetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds Firebase action code settings for the HTTPS reset handler", () => {
    expect(buildPasswordResetActionCodeSettings()).toEqual({
      url: "https://image-voca-app.web.app/reset-password",
      handleCodeInApp: true,
      iOS: { bundleId: "com.test.imagevocaapp" },
      android: {
        packageName: "com.test.imagevocaapp",
        installApp: true,
      },
    });
  });

  it("sends a reset email to the current user email", async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);

    await expect(sendCurrentUserPasswordResetEmail()).resolves.toEqual({
      ok: true,
      email: "current@example.com",
    });

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.any(Object),
      "current@example.com",
      expect.objectContaining({
        url: "https://image-voca-app.web.app/reset-password",
        handleCodeInApp: true,
      }),
    );
  });

  it("uses the deployed Firebase Hosting reset action URL", () => {
    expect(getPasswordResetActionUrl()).toBe(
      "https://image-voca-app.web.app/reset-password",
    );
  });

  it("returns missing-email without calling Firebase", async () => {
    await expect(sendPasswordResetEmailForAddress(" ")).resolves.toEqual({
      ok: false,
      reason: "missing-email",
    });

    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("maps unauthorized continue URI Firebase errors to a typed failure reason", async () => {
    const error = { code: "auth/unauthorized-continue-uri" };
    mockSendPasswordResetEmail.mockRejectedValueOnce(error);

    await expect(
      sendPasswordResetEmailForAddress("current@example.com"),
    ).resolves.toEqual({
      ok: false,
      reason: "unauthorized-continue-uri",
      error,
    });
  });
});
