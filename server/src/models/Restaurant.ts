import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing the Restaurant document in MongoDB.
 */
export interface IRestaurant extends Document {
  name: string;
  slug: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'suspended';
  timezone: string;
  address?: string;
  phone?: string;
  subscription: {
    plan: 'basic' | 'pro' | 'plus' | 'custom';
    status: 'trial' | 'active' | 'past_due' | 'expired';
    trialEndsAt: Date;
    expiresAt: Date;
    features: {
      reservations: boolean;
      advancedAnalytics: boolean;
      kds: boolean;
      splitPayments: boolean;
      staffManagement: boolean;
      prioritySupport: boolean;
      floorPlan: boolean;
    };
  };
  branding: {
    palette: 'spicy-red' | 'sunset-orange' | 'earthy-green' | 'warm-mustard' | 'coffee-brown' | 'custom';
    primaryColor: string;
    fontFamily: 'modern' | 'elegant' | 'casual';
    publicLayout: 'classic-tabs' | 'visual-grid' | 'minimal-list';
  };
  settings: {
    taxRate: number;
    currency: string;
    enabledOrderTypes: ('dine-in' | 'takeaway' | 'delivery')[];
    defaultDeliveryFee: number;
    defaultTakeawayFee: number;
    logoUrl: string;
    heroImageUrl: string;
    reservationDuration?: number;
    operatingHours?: {
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }[];
    paymentMethods: {
      name: string;
      isExactAmountOnly: boolean;
      isActive: boolean;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    subscription: {
      plan: {
        type: String,
        enum: ['basic', 'pro', 'plus', 'custom'],
        default: 'plus',
      },
      status: {
        type: String,
        enum: ['trial', 'active', 'past_due', 'expired'],
        default: 'trial',
      },
      trialEndsAt: { type: Date },
      expiresAt: { type: Date },
      features: {
        reservations: { type: Boolean, default: true },
        advancedAnalytics: { type: Boolean, default: true },
        kds: { type: Boolean, default: true },
        splitPayments: { type: Boolean, default: true },
        staffManagement: { type: Boolean, default: true },
        prioritySupport: { type: Boolean, default: true },
        floorPlan: { type: Boolean, default: true },
      },
    },
    branding: {
      palette: {
        type: String,
        enum: ['spicy-red', 'sunset-orange', 'earthy-green', 'warm-mustard', 'coffee-brown', 'custom'],
        default: 'custom',
      },
      primaryColor: {
        type: String,
        default: '#2563EB',
      },
      fontFamily: {
        type: String,
        enum: ['modern', 'elegant', 'casual'],
        default: 'modern',
      },
      publicLayout: {
        type: String,
        enum: ['classic-tabs', 'visual-grid', 'minimal-list'],
        default: 'classic-tabs',
      },
    },
    settings: {
      taxRate: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      enabledOrderTypes: {
        type: [String],
        enum: ['dine-in', 'takeaway', 'delivery'],
        default: ['dine-in', 'takeaway', 'delivery'],
      },
      defaultDeliveryFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      defaultTakeawayFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      logoUrl: {
        type: String,
        default: '',
      },
      heroImageUrl: {
        type: String,
        default: '',
      },
      reservationDuration: {
        type: Number,
        default: 90,
      },
      operatingHours: {
        type: [{
          dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
          openTime: { type: String, required: true },
          closeTime: { type: String, required: true },
          isClosed: { type: Boolean, default: false }
        }],
        default: [
          { dayOfWeek: 0, openTime: '09:00', closeTime: '22:00', isClosed: false },
          { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isClosed: false },
          { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isClosed: false },
          { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isClosed: false },
          { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isClosed: false },
          { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00', isClosed: false },
          { dayOfWeek: 6, openTime: '09:00', closeTime: '22:00', isClosed: false },
        ]
      },
      paymentMethods: {
        type: [{
          name: { type: String, required: true },
          isExactAmountOnly: { type: Boolean, default: false },
          isActive: { type: Boolean, default: true }
        }],
        default: [
          { name: 'Cash', isExactAmountOnly: false },
          { name: 'Card', isExactAmountOnly: true }
        ]
      }
    },
  },
  {
    timestamps: true,
  }
);

const Restaurant: Model<IRestaurant> = mongoose.model<IRestaurant>(
  'Restaurant',
  restaurantSchema
);

export default Restaurant;
