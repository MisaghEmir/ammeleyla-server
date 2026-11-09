import mongoose from "mongoose";
import Cart from "../models/cart.model";
import Product from "../models/product.model";

function validateId(id: string) {
  return mongoose.isValidObjectId(id);
}

export async function getCart(userId: string) {
  if (!validateId(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  return cart;
}

export async function addCartItem(
  userId: string,
  data: {
    productId: string;
    variantId: string;
    quantity: number;
  },
) {
  if (!validateId(data.productId) || !validateId(data.variantId)) {
    throw new Error("INVALID_PRODUCT_OR_VARIANT_ID");
  }

  if (
    !Number.isInteger(data.quantity) ||
    data.quantity < 1 ||
    data.quantity > 99
  ) {
    throw new Error("INVALID_QUANTITY");
  }

  const product = await Product.findOne({
    _id: data.productId,
    isActive: true,
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const variant = product.variants.find(
    (item) => item._id?.toString() === data.variantId,
  );

  if (!variant || !variant.isActive) {
    throw new Error("VARIANT_NOT_FOUND");
  }

  if (variant.stock < 1) {
    throw new Error("OUT_OF_STOCK");
  }

  const cart = await getCart(userId);

  const existingItem = cart.items.find(
    (item) =>
      item.product.toString() === data.productId &&
      item.variant.toString() === data.variantId,
  );

  const nextQuantity = (existingItem?.quantity ?? 0) + data.quantity;

  if (nextQuantity > variant.stock) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({
      product: new mongoose.Types.ObjectId(data.productId),
      variant: new mongoose.Types.ObjectId(data.variantId),
      quantity: data.quantity,
    });
  }

  await cart.save();

  return cart;
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  quantity: number,
) {
  if (!validateId(itemId)) {
    throw new Error("INVALID_ITEM_ID");
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("INVALID_QUANTITY");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new Error("CART_NOT_FOUND");
  }

  const item = cart.items.find((entry) => entry._id?.toString() === itemId);

  if (!item) {
    throw new Error("CART_ITEM_NOT_FOUND");
  }

  const product = await Product.findOne({
    _id: item.product,
    isActive: true,
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const variant = product.variants.find(
    (entry) => entry._id?.toString() === item.variant.toString(),
  );

  if (!variant || !variant.isActive) {
    throw new Error("VARIANT_NOT_FOUND");
  }

  if (quantity > variant.stock) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  item.quantity = quantity;
  await cart.save();

  return cart;
}

export async function removeCartItem(userId: string, itemId: string) {
  if (!validateId(itemId)) {
    throw new Error("INVALID_ITEM_ID");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new Error("CART_NOT_FOUND");
  }

  const itemExists = cart.items.some(
  (item) => item._id?.toString() === itemId,
);

  if (!itemExists) {
    throw new Error("CART_ITEM_NOT_FOUND");
  }

 cart.items = cart.items.filter(
  (item) => item._id?.toString() !== itemId,
);

  await cart.save();

  return cart;
}

export async function clearCart(userId: string) {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return Cart.create({
      user: userId,
      items: [],
    });
  }

  cart.items = [];
  await cart.save();

  return cart;
}
