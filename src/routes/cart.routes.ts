
  import { Router } from "express";
  import { authMiddleware } from "../middlewares/auth.middleware";
  import {
    addCartItemController,
    clearCartController,
    getCartController,
    removeCartItemController,
    updateCartItemController,
  } from "../controllers/cart.controller";

  const router = Router();

  router.use(authMiddleware);

  router.get("/", getCartController);
  router.post("/items", addCartItemController);
  router.patch("/items/:itemId", updateCartItemController);
  router.delete("/items/:itemId", removeCartItemController);
  router.delete("/", clearCartController);

  export default router;
