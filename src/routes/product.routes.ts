import { Router } from "express";

import {
  createProductController,
  getProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller";

import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

// Public
router.get("/", getProductsController);
router.get("/:id", getProductController);

// Admin
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createProductController
);

router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateProductController
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteProductController
);

export default router;
