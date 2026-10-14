
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

import AdminProductTable from "@/components/admin/AdminProductTable";
import ProductOverview from "@/components/admin/ProductOverview";
import DailySalesReport from "@/components/admin/DailySalesReport";
import LowStockReport from "@/components/admin/LowStockReport";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

export default async function AdminHomePage() {
  // 1. Fetch products for statistics, the low-stock report,
  //    and the product management table.
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  // 2. Calculate product statistics.
  const stats = {
    total: products.length,
    published: products.filter((product) => product.published).length,
    aiGenerated: products.filter((product) => product.aiGenerated).length,
  };

  // 3. Calculate yesterday's date range in UTC.
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 1);

  // 4. Fetch qualifying sales orders from yesterday.
  const salesOrders = await prisma.order.findMany({
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

  // 5. Group sales totals by currency.
  const salesByCurrency: Record<
    string,
    { orders: number; revenue: number }
  > = {};

  for (const order of salesOrders) {
    const currency = order.payments[0]?.currency ?? "USD";

    if (!salesByCurrency[currency]) {
      salesByCurrency[currency] = {
        orders: 0,
        revenue: 0,
      };
    }

    salesByCurrency[currency].orders += 1;
    salesByCurrency[currency].revenue += order.total;
  }

  // 6. Find published products with low stock.
  const lowStockProducts = products
    .filter(
      (product) =>
        product.published &&
        product.stock <= LOW_STOCK_THRESHOLD
    )
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      category: product.category
        ? { name: product.category.name }
        : null,
    }));

  // 7. Render the dashboard components.
  return (
    <div className="space-y-8">
      <ProductOverview
        total={stats.total}
        published={stats.published}
        aiGenerated={stats.aiGenerated}
      />

      <DailySalesReport
        date={start.toISOString().slice(0, 10)}
        orderCount={salesOrders.length}
        salesByCurrency={salesByCurrency}
      />

      <LowStockReport
        products={lowStockProducts}
        threshold={LOW_STOCK_THRESHOLD}
      />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Manage Products
        </h2>

        <AdminProductTable initialProducts={products} />
      </section>
    </div>
  );
}
