import { Request, Response, NextFunction } from "express";
import Product from "../models/product.model";
import Category from "../models/category.model";
import User from "../models/user.model";

export async function getAdminDashboard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const [productsCount, categoriesCount, usersCount, recentProducts] =
      await Promise.all([
        Product.countDocuments(),
        Category.countDocuments(),
        User.countDocuments(),
        Product.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select("name slug price images isActive createdAt")
          .lean(),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          products: productsCount,
          categories: categoriesCount,
          users: usersCount,
        },
        recentProducts,
      },
    });
  } catch (error) {
    next(error);
  }
}
