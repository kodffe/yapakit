import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Restaurant from '../models/Restaurant';
import Membership from '../models/Membership';
import RegistrationOTP from '../models/RegistrationOTP';
import { emailService } from '../services/emailService';
import { seedNewTenant } from '../services/tenantSeeder';

const SALT_ROUNDS = 10;
const REGISTRATION_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Step 1: Initialize Registration
 * Validates uniqueness and sends OTP
 * POST /api/onboarding/init
 */
export const initRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // If user exists, they are already "Finished" in our current all-or-nothing onboarding
      res.json({ 
        success: true, 
        alreadyRegistered: true, 
        message: 'Email already registered. Redirecting to login...' 
      });
      return;
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Upsert OTP (replaces any previous unverified OTP for this email)
    await RegistrationOTP.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // 4. Send Email
    await emailService.sendRegistrationOtp(normalizedEmail, otp);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Verify OTP
 * Confirms OTP and issues a 1h registrationToken JWT
 * POST /api/onboarding/verify
 */
export const verifyRegistrationOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Email and OTP are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // The TTL index guarantees this document drops out of the DB after 15mins autonomously
    const record = await RegistrationOTP.findOne({ email: normalizedEmail, otp });

    if (!record) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    // OTP Valid. Wipe it.
    await RegistrationOTP.deleteOne({ _id: record._id });

    // Issue a short-lived token meant ONLY for the final /complete payload step
    const registrationToken = jwt.sign({ email: normalizedEmail }, REGISTRATION_SECRET, {
      expiresIn: '1h',
    });

    res.json({ success: true, registrationToken });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 3: Complete Onboarding
 * Bootstraps the SaaS Tenant architecture.
 * POST /api/onboarding/complete
 */
export const completeRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      registrationToken,
      userPassword,
      userName,
      restaurantName,
      restaurantType,
      phone,
      address,
      logoUrl,
      heroImageUrl
    } = req.body;

    if (!registrationToken || !userPassword || !userName || !restaurantName) {
      res.status(400);
      throw new Error('Required fields are missing.');
    }

    // 1. Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(registrationToken, REGISTRATION_SECRET);
    } catch (err) {
      res.status(401);
      throw new Error('Invalid or expired registration session. Please start over.');
    }

    const email = decoded.email;

    // Double check email uniqueness just in case
    const existUser = await User.findOne({ email });
    if (existUser) {
      res.status(409);
      throw new Error('User already exists');
    }

    // 2. Format names
    const names = userName.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || '';

    // 3. Generate unique restaurant slug
    let baseSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Restaurant.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const trialDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // 4. Create Restaurant
    const restaurant = await Restaurant.create({
      name: restaurantName,
      slug,
      address: address || '',
      phone: phone || '',
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
      settings: {
        logoUrl: logoUrl || '',
        heroImageUrl: heroImageUrl || '',
      }
    });

    // 5. Create Root User
    const passwordHash = await bcrypt.hash(userPassword, SALT_ROUNDS);
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      systemRole: 'none',
      isActive: true,
    });

    // 6. Bind Membership (First user is automatically Manager)
    await Membership.create({
      userId: user._id,
      restaurantId: restaurant._id,
      tenantRole: 'manager',
      isActive: true,
    });

    // 7. Fire off the Seeder payload
    await seedNewTenant(restaurant._id as any);

    // 8. Generate standard App session Token to instantly log them in
    const token = jwt.sign(
      { id: user._id, email: user.email, systemRole: user.systemRole },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    const fullMemberships = await Membership.find({ userId: user._id }).populate('restaurantId');

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole
      },
      memberships: fullMemberships,
      slug
    });
  } catch (error) {
    next(error);
  }
};
