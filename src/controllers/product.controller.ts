import { Request, Response } from "express";
import mongoose from "mongoose";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validators";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/product.service";

function getProductId(req: Request): string | null {
  const { id } = req.params;

  if (typeof id !== "string") {
    return null;
  }

  return id;
}

export async function createProductController(req: Request, res: Response) {
  try {
    const result = createProductSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0]?.message,
      });
    }

    const product = await createProduct(result.data);

    return res.status(201).json({
      success: true,
      message: "محصول با موفقیت ایجاد شد",
      product,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CATEGORY_NOT_FOUND") {
        return res.status(400).json({
          success: false,
          message: "دسته‌بندی پیدا نشد",
        });
      }

      if (error.message === "PRODUCT_SLUG_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "این slug قبلاً استفاده شده است",
        });
      }

      if (error.message === "DUPLICATE_SKU") {
        return res.status(400).json({
          success: false,
          message: "SKU های محصول نباید تکراری باشند",
        });
      }

      if (error.message === "SKU_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "یکی از SKU ها قبلاً استفاده شده است",
        });
      }
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در ایجاد محصول",
    });
  }
}

export async function getProductsController(_req: Request, res: Response) {
  try {
    const products = await getProducts();

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در دریافت محصولات",
    });
  }
}

export async function getProductController(req: Request, res: Response) {
  try {
    const productId = getProductId(req);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "شناسه یا اسلاگ محصول نامعتبر است",
      });
    }

    let product = null;

    // اگر پارامتر یک MongoDB ObjectId معتبر باشد،
    // ابتدا محصول را با شناسه دریافت می‌کنیم.
    if (mongoose.isValidObjectId(productId)) {
      product = await getProductById(productId);
    }

    // اگر با شناسه پیدا نشد یا پارامتر اسلاگ بود،
    // آن را با اسلاگ جست‌وجو می‌کنیم.
    if (!product) {
      const products = await getProducts();

      product = products.find((item) => item.slug === productId) ?? null;
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در دریافت محصول",
    });
  }
}

export async function updateProductController(req: Request, res: Response) {
  try {
    const productId = getProductId(req);

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const result = updateProductSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0]?.message,
      });
    }

    const product = await updateProduct(productId, result.data);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    return res.status(200).json({
      success: true,
      message: "محصول با موفقیت ویرایش شد",
      product,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CATEGORY_NOT_FOUND") {
        return res.status(400).json({
          success: false,
          message: "دسته‌بندی پیدا نشد",
        });
      }

      if (error.message === "PRODUCT_SLUG_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "این slug قبلاً استفاده شده است",
        });
      }

      if (error.message === "DUPLICATE_SKU") {
        return res.status(400).json({
          success: false,
          message: "SKU های محصول نباید تکراری باشند",
        });
      }

      if (error.message === "SKU_EXISTS") {
        return res.status(409).json({
          success: false,
          message: "یکی از SKU ها قبلاً استفاده شده است",
        });
      }
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در ویرایش محصول",
    });
  }
}

export async function deleteProductController(req: Request, res: Response) {
  try {
    const productId = getProductId(req);

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "شناسه محصول نامعتبر است",
      });
    }

    const product = await deleteProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    return res.status(200).json({
      success: true,
      message: "محصول غیرفعال شد",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در حذف محصول",
    });
  }
}
