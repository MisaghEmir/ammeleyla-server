import { z } from "zod";

export const sendCodeSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
});

export const verifyCodeSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),

  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "کد باید ۶ رقم باشد"),
});

export const completeProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام حداقل باید ۲ کاراکتر باشد")
    .max(100),

  email: z
    .string()
    .trim()
    .email("ایمیل معتبر نیست")
    .optional()
    .or(z.literal("")),
});