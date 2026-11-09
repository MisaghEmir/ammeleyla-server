
import User from "../models/user.model";
import { generateToken } from "../utils/jwt";
import { normalizeIranPhone } from "../utils/phone";
import { createOtp, verifyOtp } from "./otp.service";
import bcrypt from "bcrypt";

function getValidPhone(phone: string): string {
  const normalizedPhone = normalizeIranPhone(phone);

  if (!normalizedPhone) {
    throw new Error(
      "شماره موبایل معتبر نیست. شماره را با فرمت 09123456789 وارد کنید.",
    );
  }

  return normalizedPhone;
}

export async function sendLoginCode(phone: string) {
  const normalizedPhone = getValidPhone(phone);

  await createOtp(normalizedPhone);

  return {
    success: true,
    message: "کد تأیید ساخته شد. برای تست، ترمینال سرور را بررسی کنید.",
  };
}

export async function verifyLoginCode(phone: string, code: string) {
  const normalizedPhone = getValidPhone(phone);

  const isValid = await verifyOtp(normalizedPhone, code.trim());

  if (!isValid) {
    throw new Error("کد تأیید اشتباه یا منقضی شده است");
  }

  const user = await User.findOne({ phone: normalizedPhone });

  if (!user) {
    return {
      isNewUser: true,
      token: null,
      user: null,
    };
  }

  if (!user.isActive) {
    throw new Error("حساب کاربری غیرفعال است");
  }

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return {
    isNewUser: false,
    token,
    user,
  };
}

export async function createUserProfile(
  phone: string,
  name: string,
  email?: string,
) {
  const normalizedPhone = getValidPhone(phone);

  const existingUser = await User.findOne({
    phone: normalizedPhone,
  });

  if (existingUser) {
    throw new Error("این شماره قبلاً ثبت شده است");
  }

  const user = await User.create({
    name: name.trim(),
    phone: normalizedPhone,
    email: email?.trim() || undefined,
    role: "USER",
    isActive: true,
  });

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return {
    token,
    user,
  };
}

// ورود ادمین با شماره موبایل و رمز عبور
export async function adminLogin(phone: string, password: string) {
  const normalizedPhone = getValidPhone(phone);

  const user = await User.findOne({
    phone: normalizedPhone,
  }).select("+password");

  if (!user || !user.password) {
    throw new Error("شماره موبایل یا رمز عبور اشتباه است");
  }

  if (!user.isActive) {
    throw new Error("حساب کاربری غیرفعال است");
  }

  if (user.role !== "ADMIN") {
    throw new Error("اجازه ورود به پنل مدیریت را ندارید");
  }

  const passwordIsValid = await bcrypt.compare(
    password,
    user.password,
  );

  if (!passwordIsValid) {
    throw new Error("شماره موبایل یا رمز عبور اشتباه است");
  }

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  };
}
