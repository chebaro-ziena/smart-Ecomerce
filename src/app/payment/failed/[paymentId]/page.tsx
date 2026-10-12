
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

type Props = {
  params: {
    paymentId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function PaymentFailedPage({
  params,
}: Props) {
  const user = await requireUser();

  const payment = await prisma.payment.findFirst({
    where: {
      id: params.paymentId,
      order: {
        userId: user.id,
      },
    },
    include: {
      order: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  // Don't show failure if payment has since succeeded.
  if (payment.status === "SUCCEEDED") {
    redirect(`/payment/success/${payment.orderId}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl text-red-600">
          !
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Payment Failed
        </h1>

        <p className="mt-3 text-gray-600">
          We couldn&apos;t complete your payment. Your order has not been
          marked as paid.
        </p>

        <div className="mt-8 rounded-xl bg-gray-50 p-5 text-left">
          <div className="flex justify-between gap-4 py-2">
            <span className="text-gray-500">Order ID</span>
            <span className="break-all text-right font-medium">
              {payment.order.id}
            </span>
          </div>

          <div className="flex justify-between gap-4 py-2">
            <span className="text-gray-500">Payment status</span>
            <span className="font-semibold text-red-600">
              {payment.status}
            </span>
          </div>

          <div className="flex justify-between gap-4 border-t pt-4">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: payment.currency,
              }).format(payment.amount)}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/cart"
            className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
          >
            Return to Cart
          </Link>

          <Link
            href="/"
            className="rounded-lg border px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
