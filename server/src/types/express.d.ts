import { Types } from 'mongoose';

/**
 * Global interface extension for Express Request.
 * We augment 'express-serve-static-core' which is the underlying
 * module for Express Request types to ensure the changes are picked up.
 */
declare module 'express-serve-static-core' {
  interface Request {
    user: {
      _id: Types.ObjectId;
      email: string;
      systemRole: 'superadmin' | 'support' | 'sales' | 'none';
    };
    currentContext: {
      restaurantId: Types.ObjectId;
      tenantRole: 'manager' | 'cashier' | 'waiter' | 'kitchen';
    };
  }
}

// This empty export is necessary to mark the file as a module
export {};
