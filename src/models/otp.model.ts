import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOtpCode extends Document {
  phone: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const otpSchema = new Schema<IOtpCode>(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },

    codeHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

// بعد از منقضی شدن OTP، MongoDB خودش آن را حذف می‌کند
otpSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

const OtpCode: Model<IOtpCode> = mongoose.model<IOtpCode>(
  "OtpCode",
  otpSchema
);

export default OtpCode;