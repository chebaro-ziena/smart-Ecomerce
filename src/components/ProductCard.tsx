"use client";

import Image from "next/image";
import { useState } from "react";

export interface ProductCardData {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  tags: string;
  stock: number;
  published: boolean;
  category?: { name: string } | null;
}

export default function ProductCard({
  product,
}: {
  product: ProductCardData;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const tags = product.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  async function handleAddToCart() {
    if (isAdding) return;

    setIsAdding(true);
    setMessage(null);

    try {
      const response = await fetch("/api/orders/current", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setMessage("Please login first.");
          return;
        }

        setMessage(data.error || "Failed to add to cart.");
        return;
      }

      setMessage("Added to cart!");

      // Remove the message after a short delay.
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error("Add to cart error:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category?.name && (
          <span className="w-fit rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {product.category.name}
          </span>
        )}

        <h3 className="line-clamp-1 font-semibold text-slate-900">
          {product.name}
        </h3>

        <p className="line-clamp-2 flex-1 text-sm text-slate-500">
          {product.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-slate-900">
            ${product.price.toFixed(2)}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdding
              ? "Adding..."
              : isOutOfStock
                ? "Out of stock"
                : "Add to cart"}
          </button>
        </div>

        {message && (
          <p
            className={`text-xs font-medium ${
              message === "Added to cart!"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

