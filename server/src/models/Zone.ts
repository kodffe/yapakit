import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface representing the Zone document in MongoDB.
 */
export interface IZone extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const zoneSchema = new Schema<IZone>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index: prevents duplicate zone names within a single restaurant.
 */
zoneSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

const Zone: Model<IZone> = mongoose.model<IZone>('Zone', zoneSchema);

export default Zone;
