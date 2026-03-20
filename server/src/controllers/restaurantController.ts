import { Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';
import Membership from '../models/Membership';
import { seedNewRestaurant } from '../services/tenantSeeder.service';

/**
 * Create a new restaurant and auto-assign the creator as Manager.
 * Also seeds the restaurant with onboarding data.
 * POST /api/restaurants
 */
export const createRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      res.status(400);
      throw new Error('Bad Request: Name and slug are required');
    }

    const existingRestaurant = await Restaurant.findOne({
      slug: slug.toLowerCase(),
    });

    if (existingRestaurant) {
      res.status(409);
      throw new Error('Conflict: A restaurant with this slug already exists');
    }

    const restaurant = await Restaurant.create({ name, slug });

    // Auto-assign the creator as the restaurant manager
    await Membership.create({
      userId: req.user._id,
      restaurantId: restaurant._id,
      tenantRole: 'manager',
    });

    // Seed onboarding data for the new restaurant (Cold Start Prevention)
    await seedNewRestaurant(restaurant._id);

    res.status(201).json({
      success: true,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant settings (taxRate, currency).
 * GET /api/restaurants/:id/settings
 */
export const getRestaurantSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).select('name address phone settings branding subscription');
    
    if (!restaurant) {
      res.status(404);
      throw new Error('Not Found: Restaurant not found');
    }

    res.json({
      success: true,
      settings: restaurant.settings,
      name: restaurant.name,
      address: restaurant.address,
      phone: restaurant.phone,
      branding: restaurant.branding,
      subscription: restaurant.subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update restaurant settings and general info.
 * PUT /api/restaurants/settings
 */
export const updateRestaurantSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      name, address, phone, taxRate, currency, enabledOrderTypes, 
      defaultDeliveryFee, defaultTakeawayFee, logoUrl, heroImageUrl,
      reservationDuration, operatingHours, paymentMethods, branding
    } = req.body;

    // Validate inputs
    if (taxRate !== undefined && (typeof taxRate !== 'number' || taxRate < 0)) {
      res.status(400);
      throw new Error('Bad Request: Invalid tax rate');
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (address !== undefined) updateFields.address = address;
    if (phone !== undefined) updateFields.phone = phone;
    if (branding !== undefined) updateFields.branding = branding;
    
    // We only update the settings sub-document if provided
    if (
      taxRate !== undefined || currency !== undefined || enabledOrderTypes !== undefined || 
      defaultDeliveryFee !== undefined || defaultTakeawayFee !== undefined || 
      logoUrl !== undefined || heroImageUrl !== undefined ||
      reservationDuration !== undefined || operatingHours !== undefined || paymentMethods !== undefined
    ) {
      const currentRestaurant = await Restaurant.findById(req.currentContext.restaurantId);
      if (currentRestaurant) {
        updateFields.settings = { ...currentRestaurant.settings };
        if (taxRate !== undefined) updateFields.settings.taxRate = taxRate;
        if (currency !== undefined) updateFields.settings.currency = currency;
        if (enabledOrderTypes !== undefined) updateFields.settings.enabledOrderTypes = enabledOrderTypes;
        if (defaultDeliveryFee !== undefined) updateFields.settings.defaultDeliveryFee = defaultDeliveryFee;
        if (defaultTakeawayFee !== undefined) updateFields.settings.defaultTakeawayFee = defaultTakeawayFee;
        if (logoUrl !== undefined) updateFields.settings.logoUrl = logoUrl;
        if (heroImageUrl !== undefined) updateFields.settings.heroImageUrl = heroImageUrl;
        if (reservationDuration !== undefined) updateFields.settings.reservationDuration = reservationDuration;
        if (operatingHours !== undefined) updateFields.settings.operatingHours = operatingHours;
        if (paymentMethods !== undefined) updateFields.settings.paymentMethods = paymentMethods;
      }
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.currentContext.restaurantId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedRestaurant) {
      res.status(404);
      throw new Error('Not Found: Restaurant not found');
    }

    res.json({
      success: true,
      data: {
        name: updatedRestaurant.name,
        address: updatedRestaurant.address,
        phone: updatedRestaurant.phone,
        branding: updatedRestaurant.branding,
        settings: updatedRestaurant.settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a URL-safe slug from a name, appending a random suffix for uniqueness.
 */
const generateUniqueSlug = async (name: string): Promise<string> => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40);

  const suffix = Math.random().toString(36).substring(2, 6);
  const candidate = `${base}-${suffix}`;

  const existing = await Restaurant.findOne({ slug: candidate });
  if (existing) {
    // Extremely unlikely collision, retry once
    const retry = `${base}-${Math.random().toString(36).substring(2, 8)}`;
    return retry;
  }

  return candidate;
};

/**
 * Create a restaurant internally (no OTP, no onboarding wizard).
 * Used by already-authenticated managers from the Multi-Tenant Hub.
 * POST /api/restaurants/internal
 */
export const createInternalRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, type, phone, address } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Bad Request: Restaurant name is required');
    }

    const slug = await generateUniqueSlug(name);
    const trialDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const restaurant = await Restaurant.create({
      name: name.trim(),
      slug,
      address: address?.trim() || '',
      phone: phone?.trim() || '',
      subscription: {
        plan: 'plus',
        status: 'trial',
        trialEndsAt: trialDate,
        expiresAt: trialDate,
        features: {
          reservations: true,
          advancedAnalytics: true,
          kds: true,
          splitPayments: true,
          staffManagement: true,
          prioritySupport: true,
          floorPlan: true,
        }
      },
    });

    // Assign creator as manager
    const membership = await Membership.create({
      userId: req.user._id,
      restaurantId: restaurant._id,
      tenantRole: 'manager',
    });

    // Seed default data (categories, floor plan, etc.)
    await seedNewRestaurant(restaurant._id);

    // Populate the membership for the response (match login payload shape)
    const populatedMembership = await Membership.findById(membership._id)
      .populate('restaurantId', 'name slug status isActive settings.logoUrl');

    res.status(201).json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
      },
      membership: populatedMembership,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-delete (disable) a restaurant.
 * Sets isActive to false. The restaurant will be hidden from all users.
 * PUT /api/restaurants/:id/disable
 */
export const disableRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      res.status(404);
      throw new Error('Not Found: Restaurant not found');
    }

    restaurant.isActive = false;
    await restaurant.save();

    res.json({
      success: true,
      message: 'Restaurant has been disabled successfully.',
    });
  } catch (error) {
    next(error);
  }
};
