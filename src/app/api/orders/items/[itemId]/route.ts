import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { requireUser } from "@/lib/auth-session";
import {
  removeOrderItem,
  updateOrderItem,
} from "@/lib/services/order.service";
import { updateOrderItemSchema } from "@/lib/validation/order";
import {
  enforceRateLimit,
  rateLimiters,
} from "@/lib/rate-limit";

type RouteContext = {
  params: {
    itemId: string;
  };
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const user = await requireUser();
    const rateLimitResponse = await enforceRateLimit(
      rateLimiters.cart,
      user.id,
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    const parsed = updateOrderItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid quantity",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const order = await updateOrderItem(
      user.id,
      params.itemId,
      parsed.data.quantity,
    );

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "UNAUTHORIZED":
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );

        case "ORDER_ITEM_NOT_FOUND":
          return NextResponse.json(
            { error: "Order item not found" },
            { status: 404 },
          );

        case "PRODUCT_NOT_AVAILABLE":
          return NextResponse.json(
            {
              error: "Product is no longer available",
            },
            { status: 409 },
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
        operation: "update-item",
      },
    });

    return NextResponse.json(
      { error: "Failed to update order item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const user = await requireUser();
    const rateLimitResponse = await enforceRateLimit(
      rateLimiters.cart,
      user.id,
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const order = await removeOrderItem(
      user.id,
      params.itemId,
    );

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

    if (
      error instanceof Error &&
      error.message === "ORDER_ITEM_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 },
      );
    }

    Sentry.captureException(error, {
      tags: {
        feature: "orders",
        operation: "delete-item",
      },
    });

    return NextResponse.json(
      { error: "Failed to remove order item" },
      { status: 500 },
    );
  }
}

