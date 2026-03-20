import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Membership from '../models/Membership';

/**
 * Get all staff members for the current restaurant.
 * GET /api/staff
 */
export const getStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memberships = await Membership.find({
      restaurantId: req.currentContext.restaurantId,
      isActive: true,
    })
      .populate('userId', 'firstName lastName email isActive')
      .sort({ createdAt: -1 })
      .lean();

    // Shape response so frontend gets a clean array
    const staff = memberships.map((m) => ({
      _id: m._id,
      membershipId: m._id,
      user: m.userId,
      tenantRole: m.tenantRole,
      isActive: m.isActive,
      joinedAt: m.createdAt,
    }));

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new staff member to the current restaurant.
 * Creates the User if it doesn't exist, then creates the Membership.
 * POST /api/staff
 */
export const addStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, firstName, lastName, pin, password, tenantRole } = req.body;
    const staffSecret = pin || password;

    if (!email || !firstName || !lastName || !staffSecret || !tenantRole) {
      res.status(400);
      throw new Error('Bad Request: email, firstName, lastName, (pin or password), and tenantRole are required');
    }

    const validRoles = ['manager', 'cashier', 'waiter', 'kitchen'];
    if (!validRoles.includes(tenantRole)) {
      res.status(400);
      throw new Error(`Bad Request: tenantRole must be one of: ${validRoles.join(', ')}`);
    }

    // Step 1: Find or create User
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(staffSecret, salt);

      user = await User.create({
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        passwordHash,
        systemRole: 'none',
      });
    }

    // Step 2: Check for existing membership at this restaurant
    const existingMembership = await Membership.findOne({
      userId: user._id,
      restaurantId: req.currentContext.restaurantId,
    });

    if (existingMembership) {
      res.status(409);
      throw new Error('Conflict: This user already has a membership at this restaurant');
    }

    // Step 3: Create new Membership
    const membership = await Membership.create({
      userId: user._id,
      restaurantId: req.currentContext.restaurantId,
      tenantRole,
    });

    res.status(201).json({
      success: true,
      data: {
        membershipId: membership._id,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        tenantRole: membership.tenantRole,
      },
    });
  } catch (error) {
    next(error);
  }
};
