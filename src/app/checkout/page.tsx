import Image from "next/image";
import Link from "next/link";

import CheckoutForm from "@/components/CheckoutForm";
import { requireUser } from "@/lib/auth-session";
import { getCurrentOrder } from "@/lib/services/order.service";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requireUser();
  const order = await getCurrentOrder(user.id);

  if (order.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-5xl">🛒</div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Your cart is empty
        </h1>

        <p className="mt-2 text-slate-500">
          Add some products before going to checkout.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/cart"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to cart
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Checkout
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review your order and enter your shipping information.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
            <CheckoutForm email={user.email ?? ""} />
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Your Order
          </h2>

          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">
                    {item.product.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-semibold text-slate-900">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Items</span>
              <span>{order.itemCount}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>${order.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Shipping</span>
              <span>Calculated later</span>
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
            Place Order
          </button>

          <p className="mt-3 text-center text-xs text-slate-400">
            Payment will be added in the next checkout stage.
          </p>
        </aside>
      </div>
    </div>
  );
}

