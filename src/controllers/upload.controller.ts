
import { Request, Response } from "express";
import multer from "multer";
import { configureCloudinary } from "../config/cloudinary";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new Error("فرمت تصویر باید JPG، PNG، WEBP یا AVIF باشد"),
      );
    }

    callback(null, true);
  },
});

export async function uploadProductImage(
  req: Request,
  res: Response,
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "لطفاً یک تصویر انتخاب کنید",
      });
    }

    const cloudinary = configureCloudinary();

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ame-leila/products",
          resource_type: "image",
          transformation: [
            {
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        },
        (error, uploadResult) => {
          if (error) {
            return reject(error);
          }

          if (!uploadResult) {
            return reject(
              new Error("Cloudinary تصویر را ذخیره نکرد"),
            );
          }

          resolve({
            secure_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
        },
      );

      stream.end(req.file!.buffer);
    });

    return res.status(201).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);

    return res.status(500).json({
      success: false,
      message: "آپلود تصویر انجام نشد",
    });
  }
}
