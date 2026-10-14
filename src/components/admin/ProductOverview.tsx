
import StatCard from "./StatCard";

type ProductOverviewProps = {
  total: number;
  published: number;
  aiGenerated: number;
};

export default function ProductOverview({
  total,
  published,
  aiGenerated,
}: ProductOverviewProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Product Overview
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total products" value={total} />
        <StatCard label="Published" value={published} />
        <StatCard label="AI-generated" value={aiGenerated} />
      </div>
    </section>
  );
}
