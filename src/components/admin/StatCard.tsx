
type StatCardProps = {
  label: string;
  value: string | number;
};

export default function StatCard({
  label,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
