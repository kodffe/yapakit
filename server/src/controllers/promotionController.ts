import { Request, Response, NextFunction } from 'express';
import Promotion from '../models/Promotion';

/**
 * Validate a promotion code for the current restaurant.
 * GET /api/promotions/validate/:code
 */
export const validatePromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;
    const restaurantId = req.currentContext.restaurantId;

    if (!code) {
      res.status(400);
      throw new Error('Bad Request: Promotion code is required');
    }

    const promotion = await Promotion.findOne({
      restaurantId,
      code: code.toUpperCase().trim(),
    }).lean();

    if (!promotion) {
      res.status(400);
      throw new Error('Invalid promotion code');
    }

    if (!promotion.isActive) {
      res.status(400);
      throw new Error('This promotion is no longer active');
    }

    const now = new Date();

    if (promotion.validFrom && now < new Date(promotion.validFrom)) {
      res.status(400);
      throw new Error('This promotion is not yet active');
    }

    if (promotion.validUntil && now > new Date(promotion.validUntil)) {
      res.status(400);
      throw new Error('This promotion has expired');
    }

    res.json({
      success: true,
      data: {
        code: promotion.code,
        discountType: promotion.discountType,
        value: promotion.value,
      },
    });
  } catch (error) {
    next(error);
  }
};
