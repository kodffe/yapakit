import { Types } from 'mongoose';
import Zone from '../models/Zone';
import Table from '../models/Table';
import Category from '../models/Category';
import MenuItem from '../models/MenuItem';

/**
 * Production Tenant Auto-Seeder.
 * Creates a basic onboarding template for a brand new restaurant
 * to prevent the "Cold Start Problem" for new users.
 */
export const seedNewRestaurant = async (restaurantId: Types.ObjectId | string): Promise<void> => {
  try {
    console.log(`[Seeder] Seeding onboarding data for restaurant ${restaurantId}...`);

    // 1. Create a default Zone
    const mainHall = await Zone.create({
      restaurantId,
      name: 'Main Hall',
      description: 'Default dining area',
    });

    // 2. Create 4 starter Tables in the Main Hall
    const tableNames = ['T1', 'T2', 'T3', 'T4'];
    await Table.insertMany(
      tableNames.map((name) => ({
        restaurantId,
        zoneId: mainHall._id,
        name,
        capacity: 2,
        status: 'available',
      }))
    );

    // 3. Create a default Category
    const drinksCategory = await Category.create({
      restaurantId,
      name: 'Drinks',
      color: '#3B82F6',
      displayOrder: 0,
    });

    // 4. Create a starter MenuItem
    await MenuItem.create({
      restaurantId,
      categoryId: drinksCategory._id,
      name: 'Bottled Water',
      description: 'Natural spring water 500ml',
      price: 1.50,
      region: 'available',
      isAvailable: true,
    });

    console.log(`[Seeder] ✅ Onboarding data seeded successfully for restaurant ${restaurantId}`);
  } catch (error) {
    console.error(`[Seeder] ❌ Failed to seed restaurant ${restaurantId}:`, error);
    // Do not rethrow — seeding failure should not block restaurant creation
  }
};
