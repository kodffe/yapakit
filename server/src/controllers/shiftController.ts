import { Request, Response, NextFunction } from 'express';
import Shift from '../models/Shift';

/**
 * Open a new shift for the current user.
 * POST /api/shifts/open
 */
export const openShift = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startingCash } = req.body;
    const restaurantId = req.currentContext.restaurantId;
    const cashierId = req.user._id;

    if (startingCash === undefined || startingCash === null) {
      res.status(400);
      throw new Error('Bad Request: startingCash is required');
    }

    // Prevent duplicate open shifts
    const existingOpen = await Shift.findOne({
      restaurantId,
      cashierId,
      status: 'open',
    });

    if (existingOpen) {
      res.status(409);
      throw new Error('Conflict: You already have an open shift. Close it before opening a new one.');
    }

    const shift = await Shift.create({
      restaurantId,
      cashierId,
      startingCash,
    });

    res.status(201).json({ success: true, data: shift });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the current open shift for the logged-in user.
 * GET /api/shifts/current
 */
export const getCurrentShift = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shift = await Shift.findOne({
      restaurantId: req.currentContext.restaurantId,
      cashierId: req.user._id,
      status: 'open',
    }).lean();

    res.json({ success: true, data: shift });
  } catch (error) {
    next(error);
  }
};

/**
 * Close the current active shift.
 * POST /api/shifts/close
 */
export const closeShift = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { actualCash } = req.body;
    const restaurantId = req.currentContext.restaurantId;
    const cashierId = req.user._id;

    if (actualCash === undefined || actualCash === null) {
      res.status(400);
      throw new Error('Bad Request: actualCash is required');
    }

    const shift = await Shift.findOne({
      restaurantId,
      cashierId,
      status: 'open',
    });

    if (!shift) {
      res.status(404);
      throw new Error('Not Found: No open shift found for this user.');
    }

    // In a real scenario, we'd query the Order model to calculate expectedCash
    // based on all orders completed by this user within shift.startTime and Date.now()
    // For this MVP, we'll import the Order model and sum totals.
    const { default: Order } = await import('../models/Order');

    const orders = await Order.find({
      restaurantId,
      'payment.cashierId': cashierId,
      'payment.status': 'paid',
      createdAt: { $gte: shift.startTime, $lte: new Date() },
    });

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

    shift.expectedCash = shift.startingCash + totalSales;
    shift.actualCash = actualCash;
    shift.endTime = new Date();
    shift.status = 'closed';

    await shift.save();

    res.json({ success: true, data: shift });
  } catch (error) {
    next(error);
  }
};
