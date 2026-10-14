
import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Protect this endpoint with a secret.
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    // Calculate yesterday using UTC boundaries.
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 1);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        },
        payments: {
          some: {
            status: PaymentStatus.SUCCEEDED,
          },
        },
      },
      select: {
        id: true,
        total: true,
        payments: {
          where: {
            status: PaymentStatus.SUCCEEDED,
          },
          select: {
            currency: true,
          },
          take: 1,
        },
      },
    });

    // Count each qualifying order once.
    // Group order totals by the currency of a successful payment.
    const totalsByCurrency: Record<
      string,
      { orders: number; revenue: number }
    > = {};

    for (const order of orders) {
      const currency = order.payments[0]?.currency ?? "USD";

      if (!totalsByCurrency[currency]) {
        totalsByCurrency[currency] = {
          orders: 0,
          revenue: 0,
        };
      }

      totalsByCurrency[currency].orders += 1;
      totalsByCurrency[currency].revenue += order.total;
    }

    for (const totals of Object.values(totalsByCurrency)) {
      totals.revenue = Number(totals.revenue.toFixed(2));
    }

    return NextResponse.json({
      success: true,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        timezone: "UTC",
      },
      orderCount: orders.length,
      totalsByCurrency,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Daily sales report failed:", error);

    return NextResponse.json(
      { error: "Failed to generate daily sales report" },
      { status: 500 },
    );
  }
}
