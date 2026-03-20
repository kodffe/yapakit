import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface representing the Membership document in MongoDB.
 * Connects a User to a specific Restaurant with a Role.
 */
export interface IMembership extends Document {
  userId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  tenantRole: 'manager' | 'cashier' | 'waiter' | 'kitchen';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    tenantRole: {
      type: String,
      enum: ['manager', 'cashier', 'waiter', 'kitchen'],
      required: true,
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
 * Compound Unique Index: A user can only have one specific role/membership per restaurant.
 */
membershipSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });

/**
 * Index on restaurantId for fast staff queries.
 */
membershipSchema.index({ restaurantId: 1 });

const Membership: Model<IMembership> = mongoose.model<IMembership>(
  'Membership',
  membershipSchema
);

export default Membership;
