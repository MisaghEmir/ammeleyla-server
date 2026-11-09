import { Router } from "express";
import { getAdminDashboard } from "../controllers/admin.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboard);

export default router;
