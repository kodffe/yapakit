import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Membership from '../models/Membership';
import { emailService } from '../services/emailService';

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Bad Request: Email and password are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      res.status(409);
      throw new Error('Conflict: A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        systemRole: user.systemRole,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
      },
      memberships: [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login an existing user.
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Bad Request: Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Unauthorized: Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      res.status(401);
      throw new Error('Unauthorized: Invalid credentials');
    }

    // Fetch all active memberships for this user
    const allMemberships = await Membership.find({
      userId: user._id,
      isActive: true,
    }).populate('restaurantId', 'name slug status isActive settings.logoUrl');

    // Filter out memberships where the restaurant has been soft-deleted
    const memberships = allMemberships.filter((m) => {
      const restaurant = m.restaurantId as unknown as { isActive?: boolean };
      return restaurant.isActive !== false;
    });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        systemRole: user.systemRole,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
      },
      memberships,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request a password reset OTP.
 * Generates a 6-digit code, saves to User, and sends via email.
 * POST /api/auth/forgot-password
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Bad Request: Email is required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Security best practice: Always return generic success even if user not found
    if (!user) {
      res.json({ success: true, message: 'If an account exists, an OTP has been sent.' });
      return;
    }

    // Role verification: Standard users must have a manager membership to reset their own password.
    // If they are simply 'waiter'/'cashier'/'kitchen' everywhere, they must ask their manager.
    if (user.systemRole === 'none') {
      const isManagerAnywhere = await Membership.exists({
        userId: user._id,
        tenantRole: 'manager',
        isActive: true,
      });

      if (!isManagerAnywhere) {
        res.status(403);
        throw new Error('Forbidden: Please contact your Manager to reset your PIN or Password.');
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    await emailService.sendPasswordResetOtp(user.email, otp);

    res.json({ success: true, message: 'If an account exists, an OTP has been sent.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using the 6-digit OTP.
 * POST /api/auth/reset-password
 */
export const resetPasswordWithOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Bad Request: Email, OTP, and new password are required');
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetOtp: otp,
      resetOtpExpiry: { $gt: new Date() }, // Ensure OTP is not expired
    });

    if (!user) {
      res.status(400);
      throw new Error('Bad Request: Invalid or expired reset code');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user and clear OTP fields
    user.passwordHash = passwordHash;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been successfully reset.' });
  } catch (error) {
    next(error);
  }
};
