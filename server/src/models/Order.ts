import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * Interface for individual order items.
 */
export interface IOrderItem {
  cartItemId?: string;
  menuItemId: string;
  name: string;
  quantity: number;
  paidQuantity: number;
  basePrice: number;
  selectedModifiers: {
    modifierName: string;
    optionName: string;
    extraPrice: number;
  }[];
  notes?: string;
}

export interface IOrderCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  requestsInvoice: boolean;
}

/**
 * Interface representing the Order document in MongoDB.
 */
export interface IOrder extends Document {
  restaurantId: Types.ObjectId;
  waiterId: Types.ObjectId;
  orderNumber: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableName?: string;
  tableId?: Types.ObjectId;
  status: 'sent' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  items: IOrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  manualDiscount: number;
  deliveryFee?: number;
  takeawayFee?: number;
  taxAmount: number;
  total: number;
  currency: string;
  customer?: IOrderCustomer;
  payments?: {
    _id?: Types.ObjectId | string;
    amount: number;
    method: string;
    status: 'completed' | 'refunded';
    date: Date;
    itemsPaid?: {
      cartItemId?: string;
      menuItemId?: string;
      name: string;
      quantity: number;
      price: number;
    }[];
    customerData?: {
      name?: string;
      taxId?: string;
      address?: string;
      email?: string;
    };
  }[];
  revision: number;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    cartItemId: { type: String },
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    paidQuantity: { type: Number, default: 0, min: 0 },
    basePrice: { type: Number, required: true, min: 0 },
    selectedModifiers: [
      {
        modifierName: String,
        optionName: String,
        extraPrice: Number,
      },
    ],
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    waiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      default: 'dine-in',
    },
    tableName: {
      type: String,
      required: function (this: any) {
        return this.orderType === 'dine-in';
      },
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
      required: function (this: any) {
        return this.orderType === 'dine-in';
      },
    },
    status: {
      type: String,
      enum: ['sent', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
      default: 'sent',
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    subtotal: { type: Number, required: true },
    discountCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    manualDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    takeawayFee: { type: Number, default: 0 },
    taxAmount: { type: Number, required: true },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: { type: String, default: 'USD' },
    customer: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      taxId: { type: String, default: '' },
      requestsInvoice: { type: Boolean, default: false },
    },
    payments: {
      type: [
        {
          amount: { type: Number, required: true, min: 0 },
          method: { type: String, required: true },
          status: { type: String, enum: ['completed', 'refunded'], default: 'completed' },
          date: { type: Date, default: Date.now },
          itemsPaid: [
            {
              cartItemId: { type: String },
              menuItemId: { type: String },
              name: { type: String, required: true },
              quantity: { type: Number, required: true, min: 1 },
              price: { type: Number, required: true, min: 0 },
            },
          ],
          customerData: {
            name: { type: String },
            taxId: { type: String },
            address: { type: String },
            email: { type: String },
          },
        },
      ],
      default: [],
    },
    revision: { type: Number, default: 0 },
    cancelReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound index for high-performance KDS queries by restaurant and status.
 */
orderSchema.index({ restaurantId: 1, status: 1 });

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
