import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { requireUser } from "@/lib/auth-session";
import { prepareCheckout } from "@/lib/services/order.service";
import { checkoutSchema } from "@/lib/validation/checkout";
import { enforceRateLimit , rateLimiters } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const rateLimitResponse = await enforceRateLimit(
      rateLimiters.checkout,
      user.id,
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid checkout information",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const order = await prepareCheckout(user.id, parsed.data);

    return NextResponse.json({
      success: true,
      order,
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
            { error: "No active cart found" },
            { status: 404 },
          );

        case "EMPTY_ORDER":
          return NextResponse.json(
            { error: "Your cart is empty" },
            { status: 400 },
          );

        case "PRODUCT_NOT_AVAILABLE":
          return NextResponse.json(
            {
              error: "One or more products are no longer available",
            },
            { status: 409 },
          );

        case "PRODUCT_OUT_OF_STOCK":
          return NextResponse.json(
            {
              error: "One or more products are out of stock",
            },
            { status: 409 },
          );

        case "INSUFFICIENT_STOCK":
          return NextResponse.json(
            {
              error:
                "One or more products have insufficient stock",
            },
            { status: 409 },
          );
      }
    }

    Sentry.captureException(error, {
      tags: {
        feature: "orders",
        operation: "checkout",
      },
    });

    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 },
    );
  }
}
