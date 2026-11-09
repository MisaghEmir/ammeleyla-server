import { Request, Response } from "express";

import {
  sendCodeSchema,
  verifyCodeSchema,
  completeProfileSchema,
} from "../validators/auth.validators";

import {
  sendLoginCode,
  verifyLoginCode,
  createUserProfile,
  adminLogin as adminLoginService
} from "../services/auth.service";

import User from "../models/user.model";
import { AuthRequest } from "../middlewares/auth.middleware";

export async function sendCode(req: Request, res: Response) {
  try {
    const result = sendCodeSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0]?.message,
      });
    }

    const { phone } = result.data;

    const response = await sendLoginCode(phone);

    return res.status(200).json(response);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در ارسال کد",
    });
  }
}

export async function verifyCode(req: Request, res: Response) {
  try {
    const result = verifyCodeSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0]?.message,
      });
    }

    const { phone, code } = result.data;

    const response = await verifyLoginCode(phone, code);

    return res.status(200).json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "خطا در تأیید کد",
    });
  }
}

export async function completeProfile(req: Request, res: Response) {
  try {
    const result = completeProfileSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0]?.message,
      });
    }

    const phone = req.body.phone;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "شماره موبایل الزامی است",
      });
    }

    const { name, email } = result.data;

    const response = await createUserProfile(phone, name, email);

    return res.status(201).json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "خطا در ساخت حساب",
    });
  }
}


export async function adminLogin(req: Request, res: Response) {
  try {
    const phone =
      typeof req.body?.phone === "string"
        ? req.body.phone.trim()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    if (!/^09\d{9}$/.test(phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "شماره موبایل یا رمز عبور معتبر نیست",
      });
    }

    const result = await adminLoginService(phone, password);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در ورود";

    if (message === "حساب کاربری غیرفعال است") {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (message === "اجازه ورود به پنل مدیریت را ندارید") {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    return res.status(401).json({
      success: false,
      message: "شماره موبایل یا رمز عبور اشتباه است",
    });
  }
}


export async function getCurrentAdmin(
  req: AuthRequest,
  res: Response,
) {
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

    if (user.role !== "ADMIN" || req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "دسترسی غیرمجاز",
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
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Get current admin failed:", error);

    return res.status(500).json({
      success: false,
      message: "بررسی حساب کاربری انجام نشد",
    });
  }
}
