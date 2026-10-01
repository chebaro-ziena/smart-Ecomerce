import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        published: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        tags: true,
        stock: true,
        aiGenerated: true,
        createdAt: true,
        updatedAt: true,

        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: "products",
        operation: "get",
      },
    });

    return NextResponse.json(
      {
        error: "Failed to fetch product",
      },
      { status: 500 }
    );
  }
}