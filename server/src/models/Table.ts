import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface representing the Table document in MongoDB.
 */
export interface ITable extends Document {
  restaurantId: Types.ObjectId;
  zoneId: Types.ObjectId;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'out_of_service';
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    zoneId: {
      type: Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 2,
      min: 1,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'out_of_service'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index: prevents duplicate table names within a single restaurant.
 */
tableSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

const Table: Model<ITable> = mongoose.model<ITable>('Table', tableSchema);

export default Table;
