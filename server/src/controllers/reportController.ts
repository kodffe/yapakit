import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';

/**
 * Get daily statistics for the current restaurant.
 * Calculates total sales (completed), completed count, and active count.
 * GET /api/reports/daily
 */
export const getDailyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.currentContext.restaurantId;

    // Define today's boundaries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all orders for today in one query
    const todayOrders = await Order.find({
      restaurantId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    // Calculate metrics
    const completedOrders = todayOrders.filter((o) => o.status === 'completed');
    const activeOrders = todayOrders.filter(
      (o) => !['completed', 'cancelled'].includes(o.status)
    );

    const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);

    res.json({
      success: true,
      data: {
        totalSales,
        completedOrdersCount: completedOrders.length,
        activeOrdersCount: activeOrders.length,
        totalOrdersToday: todayOrders.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unified dashboard statistics (Totals, Trends, Top Items)
 * GET /api/reports/dashboard
 */
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.currentContext.restaurantId;
    const { startDate, endDate } = req.query;

    // Default to last 7 days if no dates provided
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const matchQuery = {
      restaurantId,
      status: 'completed',
      updatedAt: { $gte: start, $lte: end },
    };

    // 1. Totals Pipeline
    const totalsResult = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totals = totalsResult.length > 0 ? totalsResult[0] : { totalSales: 0, totalOrders: 0 };
    const averageOrderValue = totals.totalOrders > 0 ? totals.totalSales / totals.totalOrders : 0;

    // 2. Sales Trend Pipeline (Grouped by Date)
    const salesTrend = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalSales: 1,
          orderCount: 1,
        },
      },
    ]);

    // 3. Top Items Pipeline
    const topItems = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: '$_id',
          quantity: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          ...totals,
          averageOrderValue,
        },
        salesTrend,
        topItems,
      },
    });
  } catch (error) {
    next(error);
  }
};
