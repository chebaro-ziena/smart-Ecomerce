import { z } from "zod";

export const addOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const updateOrderItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export type AddOrderItemInput = z.infer<
  typeof addOrderItemSchema
>;

export type UpdateOrderItemInput = z.infer<
  typeof updateOrderItemSchema
>;

