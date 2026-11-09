import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,

  max: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "تعداد درخواست کد بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
  },
});