export type PaymentProvider = "mock";

export type CreatePaymentInput = {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
};

export type CreatePaymentResult = {
  provider: PaymentProvider;
  providerPaymentId: string;
  checkoutUrl: string;
};


