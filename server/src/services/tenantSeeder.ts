import mongoose from 'mongoose';
import Category from '../models/Category';
import MenuItem from '../models/MenuItem';
import Zone from '../models/Zone';
import Table from '../models/Table';

/**
 * Automatically populates a new Tenant with baseline Categories, Items, Zones, and Tables.
 * This establishes a functional default state so managers can test the POS immediately.
 * 
 * @param restaurantId The newly created Restaurant MongoDB ObjectId
 */
export const seedNewTenant = async (restaurantId: mongoose.Types.ObjectId): Promise<void> => {
  try {
    console.log(`[Seeder] Bootstrapping tenant data for restaurant: ${restaurantId}`);

    // --- 1. Create Categories ---
    const mainCategory = await Category.create({
      restaurantId,
      name: 'Main Courses',
      color: '#2563eb', // Blue-600 flat tone
      displayOrder: 1,
    });

    const bevCategory = await Category.create({
      restaurantId,
      name: 'Beverages',
      color: '#10b981', // Emerald-500 flat tone
      displayOrder: 2,
    });

    // --- 2. Create Menu Items ---
    await MenuItem.create([
      // Main Courses
      {
        restaurantId,
        categoryId: mainCategory._id,
        name: 'Classic Cheeseburger',
        description: 'Beef patty, vintage cheddar, lettuce, tomato, brioche bun.',
        price: 12.50,
        region: 'available',
        displayOrder: 1,
        modifiers: [
          {
            name: 'Meat Temperature',
            widgetType: 'radio',
            minChoices: 1,
            maxChoices: 1,
            options: [
              { name: 'Medium Rare', price: 0, isDefault: true },
              { name: 'Medium', price: 0 },
              { name: 'Well Done', price: 0 }
            ]
          }
        ]
      },
      {
        restaurantId,
        categoryId: mainCategory._id,
        name: 'Grilled Salmon',
        description: 'Wild Alaskan salmon, asparagus, lemon butter sauce.',
        price: 24.00,
        region: 'available',
        displayOrder: 2,
        modifiers: []
      },
      {
        restaurantId,
        categoryId: mainCategory._id,
        name: 'Caesar Salad',
        description: 'Crisp romaine, parmesan dust, garlic croutons, house dressing.',
        price: 9.99,
        region: 'available',
        displayOrder: 3,
        modifiers: [
          {
            name: 'Add Protein',
            widgetType: 'checkbox',
            minChoices: 0,
            maxChoices: 1,
            options: [
              { name: 'Grilled Chicken', price: 4.50 },
              { name: 'Shrimp', price: 6.00 }
            ]
          }
        ]
      },
      // Beverages
      {
        restaurantId,
        categoryId: bevCategory._id,
        name: 'Craft Cola',
        description: 'Artisan small batch cola.',
        price: 3.50,
        region: 'available',
        displayOrder: 4,
        modifiers: []
      },
      {
        restaurantId,
        categoryId: bevCategory._id,
        name: 'Sparkling Water',
        description: '750ml imported sparkling mineral water.',
        price: 6.00,
        region: 'available',
        displayOrder: 5,
        modifiers: []
      },
      {
        restaurantId,
        categoryId: bevCategory._id,
        name: 'Local IPA',
        description: 'Draft IPA, citrus hints, 6.5% ABV.',
        price: 7.50,
        region: 'available',
        displayOrder: 6,
        modifiers: []
      }
    ]);

    // --- 3. Create Zones ---
    const mainDining = await Zone.create({
      restaurantId,
      name: 'Main Dining',
      description: 'Indoor seating near the bar.',
      isActive: true,
    });

    const patio = await Zone.create({
      restaurantId,
      name: 'Patio',
      description: 'Outdoor street-view seating.',
      isActive: true,
    });

    // --- 4. Create Tables ---
    await Table.create([
      // Main Dining Tables
      { restaurantId, zoneId: mainDining._id, name: 'T1', capacity: 2 },
      { restaurantId, zoneId: mainDining._id, name: 'T2', capacity: 4 },
      { restaurantId, zoneId: mainDining._id, name: 'T3', capacity: 6 },
      
      // Patio Tables
      { restaurantId, zoneId: patio._id, name: 'P1', capacity: 2 },
      { restaurantId, zoneId: patio._id, name: 'P2', capacity: 4 },
      { restaurantId, zoneId: patio._id, name: 'P3', capacity: 4 },
    ]);

    console.log(`[Seeder] Tenant bootstrapping for ${restaurantId} completed successfully.`);

  } catch (error) {
    console.error(`[Seeder] Error bootstrapping tenant ${restaurantId}:`, error);
    // Suppress throws here so we don't crash the main onboarding request if purely seeding failed.
  }
};
