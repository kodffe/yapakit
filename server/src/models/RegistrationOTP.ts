import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing the RegistrationOTP document in MongoDB.
 * Used for storing temporary 6-digit codes during B2B onboarding.
 */
export interface IRegistrationOTP extends Document {
  email: string;
  otp: string;
  createdAt: Date;
}

const registrationOTPSchema = new Schema<IRegistrationOTP>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // TTL index: document will be automatically deleted after 900 seconds (15 minutes)
    },
  }
);

// We index email for faster lookups during verification
registrationOTPSchema.index({ email: 1 });

const RegistrationOTP: Model<IRegistrationOTP> = mongoose.model<IRegistrationOTP>(
  'RegistrationOTP',
  registrationOTPSchema
);

export default RegistrationOTP;
