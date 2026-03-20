import { Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';
import Membership from '../models/Membership';
import User from '../models/User';
import Ticket from '../models/Ticket';

/**
 * Get all restaurants for Global Admins with pagination and filtering.
 * GET /api/admin/restaurants
 */
export const getAllRestaurants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.subscriptionStatus = status;
    }

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich with managers
    const enrichedRestaurants = await Promise.all(
      restaurants.map(async (restaurant) => {
        const managers = await Membership.find({
          restaurantId: restaurant._id,
          tenantRole: 'manager',
          isActive: true
        })
        .populate('userId', 'firstName lastName email')
        .lean();

        return {
          ...restaurant,
          managers: managers.map((m: any) => m.userId)
        };
      })
    );

    res.json({
      success: true,
      count: restaurants.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      restaurants: enrichedRestaurants,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all restaurant managers and their assigned restaurants.
 * GET /api/admin/managers
 */
export const getAllManagers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    // Strategy: Find all manager memberships
    // We want unique managers, so we group by userId
    const managerMemberships = await Membership.find({ tenantRole: 'manager' })
      .populate('userId', 'firstName lastName email isActive')
      .populate('restaurantId', 'name slug logoUrl')
      .lean();

    // Grouping manually since Mongoose aggregation + population of refs cross-DB/collection can be tricky
    // and the scale of managers is likely manageable for in-memory grouping initially
    const managerMap = new Map();
    
    managerMemberships.forEach((m: any) => {
      if (!m.userId) return;
      const userId = m.userId._id.toString();
      
      if (!managerMap.has(userId)) {
        managerMap.set(userId, {
          ...m.userId,
          restaurants: []
        });
      }
      
      if (m.restaurantId) {
        managerMap.get(userId).restaurants.push(m.restaurantId);
      }
    });

    let managersList = Array.from(managerMap.values());

    // Apply search filter if present
    if (search) {
      const searchLower = search.toLowerCase();
      managersList = managersList.filter(m => 
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower)
      );
    }

    const total = managersList.length;
    const paginatedManagers = managersList.slice(skip, skip + limit);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: paginatedManagers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get high-level SaaS stats for the Global Dashboard.
 * GET /api/admin/stats
 */
export const getGlobalStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const activeSubscriptions = await Restaurant.countDocuments({ 'subscription.status': 'active' });
    const trialSubscriptions = await Restaurant.countDocuments({ 'subscription.status': 'trial' });
    const pastDueSubscriptions = await Restaurant.countDocuments({ 'subscription.status': 'past_due' });
    
    // Support Ticket Stats
    const openTickets = await Ticket.countDocuments({ status: 'open' });
    const inProgressTickets = await Ticket.countDocuments({ status: 'in_progress' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });

    // Get the 5 most recently added restaurants
    const recentRestaurants = await Restaurant.find({}, 'name slug subscription createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get restaurants with membership expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoonRestaurants = await Restaurant.find({
      'subscription.expiresAt': { $lte: thirtyDaysFromNow, $gt: new Date() },
      'subscription.status': { $in: ['active', 'trial'] }
    }, 'name slug subscription createdAt')
      .sort({ 'subscription.expiresAt': 1 })
      .limit(5)
      .lean();

    // Get the 5 most recently created tickets
    const recentTickets = await Ticket.find()
      .populate('restaurantId', 'name slug')
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      stats: {
        totalRestaurants,
        activeSubscriptions,
        trialSubscriptions,
        pastDueSubscriptions,
        openTickets,
        inProgressTickets,
        resolvedTickets,
      },
      recentRestaurants,
      expiringSoonRestaurants,
      recentTickets,
    });
  } catch (error) {
    next(error);
  }
};
