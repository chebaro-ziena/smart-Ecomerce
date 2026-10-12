import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { requireUser } from "@/lib/auth-session";
import { completeMockPayment } from "@/lib/services/payment.service";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();

    if (
      !body.paymentId ||
      typeof body.paymentId !== "string"
    ) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 },
      );
    }

    if (
      body.action !== "success" &&
      body.action !== "failure"
    ) {
      return NextResponse.json(
        { error: "Invalid payment action" },
        { status: 400 },
      );
    }

    const result = await completeMockPayment(
      user.id,
      body.paymentId,
      body.action,
    );

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      payment: result.payment,
      order: result.order,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "UNAUTHORIZED":
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );

        case "PAYMENT_NOT_FOUND":
          return NextResponse.json(
            { error: "Payment not found" },
            { status: 404 },
          );

        case "PAYMENT_ALREADY_COMPLETED":
          return NextResponse.json(
            { error: "Payment has already been completed" },
            { status: 409 },
          );

        case "ORDER_NOT_FOUND":
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 },
          );

        case "INSUFFICIENT_STOCK":
          return NextResponse.json(
            {
              error:
                "Payment succeeded, but there is insufficient stock.",
            },
            { status: 409 },
          );
      }
    }

    Sentry.captureException(error, {
      tags: {
        feature: "payments",
        operation: "mock-complete",
      },
    });

    return NextResponse.json(
      { error: "Failed to complete payment" },
      { status: 500 },
    );
  }
}