"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  published: boolean;
  aiGenerated: boolean;
  category: { name: string } | null;
}

export default function AdminProductTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  async function togglePublished(product: Product) {
    setBusyId(product.id);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !product.published }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, published: !p.published } : p))
      );
    }
    setBusyId(null);
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setBusyId(product.id);
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    }
    setBusyId(null);
    router.refresh();
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        No products yet. Click &quot;+ New product (AI)&quot; to upload your first photo.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p) => (
            <tr key={p.id} className={busyId === p.id ? "opacity-50" : ""}>
              <td className="flex items-center gap-3 px-4 py-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-md bg-slate-100">
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{p.name}</p>
                  {p.aiGenerated && (
                    <span className="text-xs text-brand-600">✨ AI-generated</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500">{p.category?.name ?? "—"}</td>
              <td className="px-4 py-3">${p.price.toFixed(2)}</td>
              <td className="px-4 py-3">{p.stock}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => togglePublished(p)}
                  disabled={busyId === p.id}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.published
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {p.published ? "Published" : "Draft"}
                </button>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => deleteProduct(p)}
                  disabled={busyId === p.id}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
