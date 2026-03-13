import type { User } from "firebase/auth";
import {
  type BillingPrice,
} from "../billing/storefront";
import type { PlanType, SubscriptionData } from "../stores/subscriptionStore";

const DEFAULT_FUNCTION_REGION = "asia-northeast3";

interface ConfirmTossPaymentParams {
  user: Pick<User, "getIdToken">;
  planId: PlanType;
  paymentKey: string;
  orderId: string;
  storefrontPrice: BillingPrice;
}

interface ConfirmTossPaymentResponse {
  subscription: SubscriptionData;
}

const getConfirmPaymentEndpoint = () => {
  if (process.env.EXPO_PUBLIC_TOSS_CONFIRM_PAYMENT_ENDPOINT) {
    return process.env.EXPO_PUBLIC_TOSS_CONFIRM_PAYMENT_ENDPOINT;
  }

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Firebase project ID is not configured.");
  }

  return `https://${DEFAULT_FUNCTION_REGION}-${projectId}.cloudfunctions.net/confirmTossPayment`;
};

const normalizeErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message || "Failed to confirm payment.";
  } catch {
    return "Failed to confirm payment.";
  }
};

export const confirmTossPayment = async ({
  user,
  planId,
  paymentKey,
  orderId,
  storefrontPrice,
}: ConfirmTossPaymentParams): Promise<ConfirmTossPaymentResponse> => {
  const idToken = await user.getIdToken();
  const response = await fetch(getConfirmPaymentEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      planId,
      paymentKey,
      orderId,
      amount: storefrontPrice.amount,
      currency: storefrontPrice.currency,
      country: storefrontPrice.country,
    }),
  });

  if (!response.ok) {
    throw new Error(await normalizeErrorMessage(response));
  }

  const payload = (await response.json()) as Partial<ConfirmTossPaymentResponse>;
  if (!payload.subscription?.planId) {
    throw new Error("Payment confirmation response is missing subscription data.");
  }

  return {
    subscription: payload.subscription,
  };
};
