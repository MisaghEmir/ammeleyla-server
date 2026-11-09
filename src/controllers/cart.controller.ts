import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.middleware";
import Cart from "../models/cart.model";
import Product from "../models/product.model";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/cart.service";

function getUserId(req: AuthRequest): string | null {
  const userId = req.user?.userId;

  return userId && mongoose.isValidObjectId(userId) ? userId : null;
}

async function cartResponse(userId: string) {
  const cart = await getCart(userId);
  const items = [];

  for (const item of cart.items) {
    const product = await Product.findOne({
      _id: item.product,
      isActive: true,
    }).select("name slug images variants");

    if (!product) continue;

    const variant = product.variants.find(
      (entry) => entry._id?.toString() === item.variant.toString(),
    );

    if (!variant) continue;

    items.push({
      _id: item._id?.toString() ?? "",
      product: {
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        images: product.images,
      },
      variant: {
        _id: variant._id?.toString(),
        color: variant.color,
        size: variant.size,
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stock: variant.stock,
        isActive: variant.isActive,
      },
      quantity: item.quantity,
      subtotal: variant.price * item.quantity,
    });
  }

  return {
    _id: cart._id.toString(),
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

function sendServiceError(res: Response, error: unknown) {
  const code = error instanceof Error ? error.message : "";

  const errors: Record<string, { status: number; message: string }> = {
    INVALID_USER_ID: { status: 400, message: "شناسه کاربر نامعتبر است" },
    INVALID_PRODUCT_OR_VARIANT_ID: {
      status: 400,
      message: "محصول یا واریانت نامعتبر است",
    },
    INVALID_ITEM_ID: { status: 400, message: "شناسه آیتم نامعتبر است" },
    INVALID_QUANTITY: { status: 400, message: "تعداد واردشده نامعتبر است" },
    PRODUCT_NOT_FOUND: {
      status: 404,
      message: "محصول پیدا نشد یا غیرفعال است",
    },
    VARIANT_NOT_FOUND: {
      status: 400,
      message: "رنگ یا سایز انتخاب‌شده معتبر نیست",
    },
    OUT_OF_STOCK: { status: 409, message: "این محصول موجود نیست" },
    INSUFFICIENT_STOCK: {
      status: 409,
      message: "موجودی برای این تعداد کافی نیست",
    },
    CART_NOT_FOUND: { status: 404, message: "سبد خرید پیدا نشد" },
    CART_ITEM_NOT_FOUND: { status: 404, message: "آیتم سبد خرید پیدا نشد" },
  };

  const knownError = errors[code];

  if (knownError) {
    return res.status(knownError.status).json({
      success: false,
      message: knownError.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "خطای داخلی سرور در سبد خرید",
  });
}

export async function getCartController(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "احراز هویت لازم است",
      });
    }

    return res.status(200).json({
      success: true,
      cart: await cartResponse(userId),
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

export async function addCartItemController(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "احراز هویت لازم است",
      });
    }

    const { productId, variantId, quantity = 1 } = req.body ?? {};

    if (
      typeof productId !== "string" ||
      typeof variantId !== "string" ||
      !Number.isInteger(quantity)
    ) {
      return res.status(400).json({
        success: false,
        message: "شناسه محصول، شناسه واریانت و تعداد معتبر لازم است",
      });
    }

    await addCartItem(userId, { productId, variantId, quantity });

    return res.status(200).json({
      success: true,
      message: "محصول به سبد خرید اضافه شد",
      cart: await cartResponse(userId),
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

export async function updateCartItemController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "احراز هویت لازم است",
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body ?? {};

    if (typeof itemId !== "string" || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: "شناسه آیتم و تعداد معتبر لازم است",
      });
    }

    await updateCartItem(userId, itemId, quantity);

    return res.status(200).json({
      success: true,
      message: "تعداد محصول به‌روزرسانی شد",
      cart: await cartResponse(userId),
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

export async function removeCartItemController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "احراز هویت لازم است",
      });
    }

    const { itemId } = req.params;

    if (typeof itemId !== "string") {
      return res.status(400).json({
        success: false,
        message: "شناسه آیتم نامعتبر است",
      });
    }

    await removeCartItem(userId, itemId);

    return res.status(200).json({
      success: true,
      message: "محصول از سبد خرید حذف شد",
      cart: await cartResponse(userId),
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

export async function clearCartController(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "احراز هویت لازم است",
      });
    }

    await clearCart(userId);

    return res.status(200).json({
      success: true,
      message: "سبد خرید خالی شد",
      cart: await cartResponse(userId),
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}
