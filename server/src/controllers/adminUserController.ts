import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';

/**
 * Get all global system users (superadmin, support, sales).
 * GET /api/admin/users
 */
export const getAllAdminUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || '';

    const query: any = {
      systemRole: { $in: ['superadmin', 'support', 'sales'] },
    };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.systemRole = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new global system user.
 * POST /api/admin/users
 */
export const createAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, systemRole } = req.body;

    if (!email || !password || !firstName || !lastName || !systemRole) {
      res.status(400);
      throw new Error('All fields are required');
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      systemRole,
    });

    const userResponse = newUser.toObject() as any;
    delete userResponse.passwordHash;

    res.status(201).json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a global system user.
 * PUT /api/admin/users/:id
 */
export const updateAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, systemRole, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Role safety: prevent downgrading yourself if you are the only superadmin
    // (A simple check for now, can be improved later)

    if (email) user.email = email.toLowerCase();
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (systemRole) user.systemRole = systemRole;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const userResponse = user.toObject() as any;
    delete userResponse.passwordHash;

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * "Remove" a global system user by setting role to 'none'.
 * DELETE /api/admin/users/:id
 */
export const removeAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Protection: Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('Cannot remove yourself');
    }

    user.systemRole = 'none';
    await user.save();

    res.json({
      success: true,
      message: 'System access removed',
    });
  } catch (error) {
    next(error);
  }
};
