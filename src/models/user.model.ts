
import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole = "USER" | "ADMIN";

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  password?: string;

  addresses: mongoose.Types.ObjectId[];

  role: UserRole;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },

    password: {
      type: String,
      select: false,
    },

    addresses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Address",
      },
    ],

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);

export default User;
