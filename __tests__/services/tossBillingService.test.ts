import { confirmTossPayment } from "../../src/services/tossBillingService";

describe("tossBillingService", () => {
  const fetchMock = jest.fn();
  const user = {
    getIdToken: jest.fn(async () => "firebase-id-token"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = "demo-project";
    delete process.env.EXPO_PUBLIC_TOSS_CONFIRM_PAYMENT_ENDPOINT;
    global.fetch = fetchMock;
  });

  test("posts the resolved storefront price to the confirmation endpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        subscription: {
          planId: "voca_unlimited",
          orderId: "order_123",
          updatedAt: "2026-03-14T00:00:00.000Z",
        },
      }),
    });

    await expect(
      confirmTossPayment({
        user,
        planId: "voca_unlimited",
        paymentKey: "pay_123",
        orderId: "order_123",
        storefrontPrice: {
          storefront: "US",
          amount: 9.99,
          currency: "USD",
          country: "US",
          displayAmount: "$9.99",
        },
      }),
    ).resolves.toEqual({
      subscription: {
        planId: "voca_unlimited",
        orderId: "order_123",
        updatedAt: "2026-03-14T00:00:00.000Z",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://asia-northeast3-demo-project.cloudfunctions.net/confirmTossPayment",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer firebase-id-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          planId: "voca_unlimited",
          paymentKey: "pay_123",
          orderId: "order_123",
          amount: 9.99,
          currency: "USD",
          country: "US",
        }),
      }),
    );
  });

  test("surfaces backend confirmation errors", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Payment details do not match plan pricing.",
      }),
    });

    await expect(
      confirmTossPayment({
        user,
        planId: "voca_unlimited",
        paymentKey: "pay_123",
        orderId: "order_123",
        storefrontPrice: {
          storefront: "KR",
          amount: 12_000,
          currency: "KRW",
          country: "KR",
          displayAmount: "KRW 12,000",
        },
      }),
    ).rejects.toThrow("Payment details do not match plan pricing.");
  });
});
