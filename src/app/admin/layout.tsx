import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/requireAdmin";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <nav className="flex gap-2 text-sm">
          <Link href="/admin" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-white">
            Products
          </Link>
          <Link
            href="/admin/new"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
          >
            + New product (AI)
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
