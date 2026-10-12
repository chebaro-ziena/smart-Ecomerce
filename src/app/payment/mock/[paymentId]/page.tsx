
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import MockPaymentActions from "@/components/MockPaymentActions";

type Props = {
  params: {
    paymentId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function MockPaymentPage({
  params,
}: Props) {
  const user = await requireUser();

  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: params.paymentId,
      order: {
        userId: user.id,
      },
    },
    include: {
      order: {
        select: {
          id: true,
          total: true,
          status: true,
          email: true,
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  if (payment.status === "SUCCEEDED") {
    redirect(`/payment/success/${payment.orderId}`);
  }

  if (payment.status === "FAILED") {
    redirect(`/payment/failed/${payment.id}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Smart E-commerce
          </p>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Complete Your Payment
          </h1>

          <p className="mt-2 text-gray-600">
            This is a simulated payment page for development.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-gray-600">Payment status</span>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
              {payment.status}
            </span>
          </div>

          <div className="space-y-4 border-t border-gray-100 py-5">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Order ID</span>
              <span className="max-w-[60%] break-all text-right text-sm font-medium text-gray-900">
                {payment.order.id}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Payment ID</span>
              <span className="max-w-[60%] break-all text-right text-sm font-medium text-gray-900">
                {payment.providerPaymentId}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Payment method</span>
              <span className="font-medium text-gray-900">
                Mock Provider
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <p className="text-sm text-gray-500">Total to pay</p>

            <p className="mt-1 text-4xl font-bold text-gray-900">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: payment.currency,
              }).format(payment.amount)}
            </p>
          </div>

          <MockPaymentActions
            paymentId={payment.id}
            status={payment.status}
          />
        </div>

        <p className="mt-5 text-center text-xs text-gray-500">
          Test environment only. No real payment will be processed.
        </p>
      </div>
    </main>
  );
}
