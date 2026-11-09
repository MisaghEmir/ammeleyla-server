import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  slug: z
    .string()
    .trim()
    .min(2)
    .max(150),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  image: z
    .string()
    .trim()
    .optional(),

  isActive: z
    .boolean()
    .optional(),

  sortOrder: z
    .number()
    .int()
    .optional(),
});

export const updateCategorySchema =
  createCategorySchema.partial();