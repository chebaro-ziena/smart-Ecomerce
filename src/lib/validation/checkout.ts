import { z } from "zod";

export const checkoutSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long"),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),

  phone: z
    .string()
    .trim()
    .min(8, "Please enter a valid phone number")
    .max(20, "Phone number is too long"),

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address is too long"),

  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City is too long"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

