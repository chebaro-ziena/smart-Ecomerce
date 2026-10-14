
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const threshold = 5;

    const products = await prisma.product.findMany({
      where: {
        published: true,
        stock: {
          lte: threshold,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        stock: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      threshold,
      lowStockCount: products.length,
      products,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Low-stock report failed:", error);

    return NextResponse.json(
      { error: "Failed to generate low-stock report" },
      { status: 500 },
    );
  }
}
