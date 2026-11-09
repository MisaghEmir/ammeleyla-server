import { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("❌ Server Error:", error);

  if (res.headersSent) {
    return;
  }

  return res.status(500).json({
    success: false,
    message: "خطای داخلی سرور",
  });
}