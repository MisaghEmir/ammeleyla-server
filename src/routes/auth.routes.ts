
import { Router } from "express";

import {
  sendCode,
  verifyCode,
  completeProfile,
  adminLogin,
  getCurrentAdmin,
} from "../controllers/auth.controller";

import {
  authMiddleware,
  type AuthRequest,
} from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { otpRateLimiter } from "../middlewares/rate-limit.middleware";
import User from "../models/user.model";

const router = Router();

router.post("/send-code", otpRateLimiter, sendCode);
router.post("/verify-code", otpRateLimiter, verifyCode);
router.post("/complete-profile", completeProfile);
router.post("/admin-login", otpRateLimiter, adminLogin);

// پروفایل کاربر عادی و ادمین
router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "احراز هویت لازم است",
      });
    }

    const user = await User.findById(req.user.userId)
      .select("_id name phone email role isActive");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "حساب کاربری معتبر یا فعال نیست",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get current user failed:", error);

    return res.status(500).json({
      success: false,
      message: "دریافت اطلاعات حساب انجام نشد",
    });
  }
});

// مسیر مخصوص پروفایل ادمین
router.get(
  "/admin/me",
  authMiddleware,
  adminMiddleware,
  getCurrentAdmin,
);

export default router;
