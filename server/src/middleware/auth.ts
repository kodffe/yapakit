import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User from '../models/User';
import Membership from '../models/Membership';

/**
 * Interface for the Decoded JWT Payload.
 */
interface DecodedToken {
  id: string;
  email: string;
  systemRole: string;
}

/**
 * requireAuth Middleware
 * 
 * Validates the JWT in the Authorization header and attaches the user to the request.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Unauthorized: No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;

    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Unauthorized: User not found or inactive');
    }

    // Attach user to express request extension
    req.user = {
      _id: user._id as Types.ObjectId,
      email: user.email,
      systemRole: user.systemRole,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * requireAnyAuth Middleware
 * 
 * Specifically for routes that can be used by BOTH fully authenticated users 
 * AND those in the middle of a registration wizard (who only have a registrationToken).
 */
export const requireAnyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Unauthorized: No token provided');
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET as string;

    try {
      // 1. Try standard user verification first
      const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
      
      // If it has a systemRole, it's likely a standard user
      if (decoded.id) {
        const user = await User.findById(decoded.id).select('-passwordHash');
        if (user && user.isActive) {
          req.user = {
            _id: user._id as Types.ObjectId,
            email: user.email,
            systemRole: user.systemRole,
          };
          return next();
        }
      }
    } catch (err) {
      // Ignore and try registration token verification
    }

    try {
      // 2. Try registration token verification (Step 2 issues this)
      // Note: In onboardingController, we use the same JWT_SECRET but a different payload structure { email }
      const decodedReg = jwt.verify(token, jwtSecret) as { email: string };
      
      if (decodedReg.email) {
        // Mock a user object for the request so downstream logic doesn't crash
        // We set systemRole to 'none' as they aren't fully registered yet
        req.user = {
          _id: new Types.ObjectId(), // Temporary ID
          email: decodedReg.email,
          systemRole: 'none',
        };
        return next();
      }
    } catch (err) {
      // Both failed
    }

    res.status(401);
    throw new Error('Unauthorized: Invalid or expired token');
  } catch (error) {
    next(error);
  }
};

/**
 * requireGlobalRole Middleware Factory
 * 
 * Ensures the user has one of the allowed global system roles.
 */
export const requireGlobalRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.systemRole) {
      res.status(401);
      return next(new Error('Unauthorized: No user or role found in request'));
    }

    if (!allowedRoles.includes(req.user.systemRole)) {
      res.status(403);
      return next(new Error('Forbidden: Insufficient global system permissions'));
    }

    next();
  };
};

/**
 * requireSuperAdmin Middleware
 * 
 * Specifically ensures the user is a superadmin.
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.systemRole !== 'superadmin') {
    res.status(403);
    return next(new Error('Forbidden: Superadmin access required'));
  }
  next();
};

/**
 * requireTenantContext Middleware Factory
 * 
 * Ensures the user belongs to the specified restaurant and has the required role.
 */
export const requireTenantContext = (allowedRoles?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantId = req.headers['x-restaurant-id'] as string;

      if (!restaurantId) {
        res.status(400);
        throw new Error('Bad Request: Missing x-restaurant-id header');
      }

      // Check for Role Impersonation (Superadmin, Support, Sales)
      const isSystemImpersonator = ['superadmin', 'support', 'sales'].includes(req.user.systemRole);

      if (isSystemImpersonator) {
        // Bypass membership check and attach forced manager context
        req.currentContext = {
          restaurantId: new Types.ObjectId(restaurantId),
          tenantRole: 'manager',
        };
        return next();
      }

      // Normal User flow: Check for Membership
      const membership = await Membership.findOne({
        userId: req.user._id,
        restaurantId: new Types.ObjectId(restaurantId),
        isActive: true,
      });

      if (!membership) {
        res.status(403);
        throw new Error('Forbidden: No active membership for this restaurant');
      }

      // RBAC Check: Ensure the user's role in the restaurant is authorized
      const isTenantAuthorized = !allowedRoles || allowedRoles.includes(membership.tenantRole);

      if (!isTenantAuthorized) {
        res.status(403);
        throw new Error('Forbidden: Insufficient permissions for this operation');
      }

      // Attach context to express request extension
      req.currentContext = {
        restaurantId: membership.restaurantId,
        tenantRole: membership.tenantRole,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
