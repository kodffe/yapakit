import { Request, Response, NextFunction } from 'express';
import Ticket from '../models/Ticket';
import Restaurant from '../models/Restaurant';
import User from '../models/User';

/**
 * Handle Ticket creation by Restaurant Managers.
 * POST /api/tenant/tickets
 */
export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subject, description, priority } = req.body;
    const { restaurantId } = req.currentContext!;
    const userId = req.user._id;

    const ticket = await Ticket.create({
      restaurantId,
      reportedBy: userId,
      subject,
      description,
      priority,
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tickets for Admin/Support.
 * GET /api/admin/tickets
 */
export const getAllTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tickets = await Ticket.find()
      .populate('restaurantId', 'name slug')
      .populate('reportedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tickets for a specific tenant (Manager view).
 * GET /api/tickets
 */
export const getTenantTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId } = req.currentContext!;

    const tickets = await Ticket.find({ restaurantId })
      .populate('reportedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket status.
 * PUT /api/admin/tickets/:id/status
 */
export const updateTicketStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      res.status(404);
      throw new Error('Ticket not found');
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};
