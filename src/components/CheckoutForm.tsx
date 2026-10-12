"use client";

import { useState } from "react";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";

interface CheckoutFormProps {
  email: string;
}

export default function CheckoutForm({ email }: CheckoutFormProps) {
  const [formData, setFormData] = useState<CheckoutInput>({
    firstName: "",
    lastName: "",
    email,
    phone: "",
    address: "",
    city: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CheckoutInput, string>>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    // Remove the error for this field as the user edits it.
    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  }

 
  
async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  // 1. Validate checkout form
  const result = checkoutSchema.safeParse(formData);

  if (!result.success) {
    const fieldErrors: Partial<
      Record<keyof CheckoutInput, string>
    > = {};

    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof CheckoutInput;

      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }

    setErrors(fieldErrors);
    return;
  }

  setErrors({});
  setIsSubmitting(true);

  try {
    // 2. Prepare the order
    const checkoutResponse = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result.data),
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      setErrors({
        email: checkoutData.error || "Checkout failed.",
      });
      return;
    }

    const order = checkoutData.order;

    console.log("Checkout prepared:", order);

    // 3. Create payment
    const paymentResponse = await fetch("/api/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: order.id,
      }),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      setErrors({
        email: paymentData.error || "Failed to create payment.",
      });
      return;
    }

    console.log("Payment created:", paymentData.payment);

    // 4. Redirect customer to payment provider
    if (!paymentData.checkoutUrl) {
      setErrors({
        email: "Payment checkout URL is missing.",
      });
      return;
    }

    window.location.href = paymentData.checkoutUrl;
  } catch (error) {
    console.error("Checkout error:", error);

    setErrors({
      email: "Something went wrong. Please try again.",
    });
  } finally {
    setIsSubmitting(false);
  }
}



  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Contact Information
        </h2>

        <div className="mt-5">
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
              errors.email
                ? "border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            }`}
          />

          {errors.email && (
            <p className="mt-1 text-xs text-red-600">
              {errors.email}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Shipping Information
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            id="firstName"
            label="First name"
            placeholder="John"
            value={formData.firstName}
            error={errors.firstName}
            onChange={handleChange}
          />

          <Field
            id="lastName"
            label="Last name"
            placeholder="Doe"
            value={formData.lastName}
            error={errors.lastName}
            onChange={handleChange}
          />

          <div className="sm:col-span-2">
            <Field
              id="address"
              label="Address"
              placeholder="123 Main Street"
              value={formData.address}
              error={errors.address}
              onChange={handleChange}
            />
          </div>

          <Field
            id="city"
            label="City"
            placeholder="Beirut"
            value={formData.city}
            error={errors.city}
            onChange={handleChange}
          />

          <Field
            id="phone"
            label="Phone"
            placeholder="+961 XX XXX XXX"
            value={formData.phone}
            error={errors.phone}
            onChange={handleChange}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Processing..." : "Place Order"}
      </button>
    </form>
  );
}

interface FieldProps {
  id: keyof CheckoutInput;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  id,
  label,
  placeholder,
  value,
  error,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
          error
            ? "border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        }`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

