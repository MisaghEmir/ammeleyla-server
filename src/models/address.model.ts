import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId;

  title: string;
  recipientName: string;
  phone: string;

  province: string;
  city: string;
  address: string;

  postalCode: string;

  plaque?: string;
  unit?: string;
  description?: string;

  isDefault: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    recipientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    province: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    plaque: {
      type: String,
      trim: true,
    },

    unit: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Address: Model<IAddress> = mongoose.model<IAddress>(
  "Address",
  addressSchema,
);

export default Address;
