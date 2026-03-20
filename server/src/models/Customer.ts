import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface representing a Customer document in MongoDB.
 * Used for invoicing and order association.
 */
export interface ICustomer extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    taxId: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Customer: Model<ICustomer> = mongoose.model<ICustomer>(
  'Customer',
  customerSchema
);

export default Customer;
