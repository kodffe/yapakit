import { Request, Response, NextFunction } from 'express';
import Zone from '../models/Zone';
import Table from '../models/Table';

/**
 * Get all zones for the current restaurant.
 * GET /api/zones
 */
export const getZones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const zones = await Zone.find({
      restaurantId: req.currentContext.restaurantId,
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: zones.length,
      zones,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new zone for the current restaurant.
 * POST /api/zones
 */
export const createZone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Bad Request: Zone name is required');
    }

    const zone = await Zone.create({
      restaurantId: req.currentContext.restaurantId,
      name,
      description,
      isActive,
    });

    res.status(201).json({
      success: true,
      zone,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a zone.
 * PUT /api/zones/:id
 */
export const updateZone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;

    const zone = await Zone.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.currentContext.restaurantId },
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!zone) {
      res.status(404);
      throw new Error('Zone not found');
    }

    res.json({ success: true, zone });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a zone and all its tables.
 * DELETE /api/zones/:id
 */
export const deleteZone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const zone = await Zone.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.currentContext.restaurantId,
    });

    if (!zone) {
      res.status(404);
      throw new Error('Zone not found');
    }

    // Cascade delete all tables in this zone
    await Table.deleteMany({ zoneId: req.params.id });

    res.json({ success: true, message: 'Zone and its tables deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tables for the current restaurant, optionally filtered by zoneId.
 * GET /api/zones/tables?zoneId=xxx
 */
export const getTables = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {
      restaurantId: req.currentContext.restaurantId,
    };

    if (req.query.zoneId) {
      filter.zoneId = req.query.zoneId;
    }

    const tables = await Table.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      count: tables.length,
      tables,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new table for the current restaurant.
 * POST /api/zones/tables
 */
export const createTable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { zoneId, name, capacity, status } = req.body;

    if (!zoneId || !name) {
      res.status(400);
      throw new Error('Bad Request: zoneId and name are required');
    }

    const table = await Table.create({
      restaurantId: req.currentContext.restaurantId,
      zoneId,
      name,
      capacity,
      status,
    });

    res.status(201).json({
      success: true,
      table,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a table.
 * PUT /api/zones/tables/:id
 */
export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, capacity, status } = req.body;

    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.currentContext.restaurantId },
      { name, capacity, status },
      { new: true, runValidators: true }
    );

    if (!table) {
      res.status(404);
      throw new Error('Table not found');
    }

    res.json({ success: true, table });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a table.
 * DELETE /api/zones/tables/:id
 */
export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const table = await Table.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.currentContext.restaurantId,
    });

    if (!table) {
      res.status(404);
      throw new Error('Table not found');
    }

    res.json({ success: true, message: 'Table deleted' });
  } catch (error) {
    next(error);
  }
};
