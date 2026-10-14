
export type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  category: {
    name: string;
  } | null;
};

type LowStockReportProps = {
  products: LowStockProduct[];
  threshold?: number;
};

export default function LowStockReport({
  products,
  threshold = 5,
}: LowStockReportProps) {
  const sortedProducts = [...products].sort(
    (a, b) => a.stock - b.stock
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Low-Stock Report
        </h2>

        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
          {sortedProducts.length} products need attention
        </span>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No products are at or below {threshold} units.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Stock remaining</th>
              </tr>
            </thead>

            <tbody>
              {sortedProducts.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-3 font-medium text-slate-900">
                    {product.name}
                  </td>

                  <td className="p-3">
                    {product.category?.name ?? "Uncategorized"}
                  </td>

                  <td className="p-3">
                    <span
                      className={
                        product.stock === 0
                          ? "font-semibold text-red-600"
                          : "font-semibold text-amber-700"
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
