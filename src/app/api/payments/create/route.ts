import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { requireUser } from "@/lib/auth-session";
import { createPayment } from "@/lib/services/payment.service";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();

    if (!body.orderId || typeof body.orderId !== "string") {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const result = await createPayment(
      user.id,
      body.orderId,
    );

    return NextResponse.json({
      success: true,
      payment: result.payment,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "UNAUTHORIZED":
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );

        case "ORDER_NOT_FOUND":
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 },
          );

        case "ORDER_NOT_PENDING":
          return NextResponse.json(
            { error: "Order is not available for payment" },
            { status: 409 },
          );

        case "INVALID_ORDER_TOTAL":
          return NextResponse.json(
            { error: "Invalid order total" },
            { status: 400 },
          );
      }
    }

    Sentry.captureException(error, {
      tags: {
        feature: "payments",
        operation: "create-payment",
      },
    });

    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}