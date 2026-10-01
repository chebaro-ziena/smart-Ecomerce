import { z } from "zod";

export const productSortSchema = z.enum([
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
]);

export const productQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .optional(),

  category: z
    .string()
    .trim()
    .max(100)
    .optional(),

  minPrice: z.coerce
    .number()
    .min(0)
    .optional(),

  maxPrice: z.coerce
    .number()
    .min(0)
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20),

  cursor: z
    .string()
    .optional(),

  sort: productSortSchema.default("newest"),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductSort = z.infer<typeof productSortSchema>;

