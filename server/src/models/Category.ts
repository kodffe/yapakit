import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface representing the Category document in MongoDB.
 */
export interface ICategory extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  color: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
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
    color: {
      type: String,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound index: optimizes ordered category listing queries per restaurant.
 */
categorySchema.index({ restaurantId: 1, displayOrder: 1 });

const Category: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
