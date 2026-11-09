import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  createPayment,
  verifyPayment,
} from "../services/payment.service";

function handleError(res: Response, error: unknown) {
 const code = error instanceof Error ? error.message : "";

console.error("Payment request failed:", error);
console.error("Payment error code:", code);

  const errors: Record<string, { status: number; message: string }> = {
    INVALID_USER_ID: {
      status: 401,
      message: "احراز هویت نامعتبر است",
    },
    INVALID_SHIPPING_ADDRESS: {
      status: 400,
      message: "اطلاعات آدرس ارسال معتبر نیست",
    },
    CART_EMPTY: {
      status: 400,
      message: "سبد خرید خالی است",
    },
    PRODUCT_NOT_FOUND: {
      status: 404,
      message: "یکی از محصولات دیگر موجود نیست",
    },
    VARIANT_NOT_FOUND: {
      status: 400,
      message: "واریانت محصول معتبر نیست",
    },
    INSUFFICIENT_STOCK: {
      status: 409,
      message: "موجودی یکی از محصولات کافی نیست",
    },
    INVALID_PRODUCT_PRICE: {
      status: 400,
      message: "قیمت محصول معتبر نیست",
    },
    INVALID_ORDER_AMOUNT: {
      status: 400,
      message: "مبلغ سفارش معتبر نیست",
    },
    INVALID_ORDER_ID: {
      status: 400,
      message: "شناسه سفارش معتبر نیست",
    },
    ORDER_NOT_FOUND: {
      status: 404,
      message: "سفارش پیدا نشد",
    },
    ZARINPAL_MERCHANT_ID_NOT_CONFIGURED: {
      status: 500,
      message: "اطلاعات درگاه پرداخت تنظیم نشده است",
    },
    CLIENT_URL_NOT_CONFIGURED: {
      status: 500,
      message: "آدرس فرانت‌اند تنظیم نشده است",
    },
    BACKEND_URL_NOT_CONFIGURED: {
      status: 500,
      message: "آدرس بک‌اند تنظیم نشده است",
    },
    ZARINPAL_CONNECTION_FAILED: {
      status: 502,
      message: "ارتباط با درگاه پرداخت برقرار نشد",
    },
  };

  const known = errors[code];

  if (known) {
    return res.status(known.status).json({
      success: false,
      message: known.message,
    });
  }

  console.error("Payment error:", error);

  return res.status(500).json({
    success: false,
    message: "خطا در پردازش پرداخت",
  });
}

export async function createPaymentController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "ابتدا وارد حساب کاربری شوید",
      });
    }

    const result = await createPayment(
      userId,
      req.body?.shippingAddress,
    );

    return res.status(200).json({
      success: true,
      message: "درخواست پرداخت ایجاد شد",
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyPaymentController(
  req: Request,
  res: Response,
) {
  const clientUrl = (
    process.env.CLIENT_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  try {
    const orderId =
      typeof req.query.orderId === "string"
        ? req.query.orderId
        : "";

    const authority =
      typeof req.query.Authority === "string"
        ? req.query.Authority
        : "";

    const status =
      typeof req.query.Status === "string"
        ? req.query.Status
        : "";

    if (!orderId || !authority) {
      return res.redirect(
        `${clientUrl}/checkout/result?status=failed`,
      );
    }

    const result = await verifyPayment(
      orderId,
      authority,
      status,
    );

    if (!result.success) {
      return res.redirect(
        `${clientUrl}/checkout/result?status=failed&orderId=${orderId}`,
      );
    }

    return res.redirect(
      `${clientUrl}/checkout/result?status=success&orderId=${orderId}`,
    );
  } catch (error) {
    console.error("Payment verification error:", error);

    const orderId =
      typeof req.query.orderId === "string"
        ? req.query.orderId
        : "";

    return res.redirect(
      `${clientUrl}/checkout/result?status=error&orderId=${encodeURIComponent(orderId)}`,
    );
  }
}