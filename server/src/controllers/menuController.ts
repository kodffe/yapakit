import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import MenuItem from '../models/MenuItem';

// Helper to check if item belongs to the current tenant
const checkTenantOwnership = (doc: any, req: Request) => {
  if (!doc) throw new Error('Not Found: Resource not found');
  if (doc.restaurantId.toString() !== req.currentContext.restaurantId.toString()) {
    throw new Error('Forbidden: Resource belongs to another tenant');
  }
};

/**
 * Get all categories for the current restaurant, sorted by displayOrder.
 * GET /api/menu/categories
 */
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Category.find({
      restaurantId: req.currentContext.restaurantId,
    }).sort({ displayOrder: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category for the current restaurant.
 * POST /api/menu/categories
 */
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, color, displayOrder } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Bad Request: Category name is required');
    }

    const category = await Category.create({
      restaurantId: req.currentContext.restaurantId,
      name,
      color,
      displayOrder,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category.
 * PUT /api/menu/categories/:id
 */
export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Not Found: Category not found');
    }
    checkTenantOwnership(category, req);

    const { name, color, displayOrder } = req.body;
    category.name = name ?? category.name;
    category.color = color ?? category.color;
    category.displayOrder = displayOrder ?? category.displayOrder;
    await category.save();

    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category.
 * DELETE /api/menu/categories/:id
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Not Found: Category not found');
    }
    checkTenantOwnership(category, req);

    // Ensure no items are using this category before deleting (or cascade delete)
    const itemsCount = await MenuItem.countDocuments({ categoryId: category._id });
    if (itemsCount > 0) {
      res.status(400);
      throw new Error('Bad Request: Cannot delete category containing menu items');
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder categories in bulk.
 * PUT /api/menu/categories/reorder
 */
export const reorderCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderedIds } = req.body; // Array of category IDs in the desired order
    if (!Array.isArray(orderedIds)) {
      res.status(400);
      throw new Error('Bad Request: orderedIds array is required');
    }

    // Update each category's displayOrder based on its index in the array
    const updates = orderedIds.map((id, index) => 
      Category.updateOne(
        { _id: id, restaurantId: req.currentContext.restaurantId },
        { displayOrder: index }
      )
    );
    await Promise.all(updates);

    res.json({ success: true, message: 'Categories reordered successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all menu items for the current restaurant, optionally filtered by categoryId.
 * GET /api/menu/items?categoryId=xxx
 */
export const getMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {
      restaurantId: req.currentContext.restaurantId,
    };

    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }

    const items = await MenuItem.find(filter)
      .populate('categoryId', 'name color')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new menu item for the current restaurant.
 * POST /api/menu/items
 */
export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId, name, description, price, imageUrl, region, isAvailable, displayOrder, modifiers } = req.body;

    if (!categoryId || !name || price === undefined) {
      res.status(400);
      throw new Error('Bad Request: categoryId, name, and price are required');
    }

    const item = await MenuItem.create({
      restaurantId: req.currentContext.restaurantId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      region,
      isAvailable,
      displayOrder,
      modifiers,
    });

    res.status(201).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a menu item.
 * PUT /api/menu/items/:id
 */
export const updateMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Not Found: Menu item not found');
    }
    checkTenantOwnership(item, req);

    const { categoryId, name, description, price, imageUrl, region, isAvailable, displayOrder, modifiers } = req.body;
    
    item.categoryId = categoryId ?? item.categoryId;
    item.name = name ?? item.name;
    item.description = description ?? item.description;
    item.price = price ?? item.price;
    item.imageUrl = imageUrl ?? item.imageUrl;
    item.region = region ?? item.region;
    item.isAvailable = isAvailable ?? item.isAvailable;
    item.displayOrder = displayOrder ?? item.displayOrder;
    item.modifiers = modifiers ?? item.modifiers;

    await item.save();
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a menu item.
 * DELETE /api/menu/items/:id
 */
export const deleteMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Not Found: Menu item not found');
    }
    checkTenantOwnership(item, req);

    await item.deleteOne();
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder menu items using bulkWrite.
 * PUT /api/menu/items/reorder
 */
export const reorderMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      res.status(400);
      throw new Error('Bad Request: items array is required');
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { 
          _id: item._id, 
          restaurantId: req.currentContext.restaurantId 
        },
        update: { $set: { displayOrder: item.displayOrder } },
      },
    }));

    if (bulkOps.length > 0) {
      await MenuItem.bulkWrite(bulkOps);
    }

    res.json({ success: true, message: 'Menu items reordered successfully' });
  } catch (error) {
    next(error);
  }
};
