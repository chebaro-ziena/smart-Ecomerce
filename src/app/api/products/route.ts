import { NextRequest, NextResponse } from "next/server";
import { productQuerySchema } from "@/lib/validation/product";
import { getProducts } from "@/lib/services/product.service";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(
      req.nextUrl.searchParams.entries()
    );

    const result = productQuerySchema.safeParse(
      searchParams
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid product query",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const products = await getProducts(result.data);

    return NextResponse.json(products);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CURSOR"
    ) {
      return NextResponse.json(
        {
          error: "Invalid pagination cursor",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_PRICE_RANGE"
    ) {
      return NextResponse.json(
        {
          error: "Invalid price range",
        },
        { status: 400 }
      );
    }

    Sentry.captureException(error, {
      tags: {
        feature: "products",
        operation: "list",
      },
    });

    return NextResponse.json(
      {
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}