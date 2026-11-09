import { z } from "zod";

const variantSchema = z.object({
  color: z
    .string()
    .trim()
    .min(1),

  size: z
    .string()
    .trim()
    .min(1),

  sku: z
    .string()
    .trim()
    .min(1),

  price: z
    .number()
    .nonnegative(),

  compareAtPrice: z
    .number()
    .nonnegative()
    .optional(),

  stock: z
    .number()
    .int()
    .nonnegative(),

  isActive: z
    .boolean()
    .optional(),
});

const imageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1),

  alt: z
    .string()
    .trim()
    .optional(),
});

export const createProductSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(200),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(200),

    description: z
      .string()
      .trim()
      .min(1),

    category: z
      .string()
      .trim()
      .min(1),

    images: z
      .array(imageSchema)
      .optional(),

    variants: z
      .array(variantSchema)
      .min(1),

    tags: z
      .array(z.string().trim())
      .optional(),

    isActive: z
      .boolean()
      .optional(),

    isFeatured: z
      .boolean()
      .optional(),
  });

export const updateProductSchema =
  createProductSchema.partial();