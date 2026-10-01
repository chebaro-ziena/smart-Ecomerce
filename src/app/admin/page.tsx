import { prisma } from "@/lib/prisma";
import AdminProductTable from "@/components/AdminProductTable";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: products.length,
    published: products.filter((p) => p.published).length,
    aiGenerated: products.filter((p) => p.aiGenerated).length,
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total products" value={stats.total} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="AI-generated" value={stats.aiGenerated} />
      </div>
      <AdminProductTable initialProducts={products} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
