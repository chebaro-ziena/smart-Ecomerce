"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  paymentId: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
};

export default function MockPaymentActions({
  paymentId,
  status,
}: Props) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment(action: "success" | "failure") {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payments/mock/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Payment failed.");
        return;
      }

      router.push(data.redirectUrl);
    } catch (error) {
      console.error("Mock payment error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "SUCCEEDED") {
    return (
      <div className="mt-6 rounded-xl bg-green-50 p-5 text-center">
        <p className="font-semibold text-green-700">
          Payment already completed.
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-black px-5 py-2 text-white"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handlePayment("success")}
        className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Processing..."
          : "Simulate Successful Payment"}
      </button>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handlePayment("failure")}
        className="w-full rounded-lg border border-red-300 px-5 py-3 font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Simulate Failed Payment
      </button>
    </div>
  );
}