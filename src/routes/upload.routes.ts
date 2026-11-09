
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";

import {
  uploadMiddleware,
  uploadProductImage,
} from "../controllers/upload.controller";

import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware.single("file")(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "حداکثر حجم تصویر ۵ مگابایت است",
          });
        }

        return res.status(400).json({
          success: false,
          message: "فایل آپلودشده معتبر نیست",
        });
      }

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "فرمت تصویر نامعتبر است",
        });
      }

      next();
    });
  },
  uploadProductImage,
);

export default router;
