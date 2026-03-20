import { Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';

/**
 * Get all tenants including subscription data.
 * GET /api/admin/tenants
 */
export const getAllTenants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenants = await Restaurant.find()
      .select('name slug isActive status subscription createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: tenants.length,
      data: tenants,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tenant subscription.
 * PUT /api/admin/tenants/:id/subscription
 */
export const updateTenantSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { plan, status, expiresAt, features } = req.body;

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      res.status(404);
      throw new Error('Tenant not found');
    }

    if (plan) restaurant.subscription.plan = plan;
    if (status) restaurant.subscription.status = status;
    if (expiresAt) restaurant.subscription.expiresAt = new Date(expiresAt);
    if (features) {
      restaurant.subscription.features = {
        ...restaurant.subscription.features,
        ...features,
      };
    }

    await restaurant.save();

    res.json({
      success: true,
      data: restaurant,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
