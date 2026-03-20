import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IShift extends Document {
  restaurantId: Types.ObjectId;
  cashierId: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  startingCash: number;
  expectedCash?: number;
  actualCash?: number;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: { type: Date },
    startingCash: {
      type: Number,
      required: true,
      min: 0,
    },
    expectedCash: { type: Number },
    actualCash: { type: Number },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

shiftSchema.index({ restaurantId: 1, cashierId: 1, status: 1 });

const Shift: Model<IShift> = mongoose.model<IShift>('Shift', shiftSchema);

export default Shift;
