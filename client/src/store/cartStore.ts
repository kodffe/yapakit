import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface SelectedModifier {
  modifierName: string;
  optionName: string;
  extraPrice: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  notes?: string;
}

export interface CartCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  requestsInvoice: boolean;
}

interface CartTotals {
  grossSubtotal: number;
  discountAmount: number;
  netSubtotal: number;
  taxAmount: number;
  total: number;
}

interface CartState {
  selectedTableId: string | null;
  selectedTableName: string | null;
  orderType: OrderType;
  orderItems: CartItem[];
  taxRate: number;
  currency: string;
  discountCode: string | null;
  discountType: 'percentage' | 'fixed_amount' | null;
  discountValue: number | null;
  manualDiscount: number;
  deliveryFee: number;
  takeawayFee: number;
  customer: CartCustomer | null;
  editingOrderId: string | null;
  setTable: (tableId: string | null, tableName?: string | null) => void;
  setOrderType: (type: OrderType) => void;
  setRestaurantSettings: (taxRate: number, currency: string) => void;
  setTaxRate: (rate: number) => void;
  setCurrency: (currency: string) => void;
  setManualDiscount: (amount: number) => void;
  setDeliveryFee: (fee: number) => void;
  setTakeawayFee: (fee: number) => void;
  setCustomer: (customer: CartCustomer) => void;
  clearCustomer: () => void;
  addItem: (item: Omit<CartItem, 'cartItemId'>) => void;
  updateItemQuantity: (cartItemId: string, delta: number) => void;
  updateItemNotes: (cartItemId: string, notes: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  loadOrder: (order: {
    _id: string;
    orderType: OrderType;
    tableName?: string;
    tableId?: string;
    items: { menuItemId: string; name: string; basePrice: number; quantity: number; selectedModifiers: SelectedModifier[]; notes?: string }[];
    customer?: CartCustomer;
    manualDiscount?: number;
    deliveryFee: number;
    takeawayFee: number;
  }) => void;
  applyDiscount: (code: string, type: 'percentage' | 'fixed_amount', value: number) => void;
  removeDiscount: () => void;
  getTotals: () => CartTotals;
}

const useCartStore = create<CartState>((set, get) => ({
  selectedTableId: null,
  selectedTableName: null,
  orderType: 'dine-in',
  orderItems: [],
  taxRate: 10,
  currency: 'USD',
  discountCode: null,
  discountType: null,
  discountValue: null,
  manualDiscount: 0,
  deliveryFee: 0,
  takeawayFee: 0,
  customer: null,
  editingOrderId: null,

  setTable: (tableId, tableName) => set({ selectedTableId: tableId, selectedTableName: tableName ?? null }),

  setOrderType: (type) => {
    if (type !== 'dine-in') {
      set({ orderType: type, selectedTableId: null, selectedTableName: null });
    } else {
      set({ orderType: type });
    }
  },

  setRestaurantSettings: (taxRate, currency) => set({ taxRate, currency }),

  setTaxRate: (taxRate) => set({ taxRate }),
  setCurrency: (currency) => set({ currency }),
  setManualDiscount: (manualDiscount) => set({ manualDiscount }),
  setDeliveryFee: (deliveryFee) => set({ deliveryFee }),
  setTakeawayFee: (takeawayFee) => set({ takeawayFee }),
  setCustomer: (customer) => set({ customer }),
  clearCustomer: () => set({ customer: null }),

  addItem: (item) => {
    set((state) => {
      const existingItemIndex = state.orderItems.findIndex(
        (i) =>
          i.menuItemId === item.menuItemId &&
          JSON.stringify(i.selectedModifiers) === JSON.stringify(item.selectedModifiers) &&
          i.notes === item.notes
      );

      if (existingItemIndex > -1) {
        const newItems = [...state.orderItems];
        newItems[existingItemIndex].quantity += item.quantity;
        return { orderItems: newItems };
      }

      return {
        orderItems: [...state.orderItems, { ...item, cartItemId: uuidv4() }],
      };
    });
  },

  updateItemQuantity: (cartItemId, delta) => {
    set((state) => {
      const newItems = state.orderItems
        .map((item) => {
          if (item.cartItemId !== cartItemId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[];
      return { orderItems: newItems };
    });
  },

  updateItemNotes: (cartItemId, notes) => {
    set((state) => ({
      orderItems: state.orderItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, notes: notes || undefined } : item
      ),
    }));
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      orderItems: state.orderItems.filter((i) => i.cartItemId !== cartItemId),
    }));
  },

  clearCart: () =>
    set({
      orderItems: [],
      orderType: 'dine-in',
      discountCode: null,
      discountType: null,
      discountValue: null,
      manualDiscount: 0,
      deliveryFee: 0,
      takeawayFee: 0,
      customer: null,
      editingOrderId: null,
    }),

  loadOrder: (order) => {
    const items: CartItem[] = order.items.map((item) => ({
      cartItemId: uuidv4(),
      menuItemId: item.menuItemId,
      name: item.name,
      basePrice: item.basePrice,
      quantity: item.quantity,
      selectedModifiers: item.selectedModifiers || [],
      notes: item.notes,
    }));

    set({
      editingOrderId: order._id,
      orderType: order.orderType,
      selectedTableId: order.tableId || null,
      selectedTableName: order.tableName || null,
      orderItems: items,
      customer: order.customer || null,
      manualDiscount: order.manualDiscount || 0,
      deliveryFee: order.deliveryFee || 0,
      takeawayFee: order.takeawayFee || 0,
      discountCode: null,
      discountType: null,
      discountValue: null,
    });
  },

  applyDiscount: (code, type, value) =>
    set({
      discountCode: code,
      discountType: type,
      discountValue: value,
    }),

  removeDiscount: () =>
    set({
      discountCode: null,
      discountType: null,
      discountValue: null,
    }),

  getTotals: () => {
    const { orderItems, taxRate, discountType, discountValue, manualDiscount, orderType, deliveryFee, takeawayFee } = get();

    const grossSubtotal = orderItems.reduce((acc, item) => {
      const modifiersTotal = item.selectedModifiers.reduce(
        (sum, mod) => sum + mod.extraPrice,
        0
      );
      return acc + (item.basePrice + modifiersTotal) * item.quantity;
    }, 0);

    let discountAmount = 0;
    if (discountType && discountValue) {
      if (discountType === 'percentage') {
        discountAmount = grossSubtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
      discountAmount = Math.min(discountAmount, grossSubtotal);
    }

    const netSubtotal = Math.max(0, grossSubtotal - discountAmount - manualDiscount);
    const taxAmount = netSubtotal * (taxRate / 100);
    const actualDeliveryFee = orderType === 'delivery' ? deliveryFee : 0;
    const actualTakeawayFee = orderType === 'takeaway' ? takeawayFee : 0;
    const total = netSubtotal + taxAmount + actualDeliveryFee + actualTakeawayFee;

    return { grossSubtotal, discountAmount, netSubtotal, taxAmount, total };
  },
}));

export default useCartStore;
