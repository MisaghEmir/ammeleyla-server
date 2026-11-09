import { z } from "zod";

export const createAddressSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "عنوان آدرس الزامی است")
    .max(50),

  recipientName: z
    .string()
    .trim()
    .min(2, "نام گیرنده الزامی است")
    .max(100),

  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),

  province: z
    .string()
    .trim()
    .min(2, "استان الزامی است"),

  city: z
    .string()
    .trim()
    .min(2, "شهر الزامی است"),

  address: z
    .string()
    .trim()
    .min(5, "آدرس کامل الزامی است")
    .max(500),

  postalCode: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),

  plaque: z
    .string()
    .trim()
    .optional(),

  unit: z
    .string()
    .trim()
    .optional(),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  isDefault: z
    .boolean()
    .optional(),
});

export const updateAddressSchema = createAddressSchema.partial();