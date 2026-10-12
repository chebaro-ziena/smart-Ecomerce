import { prisma } from "@/lib/prisma";
import { createMockPayment } from "@/lib/payments/mock.provider";
import { reserveOrderStock } from "@/lib/services/order.service";

export async function createPayment(
  userId: string,
  orderId: string,
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      payments: {
        where: {
          status: "PENDING",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  if (order.status !== "PENDING") {
    throw new Error("ORDER_NOT_PENDING");
  }

  if (order.total <= 0) {
    throw new Error("INVALID_ORDER_TOTAL");
  }

  // Reuse existing pending payment
  if (order.payments.length > 0) {
    const payment = order.payments[0];

    return {
      payment,
      checkoutUrl: `/payment/mock/${payment.providerPaymentId}`,
    };
  }

  const providerPayment = await createMockPayment({
    orderId: order.id,
    amount: order.total,
    currency: "USD",
    customerEmail: order.email ?? "",
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: providerPayment.provider,
      providerPaymentId: providerPayment.providerPaymentId,
      amount: order.total,
      currency: "USD",
      status: "PENDING",
    },
  });

  return {
    payment,
    checkoutUrl: providerPayment.checkoutUrl,
  };
}

export async function completeMockPayment(
  userId: string,
  paymentId: string,
  action: "success" | "failure",
) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      order: {
        userId,
      },
    },
    include: {
      order: true,
    },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.status !== "PENDING") {
    throw new Error("PAYMENT_ALREADY_COMPLETED");
  }

  // Simulate failed payment
  if (action === "failure") {
    const failedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "FAILED",
      },
    });

    return {
      payment: failedPayment,
      order: payment.order,
      redirectUrl: `/payment/failed/${payment.id}`,
    };
  }

  // SUCCESS:
  // Payment + stock + order are handled atomically.
  const updatedOrder = await reserveOrderStock(
    payment.orderId,
    payment.id,
  );

  const updatedPayment = await prisma.payment.findUnique({
    where: {
      id: payment.id,
    },
  });

  return {
    payment: updatedPayment,
    order: updatedOrder,
    redirectUrl: `/payment/success/${payment.orderId}`,
  };
}