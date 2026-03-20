import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReservation extends Document {
  restaurantId: Types.ObjectId;
  customerId: Types.ObjectId;
  partySize: number;
  reservationDate: Date;
  reservationTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  tableId?: Types.ObjectId;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reservationSchema = new Schema<IReservation>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    reservationTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
    },
    specialRequests: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for filtering reservations by date/status
reservationSchema.index({ restaurantId: 1, reservationDate: 1, status: 1 });

const Reservation: Model<IReservation> = mongoose.model<IReservation>(
  'Reservation',
  reservationSchema
);

export default Reservation;
