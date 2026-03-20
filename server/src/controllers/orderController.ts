import { Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import Order from '../models/Order';
import Restaurant from '../models/Restaurant';
import MenuItem from '../models/MenuItem';
import { generateNextOrderNumber } from '../services/orderNumber.service';

/**
 * Create a new order and emit a real-time event to the restaurant room.
 * POST /api/orders
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      orderNumber, 
      tableName, 
      tableId, 
      orderType,
      items, 
      subtotal, 
      deliveryFee,
      takeawayFee,
      taxAmount, 
      total, 
      currency,
      customer,
    } = req.body;

    if (!items || total === undefined) {
      res.status(400);
      throw new Error('Bad Request: items and total are required');
    }

    // Support either tableName or tableId from frontend for backwards/forwards compatibility
    const finalTableName = tableName || 'Takeaway';

    // Atomically generate the exact next sequential order number for this specific restaurant
    const finalOrderNumber = await generateNextOrderNumber(req.currentContext.restaurantId.toString());

    // Validate stock for items tracking inventory
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.menuItemId) {
          const menuItem = await MenuItem.findById(item.menuItemId);
          if (menuItem && menuItem.trackInventory) {
            if (menuItem.stockQuantity < item.quantity) {
              res.status(400);
              throw new Error(`Out of stock: ${menuItem.name} (Only ${menuItem.stockQuantity} left)`);
            }
            menuItem.stockQuantity -= item.quantity;
            await menuItem.save();
          }
        }
      }
    }

    const newOrder = await Order.create({
      restaurantId: req.currentContext.restaurantId,
      waiterId: req.user._id,
      orderNumber: finalOrderNumber,
      orderType: orderType || 'dine-in',
      tableName: finalTableName,
      tableId: tableId || undefined,
      items,
      subtotal: subtotal || total, // Fallback if subtotal is missing
      deliveryFee: deliveryFee || 0,
      takeawayFee: takeawayFee || 0,
      taxAmount: taxAmount || 0,
      total,
      currency: currency || 'USD',
      customer: customer || undefined,
    });

    // Emit real-time event to the restaurant's Socket.io room
    const io: Server = req.app.get('io');
    io.to(req.currentContext.restaurantId.toString()).emit('order:new', newOrder);

    res.status(201).json({
      success: true,
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update the status of an existing order and emit a real-time event.
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400);
      throw new Error('Bad Request: status is required');
    }

    const validStatuses = ['draft', 'sent', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error(`Bad Request: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Ensure tenant isolation: only update orders belonging to the current restaurant
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: id,
        restaurantId: req.currentContext.restaurantId,
      },
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      res.status(404);
      throw new Error('Not Found: Order not found in this restaurant');
    }

    // Emit real-time event to the restaurant's Socket.io room
    const io: Server = req.app.get('io');
    io.to(req.currentContext.restaurantId.toString()).emit('order:updated', updatedOrder);

    res.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active (non-completed, non-cancelled) orders for the current restaurant.
 * GET /api/orders
 */
export const getActiveOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find({
      restaurantId: req.currentContext.restaurantId,
      status: { $nin: ['completed', 'cancelled'] },
    })
      .populate('waiterId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get completed/ready orders for the current restaurant (last 24 hours).
 * GET /api/orders/completed
 */
export const getCompletedOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      restaurantId: req.currentContext.restaurantId,
      status: { $in: ['ready', 'completed'] },
      updatedAt: { $gte: twentyFourHoursAgo },
    })
      .populate('waiterId', 'firstName lastName')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing order (modify items, totals, etc.) and increment revision.
 * PUT /api/orders/:id
 */
export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      items,
      subtotal,
      taxAmount,
      total,
      deliveryFee,
      takeawayFee,
      customer,
      orderType,
      tableId,
      tableName,
    } = req.body;

    const order = await Order.findOne({
      _id: id,
      restaurantId: req.currentContext.restaurantId,
    });

    if (!order) {
      res.status(404);
      throw new Error('Not Found: Order not found');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
      res.status(400);
      throw new Error('Bad Request: Cannot modify a completed or cancelled order');
    }

    // Update fields
    if (items) order.items = items;
    if (subtotal !== undefined) order.subtotal = subtotal;
    if (taxAmount !== undefined) order.taxAmount = taxAmount;
    if (total !== undefined) order.total = total;
    if (deliveryFee !== undefined) order.deliveryFee = deliveryFee;
    if (takeawayFee !== undefined) order.takeawayFee = takeawayFee;
    if (customer !== undefined) order.customer = customer;
    if (orderType) order.orderType = orderType;
    if (tableId !== undefined) order.tableId = tableId || undefined;
    if (tableName !== undefined) order.tableName = tableName;

    // Increment revision
    order.revision += 1;

    // Reset status to 'sent' so kitchen sees it fresh
    order.status = 'sent';

    await order.save();

    // Populate waiterId for the emitted event
    await order.populate('waiterId', 'firstName lastName');

    // Emit real-time event to the restaurant's Socket.io room
    const io: Server = req.app.get('io');
    io.to(req.currentContext.restaurantId.toString()).emit('order:modified', order);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order with a reason.
 * PUT /api/orders/:id/cancel
 */
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const order = await Order.findOne({
      _id: id,
      restaurantId: req.currentContext.restaurantId,
    });

    if (!order) {
      res.status(404);
      throw new Error('Not Found: Order not found');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
      res.status(400);
      throw new Error('Bad Request: Order is already completed or cancelled');
    }

    order.status = 'cancelled';
    order.cancelReason = cancelReason || 'No reason provided';
    await order.save();

    // Emit real-time event
    const io: Server = req.app.get('io');
    io.to(req.currentContext.restaurantId.toString()).emit('order:cancelled', { orderId: order._id });

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a partial payment to an order. Auto-completes if balance reaches 0.
 * POST /api/orders/:id/payments
 */
export const addOrderPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, method, itemsPaid, customerData, manualDiscount } = req.body;

    if (!amount || !method) {
      res.status(400);
      throw new Error('Bad Request: amount and method are required');
    }

    if (typeof method !== 'string' || method.trim() === '') {
      res.status(400);
      throw new Error('Bad Request: Invalid payment method');
    }

    // Tenant isolation
    const order = await Order.findOne({
      _id: id,
      restaurantId: req.currentContext.restaurantId,
    });

    if (!order) {
      res.status(404);
      throw new Error('Not Found: Order not found');
    }

    if (['completed', 'cancelled'].includes(order.status)) {
      res.status(400);
      throw new Error('Bad Request: Cannot add payments to a completed or cancelled order');
    }

    // Apply manual discount and recalculate financials BEFORE taking payment
    if (manualDiscount !== undefined && manualDiscount >= 0) {
      order.manualDiscount = Number(manualDiscount);
      
      const restaurant = await Restaurant.findById(req.currentContext.restaurantId);
      if (restaurant) {
        const taxRate = restaurant.settings?.taxRate || 0;
        
        // Order subtotal remains the gross sum of items. Net is subtotal - manualDiscount
        const netSubtotal = Math.max(0, order.subtotal - order.manualDiscount);
        order.taxAmount = netSubtotal * (taxRate / 100);
        order.total = netSubtotal + order.taxAmount + (order.takeawayFee || 0) + (order.deliveryFee || 0);
      }
    }

    // Initialize array if undefined
    if (!order.payments) {
      order.payments = [];
    }

    // Process itemized splits if provided
    let processedItemsPaid: { cartItemId?: string; name: string; quantity: number; price: number }[] | undefined;
    
    if (itemsPaid && Array.isArray(itemsPaid) && itemsPaid.length > 0) {
      processedItemsPaid = [];
      for (const splitItem of itemsPaid) {
        // Find matching item in order
        const orderItem = order.items.find((i) => 
          i.cartItemId === splitItem.cartItemId || 
          (i.menuItemId === splitItem.menuItemId && i.name === splitItem.name)
        );

        if (orderItem) {
          // Increment paidQuantity, ensuring we don't exceed total quantity
          const remainingToPay = orderItem.quantity - (orderItem.paidQuantity || 0);
          const payQty = Math.min(Number(splitItem.quantity), remainingToPay);
          orderItem.paidQuantity = (orderItem.paidQuantity || 0) + payQty;

          // Add to the tracking array for the payment ledger
          processedItemsPaid.push({
            cartItemId: orderItem.cartItemId,
            name: orderItem.name,
            quantity: payQty,
            price: splitItem.price,
          });
        }
      }
    }

    // Add payment
    order.payments.push({
      amount: Number(amount),
      method,
      status: 'completed',
      date: new Date(),
      itemsPaid: processedItemsPaid,
      customerData: customerData || undefined,
    });

    // Calculate balance ignoring refunded payments
    const validPayments = order.payments.filter(p => p.status !== 'refunded');
    const totalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = order.total - totalPaid;

    // Auto-complete if fully paid (or overpaid) OR if all items are fully paid
    const allItemsPaid = order.items.every((i) => (i.paidQuantity || 0) >= i.quantity);
    if (balanceDue <= 0.01 || allItemsPaid) { // Floating point tolerance
      order.status = 'completed';
    }

    await order.save();
    
    // Repopulate waiter for UI
    await order.populate('waiterId', 'firstName lastName');

    // Emit real-time event
    const io: Server = req.app.get('io');
    io.to(req.currentContext.restaurantId.toString()).emit('order:updated', order);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific order by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const order = await Order.findOne({
      _id: id,
      restaurantId: req.currentContext.restaurantId,
    }).populate('waiterId', 'firstName lastName');

    if (!order) {
      res.status(404);
      throw new Error('Not Found: Order not found');
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payments history for the current restaurant.
 * GET /api/orders/payments/history
 */
export const getPaymentsHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, method } = req.query;
    
    // Build match criteria for the orders
    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = new Date(startDate as string);
    if (endDate) dateQuery.$lte = new Date(endDate as string);

    // If no dates provided, default to last 30 days
    if (!startDate && !endDate) {
      dateQuery.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Use aggregation to unwind payments and filter
    const pipeline: any[] = [
      { $match: { restaurantId: req.currentContext.restaurantId } },
      { $unwind: '$payments' },
      { $match: { 'payments.date': dateQuery } }
    ];

    if (method) {
      pipeline.push({ $match: { 'payments.method': method } });
    }

    // Sort by date descending
    pipeline.push({ $sort: { 'payments.date': -1 } });

    // Project needed fields
    pipeline.push({
      $project: {
        _id: 0,
        orderId: '$_id',
        orderNumber: 1,
        tableName: 1,
        orderType: 1,
        paymentId: '$payments._id',
        amount: '$payments.amount',
        method: '$payments.method',
        status: '$payments.status',
        date: '$payments.date',
        customerData: '$payments.customerData',
      }
    });

    const payments = await Order.aggregate(pipeline);

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Void an existing payment and recalculate order status.
 * PUT /api/orders/:id/payments/:paymentId/void
 */
export const voidPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, paymentId } = req.params;

    const order = await Order.findOne({
      _id: id,
      restaurantId: req.currentContext.restaurantId,
    });

    if (!order) {
      res.status(404);
      throw new Error('Not Found: Order not found');
    }

    const payment = order.payments?.find(p => p._id?.toString() === paymentId);

    if (!payment) {
      res.status(404);
      throw new Error('Not Found: Payment not found');
    }

    if (payment.status === 'refunded') {
      res.status(400);
      throw new Error('Bad Request: Payment is already refunded');
    }

    // Mark as refunded
    payment.status = 'refunded';

    // Restore paid quantities if any items were paid in this split
    if (payment.itemsPaid && payment.itemsPaid.length > 0) {
      for (const splitItem of payment.itemsPaid) {
        // Must accept generic any here to accommodate Mongoose subdocs
        const orderItem = order.items.find((i: any) => 
          i.cartItemId === splitItem.cartItemId || 
          (i.menuItemId === splitItem.menuItemId && i.name === splitItem.name)
        );
        if (orderItem) {
          orderItem.paidQuantity = Math.max(0, (orderItem.paidQuantity || 0) - splitItem.quantity);
        }
      }
    }

    // Recalculate balance
    const validPayments = order.payments?.filter(p => p.status !== 'refunded') || [];
    const totalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = order.total - totalPaid;

    // Transition status if balance is due and order was marked completed
    if (balanceDue > 0.01 && order.status === 'completed') {
      order.status = 'sent'; // Send it back to active flow
    }

    await order.save();
    await order.populate('waiterId', 'firstName lastName');

    // Emit socket event to refresh order in UI
    const io: Server = req.app.get('io');
    io.to(req.currentContext.restaurantId.toString()).emit('order:updated', order);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
