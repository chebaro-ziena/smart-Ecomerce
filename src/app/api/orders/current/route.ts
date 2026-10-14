import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { requireUser } from "@/lib/auth-session";
import {
  addToOrder,
  getCurrentOrder,
} from "@/lib/services/order.service";
import { addOrderItemSchema } from "@/lib/validation/order";
import { enforceRateLimit, rateLimiters } from "@/lib/rate-limit";

export async function GET() {
  try {
    const user = await requireUser();

    const order = await getCurrentOrder(user.id);

    return NextResponse.json(order);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    Sentry.captureException(error, {
      tags: {
        feature: "orders",
        operation: "get-current",
      },
    });

    return NextResponse.json(
      { error: "Failed to load current order" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const rateLimitResponse = await enforceRateLimit(
      rateLimiters.cart,
      user.id,
    );

    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();

    const parsed = addOrderItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid order item",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const order = await addToOrder(
      user.id,
      parsed.data.productId,
      parsed.data.quantity,
    );

    return NextResponse.json(order, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "UNAUTHORIZED":
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );

        case "PRODUCT_NOT_FOUND":
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 },
          );

        case "PRODUCT_OUT_OF_STOCK":
          return NextResponse.json(
            { error: "Product is out of stock" },
            { status: 409 },
          );

        case "INSUFFICIENT_STOCK":
          return NextResponse.json(
            {
              error:
                "Requested quantity exceeds available stock",
            },
            { status: 409 },
          );
      }
    }

    Sentry.captureException(error, {
      tags: {
        feature: "orders",
        operation: "add-item",
      },
    });

    return NextResponse.json(
      { error: "Failed to add product" },
      { status: 500 },
    );
  }
}

