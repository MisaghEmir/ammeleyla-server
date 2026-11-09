import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductImage {
  url: string;
  alt?: string;
}

export interface IProductVariant {
  _id?: mongoose.Types.ObjectId;

  color: string;
  size: string;

  sku: string;

  price: number;

  compareAtPrice?: number;

  stock: number;

  isActive: boolean;
}

export interface IProduct extends Document {
  name: string;

  slug: string;

  description: string;

  category: mongoose.Types.ObjectId;

  images: IProductImage[];

  variants: IProductVariant[];

  tags: string[];

  isActive: boolean;

  isFeatured: boolean;

  createdAt: Date;

  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const productVariantSchema = new Schema<IProductVariant>(
  {
    color: {
      type: String,
      required: true,
      trim: true,
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  },
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    images: {
      type: [productImageSchema],
      default: [],
    },

    variants: {
      type: [productVariantSchema],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index(
  {
    "variants.sku": 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema,
);

export default Product;
