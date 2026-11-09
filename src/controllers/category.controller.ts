import { Request, Response } from "express";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validators";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../services/category.service";

export async function createCategoryController(req: Request, res: Response) {
  try {
    const result = createCategorySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0]?.message,
      });
    }

    const category = await createCategory(result.data);

    return res.status(201).json({
      success: true,
      message: "دسته‌بندی با موفقیت ایجاد شد",
      category,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_SLUG_EXISTS") {
      return res.status(409).json({
        success: false,
        message: "این slug قبلاً استفاده شده است",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در ایجاد دسته‌بندی",
    });
  }
}

export async function getCategoriesController(req: Request, res: Response) {
  try {
    const categories = await getCategories();

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در دریافت دسته‌بندی‌ها",
    });
  }
}

export async function getCategoryController(req: Request, res: Response) {
  try {
    const category = await getCategoryById(req.params.id as string);

    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در دریافت دسته‌بندی",
    });
  }
}

export async function updateCategoryController(req: Request, res: Response) {
  try {
    const result = updateCategorySchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.issues[0]?.message,
      });
    }

    const category = await updateCategory(req.params.id as string, result.data);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }

    return res.status(200).json({
      success: true,
      message: "دسته‌بندی ویرایش شد",
      category,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_SLUG_EXISTS") {
      return res.status(409).json({
        success: false,
        message: "این slug قبلاً استفاده شده است",
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در ویرایش دسته‌بندی",
    });
  }
}

export async function deleteCategoryController(req: Request, res: Response) {
  try {
    const category = await deleteCategory(req.params.id as string);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }

    return res.status(200).json({
      success: true,
      message: "دسته‌بندی غیرفعال شد",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "خطا در حذف دسته‌بندی",
    });
  }
}
