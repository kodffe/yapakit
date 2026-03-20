import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPromotion extends Document {
  restaurantId: Types.ObjectId;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const promotionSchema = new Schema<IPromotion>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validFrom: { type: Date },
    validUntil: { type: Date },
  },
  { timestamps: true }
);

promotionSchema.index({ restaurantId: 1, code: 1 }, { unique: true });

const Promotion: Model<IPromotion> = mongoose.model<IPromotion>('Promotion', promotionSchema);

export default Promotion;
