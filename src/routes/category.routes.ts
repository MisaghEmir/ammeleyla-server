import { Router } from "express";

import {
  createCategoryController,
  getCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller";

import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

// عمومی
router.get("/", getCategoriesController);

router.get("/:id", getCategoryController);

// فقط Admin
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createCategoryController
);

router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateCategoryController
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteCategoryController
);

export default router;