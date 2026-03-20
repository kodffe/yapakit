import { Request, Response, NextFunction } from 'express';
import Reservation from '../models/Reservation';
import Restaurant from '../models/Restaurant';
import { emailService } from '../services/emailService';

/**
 * Get all reservations for the staff dashboard
 * GET /api/reservations
 */
export const getStaffReservations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reservations = await Reservation.find({ restaurantId: req.currentContext.restaurantId })
      .populate('customerId', 'name email phone')
      .populate('tableId', 'name capacity')
      .sort({ reservationDate: 1, reservationTime: 1 })
      .lean();

    res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update reservation status (Approve/Reject)
 * PUT /api/reservations/:id/status
 */
export const updateReservationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, tableId } = req.body;

    // Optional status transition check
    if (!['pending', 'approved', 'rejected', 'cancelled', 'completed'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    const reservation = await Reservation.findOne({
      _id: req.params.id,
      restaurantId: req.currentContext.restaurantId,
    }).populate('customerId', 'name email');

    if (!reservation) {
      res.status(404);
      throw new Error('Reservation not found');
    }

    reservation.status = status;
    if (tableId && status === 'approved') {
      reservation.tableId = tableId;
    }

    await reservation.save();

    // Fetch restaurant name for email
    const restaurant = await Restaurant.findById(req.currentContext.restaurantId).select('name');
    
    // Optionally trigger an email to the customer
    const customer = reservation.customerId as any;
    if (customer && customer.email && (status === 'approved' || status === 'rejected')) {
      await emailService.sendReservationStatusEmail(
        customer.email,
        customer.name || 'Guest',
        restaurant?.name || 'Restaurant',
        status,
        reservation.reservationDate,
        reservation.reservationTime
      );
    }

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};
