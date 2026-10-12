import type {
  CreatePaymentInput,
  CreatePaymentResult,
} from "./types";

export async function createMockPayment(
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> {
  const providerPaymentId = `mock_${crypto.randomUUID()}`;

  return {
    provider: "mock",
    providerPaymentId,
    checkoutUrl: `/payment/mock/${providerPaymentId}`,
  };
}
