import mongoose from "mongoose";
import Cart from "../models/cart.model";
import Product from "../models/product.model";
import Order from "../models/order.model";

interface ShippingAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
}

interface ZarinpalResponse {
  data?: {
    code?: number;
    message?: string;
    authority?: string;
    ref_id?: number;
  };
  errors?: unknown;
}

function getPaymentConfig() {
  const isSandbox = process.env.ZARINPAL_SANDBOX !== "false";
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;

  const baseUrl = isSandbox
    ? "https://sandbox.zarinpal.com/pg/v4/payment"
    : "https://payment.zarinpal.com/pg/v4/payment";

  const startPayUrl = isSandbox
    ? "https://sandbox.zarinpal.com/pg/StartPay"
    : "https://payment.zarinpal.com/pg/StartPay";

  return { isSandbox, merchantId, baseUrl, startPayUrl };
}

function getCallbackUrl() {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    throw new Error("BACKEND_URL_NOT_CONFIGURED");
  }

  return `${backendUrl.replace(/\/+$/, "")}/api/payments/verify`;
}

async function zarinpalRequest(
  endpoint: "request" | "verify",
  body: Record<string, unknown>,
): Promise<ZarinpalResponse> {
  const { merchantId, baseUrl } = getPaymentConfig();

  if (!merchantId) {
    throw new Error("ZARINPAL_MERCHANT_ID_NOT_CONFIGURED");
  }

  try {
    const response = await fetch(`${baseUrl}/${endpoint}.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        ...body,
      }),
    });

    const responseText = await response.text();

    console.log("Zarinpal HTTP Status:", response.status);
    console.log("Zarinpal Response:", responseText);

    let result: ZarinpalResponse;

    try {
      result = JSON.parse(responseText) as ZarinpalResponse;
    } catch {
      throw new Error("ZARINPAL_INVALID_RESPONSE");
    }

    return result;
  } catch (error) {
    console.error("Zarinpal Request Error:", error);

    if (
      error instanceof Error &&
      error.message === "ZARINPAL_INVALID_RESPONSE"
    ) {
      throw error;
    }

    throw new Error("ZARINPAL_CONNECTION_FAILED");
  }
}

function validateShippingAddress(
  address: ShippingAddress,
): boolean {
  return Boolean(
    address &&
      address.name?.trim() &&
      /^09\d{9}$/.test(address.phone) &&
      address.province?.trim() &&
      address.city?.trim() &&
      address.address?.trim() &&
      /^\d{10}$/.test(address.postalCode),
  );
}

function getShippingPrice() {
  const shipping = Number(process.env.SHIPPING_PRICE || 0);

  if (!Number.isSafeInteger(shipping) || shipping < 0) {
    throw new Error("INVALID_SHIPPING_PRICE");
  }

  return shipping;
}

// قیمت محصولات و هزینه ارسال در دیتابیس به تومان هستند.
// مبلغ ارسالی به زرین‌پال باید به ریال تبدیل شود.

export async function createPayment(
  userId: string,
  shippingAddress: ShippingAddress,
) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  if (!validateShippingAddress(shippingAddress)) {
    throw new Error("INVALID_SHIPPING_ADDRESS");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    throw new Error("CART_EMPTY");
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findOne({
      _id: item.product,
      isActive: true,
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const variant = product.variants.find(
      (entry) =>
        entry._id?.toString() === item.variant.toString(),
    );

    if (!variant || !variant.isActive) {
      throw new Error("VARIANT_NOT_FOUND");
    }

    if (variant.stock < item.quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const price = Number(variant.price);

    if (!Number.isSafeInteger(price) || price <= 0) {
      throw new Error("INVALID_PRODUCT_PRICE");
    }

    subtotal += price * item.quantity;

    if (!Number.isSafeInteger(subtotal)) {
      throw new Error("INVALID_ORDER_AMOUNT");
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url,
      variantId: variant._id?.toString(),
      color: variant.color,
      size: variant.size,
      sku: variant.sku,
      quantity: item.quantity,
      price,
    });
  }

  if (!Number.isSafeInteger(subtotal) || subtotal <= 0) {
    throw new Error("INVALID_ORDER_AMOUNT");
  }

  const shipping = getShippingPrice();
  const discount = 0;
  const total = subtotal - discount + shipping;

  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new Error("INVALID_ORDER_AMOUNT");
  }

  const amountInRial = total * 10;

  if (!Number.isSafeInteger(amountInRial)) {
    throw new Error("INVALID_ORDER_AMOUNT");
  }

  const order = await Order.create({
    user: userId,
    items: orderItems,
    shippingAddress,
    subtotal,
    discount,
    shipping,
    total,
    status: "PENDING",
    paymentMethod: "ONLINE",
    paymentStatus: "PENDING",
  });

  try {
    const result = await zarinpalRequest("request", {
      amount: amountInRial,
      callback_url: `${getCallbackUrl()}?orderId=${order._id}`,
      description: `پرداخت سفارش ${order._id}`,
      metadata: {
        mobile: shippingAddress.phone,
      },
    });

    if (
      result.data?.code !== 100 ||
      !result.data.authority
    ) {
      throw new Error(
        result.data?.message || "PAYMENT_REQUEST_FAILED",
      );
    }

    order.paymentAuthority = result.data.authority;
    await order.save();

    const { startPayUrl } = getPaymentConfig();

    return {
      orderId: order._id.toString(),
      paymentUrl: `${startPayUrl}/${result.data.authority}`,
      amount: total,
    };
  } catch (error) {
    await Order.deleteOne({ _id: order._id });
    throw error;
  }
}

export async function verifyPayment(
  orderId: string,
  authority: string,
  status: string,
) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new Error("INVALID_ORDER_ID");
  }

  const existingOrder = await Order.findOne({
    _id: orderId,
    paymentAuthority: authority,
  });

  if (!existingOrder) {
    throw new Error("ORDER_NOT_FOUND");
  }

  if (existingOrder.paymentStatus === "PAID") {
    return {
      success: true,
      alreadyVerified: true,
      refId: existingOrder.paymentRefId,
      orderId: existingOrder._id.toString(),
    };
  }

  if (status !== "OK") {
    await Order.updateOne(
      {
        _id: orderId,
        paymentAuthority: authority,
        paymentStatus: "PENDING",
        status: "PENDING",
      },
      {
        $set: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
        },
      },
    );

    return {
      success: false,
      orderId: existingOrder._id.toString(),
    };
  }

  // فقط یک درخواست می‌تواند پردازش این سفارش را شروع کند.
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentAuthority: authority,
      paymentStatus: "PENDING",
      status: "PENDING",
    },
    {
      $set: {
        status: "PROCESSING",
      },
    },
    {
      new: true,
    },
  );

  if (!order) {
    const latestOrder = await Order.findOne({
      _id: orderId,
      paymentAuthority: authority,
    });

    if (latestOrder?.paymentStatus === "PAID") {
      return {
        success: true,
        alreadyVerified: true,
        refId: latestOrder.paymentRefId,
        orderId: latestOrder._id.toString(),
      };
    }

    return {
      success: false,
      processing: latestOrder?.status === "PROCESSING",
      orderId,
    };
  }

  const amountInRial = order.total * 10;

  if (!Number.isSafeInteger(amountInRial)) {
    await Order.updateOne(
      { _id: order._id, status: "PROCESSING" },
      { $set: { status: "PENDING" } },
    );

    throw new Error("INVALID_ORDER_AMOUNT");
  }

  let result: ZarinpalResponse;

  try {
    result = await zarinpalRequest("verify", {
      amount: amountInRial,
      authority,
    });
  } catch (error) {
    // اگر ارتباط با درگاه قطع شد، امکان تلاش مجدد وجود داشته باشد.
    await Order.updateOne(
      {
        _id: order._id,
        paymentStatus: "PENDING",
        status: "PROCESSING",
      },
      {
        $set: {
          status: "PENDING",
        },
      },
    );

    throw error;
  }

  const code = result.data?.code;

  if (code !== 100 && code !== 101) {
    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
        },
      },
    );

    return {
      success: false,
      orderId: order._id.toString(),
    };
  }

  const deducted: Array<{
    productId: mongoose.Types.ObjectId;
    variantId: mongoose.Types.ObjectId;
    quantity: number;
  }> = [];

  try {
    for (const item of order.items) {
      if (!item.variantId) {
        throw new Error("VARIANT_NOT_FOUND");
      }

      const variantId = new mongoose.Types.ObjectId(
        item.variantId,
      );

      const updated = await Product.updateOne(
        {
          _id: item.product,
          isActive: true,
          variants: {
            $elemMatch: {
              _id: variantId,
              isActive: true,
              stock: { $gte: item.quantity },
            },
          },
        },
        {
          $inc: {
            "variants.$.stock": -item.quantity,
          },
        },
      );

      if (updated.modifiedCount !== 1) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      deducted.push({
        productId: item.product,
        variantId,
        quantity: item.quantity,
      });
    }
  } catch (error) {
    // بازگرداندن موجودی‌هایی که قبلاً کم شده‌اند.
    for (const item of deducted.reverse()) {
      await Product.updateOne(
        {
          _id: item.productId,
          "variants._id": item.variantId,
        },
        {
          $inc: {
            "variants.$.stock": item.quantity,
          },
        },
      );
    }

    // پرداخت موفق بوده ولی موجودی مشکل دارد.
    // سفارش در PROCESSING باقی می‌ماند تا دستی بررسی شود.
    throw error;
  }

  order.paymentStatus = "PAID";
  order.status = "PAID";
  order.paymentRefId = String(result.data?.ref_id ?? "");
  order.paidAt = new Date();

  await order.save();

  await Cart.updateOne(
    { user: order.user },
    { $set: { items: [] } },
  );

  return {
    success: true,
    alreadyVerified: false,
    refId: order.paymentRefId,
    orderId: order._id.toString(),
  };
}