import { Router } from "express";

import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import uploadRoutes from "./upload.routes";
import adminRoutes from "./admin.routes";
import cartRoutes from "./cart.routes";
import paymentRoutes from "./payment.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/uploads", uploadRoutes);
router.use("/admin", adminRoutes);
router.use("/cart", cartRoutes);
router.use("/payments", paymentRoutes);

export default router;