import Link from "next/link";
import Image from "next/image";

import { requireUser } from "@/lib/auth-session";
import { getCurrentOrder } from "@/lib/services/order.service";
import CartItemActions from "@/components/CartItemActions";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await requireUser();
  const order = await getCurrentOrder(user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Continue shopping
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Your Cart
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {order.itemCount}{" "}
          {order.itemCount === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      {order.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="text-5xl">🛒</div>

          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Your cart is empty
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Add some products to your cart and they will appear here.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Cart items */}
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="line-clamp-2 font-semibold text-slate-900">
                        {item.product.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>

                    <p className="shrink-0 font-bold text-slate-900">
                      ${item.subtotal.toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-auto pt-3">
                    <CartItemActions
                      itemId={item.id}
                      quantity={item.quantity}
                      stock={item.product.stock}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Order Summary
            </h2>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Items</span>
                <span>{order.itemCount}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>${order.total.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">
                    Total
                  </span>

                  <span className="text-xl font-bold text-slate-900">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white opacity-50"
            >
              Checkout
            </button>

            <p className="mt-2 text-center text-xs text-slate-400">
              Checkout will be available in the next phase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

