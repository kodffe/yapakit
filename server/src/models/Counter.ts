import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICounter extends Document {
  restaurantId: Types.ObjectId;
  entityName: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    entityName: {
      type: String,
      required: true,
      default: 'Order',
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to ensure each restaurant has its own sequence per entity
counterSchema.index({ restaurantId: 1, entityName: 1 }, { unique: true });

const Counter: Model<ICounter> = mongoose.model<ICounter>('Counter', counterSchema);

export default Counter;
