"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CartItemActionsProps {
  itemId: string;
  quantity: number;
  stock: number;
}

export default function CartItemActions({
  itemId,
  quantity,
  stock,
}: CartItemActionsProps) {
  const router = useRouter();

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateQuantity(newQuantity: number) {
    if (isUpdating) return;

    if (newQuantity < 1) return;

    if (newQuantity > stock) {
      setError(`Only ${stock} available.`);
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update quantity.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Update cart error:", error);
      setError("Something went wrong.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function removeItem() {
    if (isUpdating) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/items/${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to remove item.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Remove cart item error:", error);
      setError("Something went wrong.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => updateQuantity(quantity - 1)}
            disabled={isUpdating || quantity <= 1}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span className="min-w-10 px-2 text-center text-sm font-medium text-slate-900">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => updateQuantity(quantity + 1)}
            disabled={isUpdating || quantity >= stock}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={removeItem}
          disabled={isUpdating}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {isUpdating ? "Updating..." : "Remove"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

