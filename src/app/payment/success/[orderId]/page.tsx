
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

type Props = {
  params: {
    orderId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  params,
}: Props) {
  const user = await requireUser();

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      userId: user.id,
    },
    include: {
      payments: {
        where: {
          status: "SUCCEEDED",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Never show a success message without confirmed payment.
  if (order.status !== "PAID" || order.payments.length === 0) {
    redirect("/cart");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-700">
          ✓
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Payment Successful!
        </h1>

        <p className="mt-3 text-gray-600">
          Thank you for your order. Your payment has been confirmed.
        </p>

        <div className="mt-8 rounded-xl bg-gray-50 p-5 text-left">
          <div className="flex justify-between gap-4 py-2">
            <span className="text-gray-500">Order ID</span>
            <span className="break-all text-right font-medium">
              {order.id}
            </span>
          </div>

          <div className="flex justify-between gap-4 py-2">
            <span className="text-gray-500">Payment status</span>
            <span className="font-semibold text-green-700">
              SUCCEEDED
            </span>
          </div>

          <div className="flex justify-between gap-4 border-t pt-4">
            <span className="font-medium">Total paid</span>
            <span className="text-xl font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: order.payments[0].currency,
              }).format(order.payments[0].amount)}
            </span>
          </div>
        </div>

        <div className="mt-8 text-left">
          <h2 className="mb-4 text-lg font-semibold">
            Items ordered
          </h2>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 border-b pb-3"
              >
                <span className="text-gray-700">
                  {item.product.name} × {item.quantity}
                </span>

                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: order.payments[0].currency,
                  }).format(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}
