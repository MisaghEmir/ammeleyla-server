import bcrypt from "bcrypt";
import OtpCode from "../models/otp.model";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


export async function createOtp(phone: string): Promise<string> {
  console.log("\n[OTP] درخواست ساخت کد دریافت شد.");

  const code = generateOtp();

  try {
    const codeHash = await bcrypt.hash(code, 10);

    // حذف کدهای قبلی این شماره
    await OtpCode.deleteMany({ phone });

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OtpCode.create({
      phone,
      codeHash,
      expiresAt,
      attempts: 0,
    });

    console.log("\n=================================");
    console.log("📱 OTP - DEVELOPMENT");
    console.log(`Phone: ${phone}`);
    console.log(`Code: ${code}`);
    console.log("Expires: 2 minutes");
    console.log("=================================\n");

    return code;
  } catch (error) {
    console.error("[OTP] خطا در ساخت یا ذخیره کد:", error);
    throw error;
  }
}


export async function verifyOtp(
  phone: string,
  code: string
): Promise<boolean> {
  const otp = await OtpCode.findOne({ phone });

  if (!otp) {
    return false;
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    await OtpCode.deleteOne({ _id: otp._id });
    return false;
  }

  if (otp.attempts >= 5) {
    await OtpCode.deleteOne({ _id: otp._id });
    return false;
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);

  if (!isValid) {
    otp.attempts += 1;
    await otp.save();

    return false;
  }

  await OtpCode.deleteOne({ _id: otp._id });

  return true;
}