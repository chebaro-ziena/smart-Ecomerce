
import StatCard from "./StatCard";

export type SalesByCurrency = Record<
  string,
  {
    orders: number;
    revenue: number;
  }
>;

type DailySalesReportProps = {
  date: string;
  orderCount: number;
  salesByCurrency: SalesByCurrency;
};

export default function DailySalesReport({
  date,
  orderCount,
  salesByCurrency,
}: DailySalesReportProps) {
  const currencies = Object.entries(salesByCurrency);

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        Daily Sales Report
      </h2>

      <p className="mb-4 text-sm text-slate-500">
        Yesterday: {date} (UTC)
      </p>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Qualifying orders"
          value={orderCount}
        />

        {currencies.length === 0 ? (
          <StatCard label="Revenue" value="No sales" />
        ) : (
          currencies.map(([currency, totals]) => (
            <StatCard
              key={currency}
              label={`Revenue (${currency})`}
              value={`${totals.revenue.toFixed(2)} ${currency}`}
            />
          ))
        )}
      </div>

      {currencies.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Currency</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Revenue</th>
              </tr>
            </thead>

            <tbody>
              {currencies.map(([currency, totals]) => (
                <tr key={currency} className="border-t">
                  <td className="p-3">{currency}</td>
                  <td className="p-3">{totals.orders}</td>
                  <td className="p-3">
                    {totals.revenue.toFixed(2)} {currency}
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
