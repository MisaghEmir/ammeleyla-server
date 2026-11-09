import mongoose from "mongoose";
import Product from "../models/product.model";
import Category from "../models/category.model";

export async function createProduct(data: {
  name: string;
  slug: string;
  description: string;
  category: string;
  images?: {
    url: string;
    alt?: string;
  }[];
  variants: {
    color: string;
    size: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    isActive?: boolean;
  }[];
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}) {
  const categoryExists = await Category.findOne({
    _id: data.category,
    isActive: true,
  });

  if (!categoryExists) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  const existingProduct = await Product.findOne({
    slug: data.slug,
  });

  if (existingProduct) {
    throw new Error("PRODUCT_SLUG_EXISTS");
  }

  const skus = data.variants.map((variant) => variant.sku.toUpperCase());

  const uniqueSkus = new Set(skus);

  if (uniqueSkus.size !== skus.length) {
    throw new Error("DUPLICATE_SKU");
  }

  const existingSku = await Product.findOne({
    "variants.sku": {
      $in: skus,
    },
  });

  if (existingSku) {
    throw new Error("SKU_EXISTS");
  }

  return Product.create({
    ...data,
    variants: data.variants.map((variant) => ({
      ...variant,
      sku: variant.sku.toUpperCase(),
    })),
  });
}

export async function getProducts() {
  return Product.find({
    isActive: true,
  })
    .populate("category", "name slug image")
    .sort({
      createdAt: -1,
    });
}

export async function getProductById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return Product.findOne({
    _id: id,
    isActive: true,
  }).populate("category", "name slug image");
}

export async function updateProduct(id: string, data: Record<string, any>) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const product = await Product.findById(id);

  if (!product) {
    return null;
  }

  if (data.category) {
    const categoryExists = await Category.findOne({
      _id: data.category,
      isActive: true,
    });

    if (!categoryExists) {
      throw new Error("CATEGORY_NOT_FOUND");
    }
  }

  if (data.slug) {
    const existingSlug = await Product.findOne({
      slug: data.slug,
      _id: {
        $ne: id,
      },
    });

    if (existingSlug) {
      throw new Error("PRODUCT_SLUG_EXISTS");
    }
  }

  if (data.variants) {
    const skus = data.variants.map((variant: { sku: string }) =>
      variant.sku.toUpperCase(),
    );

    const uniqueSkus = new Set(skus);

    if (uniqueSkus.size !== skus.length) {
      throw new Error("DUPLICATE_SKU");
    }

    const existingSku = await Product.findOne({
      _id: {
        $ne: id,
      },
      "variants.sku": {
        $in: skus,
      },
    });

    if (existingSku) {
      throw new Error("SKU_EXISTS");
    }

    data.variants = data.variants.map((variant: { sku: string }) => ({
      ...variant,
      sku: variant.sku.toUpperCase(),
    }));
  }

  Object.assign(product, data);

  await product.save();

  return Product.findById(product._id).populate("category", "name slug image");
}

export async function deleteProduct(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return Product.findByIdAndUpdate(
    id,
    {
      isActive: false,
    },
    {
      new: true,
    },
  );
}
