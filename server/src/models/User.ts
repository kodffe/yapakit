import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing the User document in MongoDB.
 */
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  systemRole: 'superadmin' | 'support' | 'sales' | 'none';
  isActive: boolean;
  resetOtp?: string;
  resetOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    systemRole: {
      type: String,
      enum: ['superadmin', 'support', 'sales', 'none'],
      default: 'none',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetOtp: {
      type: String,
    },
    resetOtpExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
