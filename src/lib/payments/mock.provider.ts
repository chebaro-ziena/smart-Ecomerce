import type {
  CreatePaymentInput,
  CreatePaymentResult,
} from "./types";

export async function createMockPayment(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> {
  const providerPaymentId = `mock_${crypto.randomUUID()}`;

  return {
    provider: "mock",
    providerPaymentId,
    checkoutUrl: `/payment/mock/${providerPaymentId}`,
  };
}
