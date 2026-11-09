import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createPaymentController,
  verifyPaymentController,
} from "../controllers/payment.controller";

const router = Router();

// ایجاد درخواست پرداخت نیازمند ورود کاربر است.
router.post("/request", authMiddleware, createPaymentController);

// زرین‌پال برای بازگشت کاربر به این مسیر نیاز به توکن ندارد.
router.get("/verify", verifyPaymentController);

export default router;