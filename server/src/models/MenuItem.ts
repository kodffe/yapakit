import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface representing the MenuItem document in MongoDB.
 */
export interface IModifierOption {
  name: string;
  price?: number;
  isDefault?: boolean;
}

export interface IModifier {
  name: string;
  widgetType: 'radio' | 'checkbox' | 'select' | 'number';
  minChoices?: number;
  maxChoices?: number;
  options: IModifierOption[];
}

export interface IMenuItem extends Document {
  restaurantId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  region: 'featured' | 'available' | 'unavailable';
  isAvailable: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  displayOrder: number;
  modifiers: IModifier[];
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    region: {
      type: String,
      enum: ['featured', 'available', 'unavailable'],
      default: 'available',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    trackInventory: {
      type: Boolean,
      default: false,
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    modifiers: [
      {
        name: { type: String, required: true },
        widgetType: { 
          type: String, 
          enum: ['radio', 'checkbox', 'select', 'number'], 
          required: true 
        },
        minChoices: { type: Number, default: 0 },
        maxChoices: { type: Number, default: 1 },
        options: [
          {
            name: { type: String, required: true },
            price: { type: Number, default: 0 },
            isDefault: { type: Boolean, default: false },
          }
        ]
      }
    ]
  },
  {
    timestamps: true,
  }
);

/**
 * Compound query index: optimizes filtered menu queries for POS and guest-facing menus.
 */
menuItemSchema.index({ restaurantId: 1, categoryId: 1, region: 1 });

const MenuItem: Model<IMenuItem> = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);

export default MenuItem;
