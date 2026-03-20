import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

// Import all models
import User from '../models/User';
import Restaurant from '../models/Restaurant';
import Membership from '../models/Membership';
import Zone from '../models/Zone';
import Table from '../models/Table';
import Category from '../models/Category';
import MenuItem from '../models/MenuItem';
import Order from '../models/Order';
import Promotion from '../models/Promotion';
import Shift from '../models/Shift';
import Counter from '../models/Counter';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';

/**
 * Development Database Seeder.
 * Wipes all collections and populates with a complex multi-tenant demo environment.
 */
async function seedDev(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI is not defined in .env');

    await mongoose.connect(mongoUri);
    console.log('\n🚀 [Seed] Connected to MongoDB');

    // ──────────────────────────────────────────────
    // WIPE ALL COLLECTIONS
    // ──────────────────────────────────────────────
    console.log('⚠️  [Seed] Wiping database...');
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Membership.deleteMany({}),
      Zone.deleteMany({}),
      Table.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      Order.deleteMany({}),
      Promotion.deleteMany({}),
      Shift.deleteMany({}),
      Counter.deleteMany({}),
    ]);
    console.log('🗑️  [Seed] All collections cleared.');

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // ──────────────────────────────────────────────
    // 1. CREATE GLOBAL USERS (Impersonators)
    // ──────────────────────────────────────────────
    const globalUsers = await User.insertMany([
      { email: 'superadmin@yapakit.com', passwordHash, firstName: 'Super', lastName: 'Admin', systemRole: 'superadmin' },
      { email: 'support@yapakit.com', passwordHash, firstName: 'Support', lastName: 'Agent', systemRole: 'support' },
      { email: 'sales@yapakit.com', passwordHash, firstName: 'Sales', lastName: 'Rep', systemRole: 'sales' },
    ]);
    console.log('👥 [Seed] Global Users created');

    // ──────────────────────────────────────────────
    // 2. CREATE MANAGERS
    // ──────────────────────────────────────────────
    const [manager1, manager2] = await User.insertMany([
      { email: 'manager1@yapakit.com', passwordHash, firstName: 'Marco', lastName: 'Polo', systemRole: 'none' },
      { email: 'manager2@yapakit.com', passwordHash, firstName: 'Julia', lastName: 'Child', systemRole: 'none' },
    ]);

    // ──────────────────────────────────────────────
    // 3. CREATE RESTAURANTS
    // ──────────────────────────────────────────────
    const restaurants = await Restaurant.insertMany([
      { name: 'Pizza Roma', slug: 'pizza-roma', subscriptionStatus: 'trial' },
      { name: 'Burger Central', slug: 'burger-central', subscriptionStatus: 'active' },
      { name: 'Sushi Zen', slug: 'sushi-zen', subscriptionStatus: 'trial' },
    ]);
    console.log('🏪 [Seed] 3 Restaurants created');

    // Assign Managers
    await Membership.insertMany([
      { userId: manager1._id, restaurantId: restaurants[0]._id, tenantRole: 'manager' }, // Roma
      { userId: manager1._id, restaurantId: restaurants[1]._id, tenantRole: 'manager' }, // Central
      { userId: manager2._id, restaurantId: restaurants[2]._id, tenantRole: 'manager' }, // Zen
    ]);

    const summary: any[] = [
      { Role: 'System: Superadmin', Email: 'superadmin@yapakit.com' },
      { Role: 'System: Support', Email: 'support@yapakit.com' },
      { Role: 'System: Sales', Email: 'sales@yapakit.com' },
      { Role: 'Manager (Roma & Burger)', Email: 'manager1@yapakit.com' },
      { Role: 'Manager (Sushi)', Email: 'manager2@yapakit.com' },
    ];

    // ──────────────────────────────────────────────
    // 4. GENERATE DATA PER RESTAURANT
    // ──────────────────────────────────────────────
    for (const res of restaurants) {
      const slug = res.slug;
      
      // Staff
      const [waiter, cashier, kitchen] = await User.insertMany([
        { email: `waiter@${slug}.com`, passwordHash, firstName: 'Waiter', lastName: slug, systemRole: 'none' },
        { email: `cashier@${slug}.com`, passwordHash, firstName: 'Cashier', lastName: slug, systemRole: 'none' },
        { email: `kitchen@${slug}.com`, passwordHash, firstName: 'Kitchen', lastName: slug, systemRole: 'none' },
      ]);

      await Membership.insertMany([
        { userId: waiter._id, restaurantId: res._id, tenantRole: 'waiter' },
        { userId: cashier._id, restaurantId: res._id, tenantRole: 'cashier' },
        { userId: kitchen._id, restaurantId: res._id, tenantRole: 'kitchen' },
      ]);

      summary.push(
        { Role: `Waiter (${res.name})`, Email: `waiter@${slug}.com` },
        { Role: `Cashier (${res.name})`, Email: `cashier@${slug}.com` },
        { Role: `Kitchen (${res.name})`, Email: `kitchen@${slug}.com` }
      );

      // Zones
      const [hall, patio] = await Zone.insertMany([
        { restaurantId: res._id, name: 'Main Hall', description: 'Primary seating' },
        { restaurantId: res._id, name: 'Patio', description: 'Outdoor area' },
      ]);

      // Tables (3 per zone)
      for (let i = 1; i <= 3; i++) {
        await Table.create({ restaurantId: res._id, zoneId: hall._id, name: `H${i}`, capacity: 4 });
        await Table.create({ restaurantId: res._id, zoneId: patio._id, name: `P${i}`, capacity: 2 });
      }

      // Menu
      const cat1 = await Category.create({ restaurantId: res._id, name: 'Food', color: '#3B82F6', displayOrder: 0 });
      const cat2 = await Category.create({ restaurantId: res._id, name: 'Drinks', color: '#10B981', displayOrder: 1 });

      await MenuItem.insertMany([
        { restaurantId: res._id, categoryId: cat1._id, name: `${res.name} Signature`, price: 15, isAvailable: true },
        { restaurantId: res._id, categoryId: cat1._id, name: 'Side Dish', price: 5, isAvailable: true },
        { restaurantId: res._id, categoryId: cat2._id, name: 'Regular Soda', price: 2.5, isAvailable: true },
        { restaurantId: res._id, categoryId: cat2._id, name: 'House Wine', price: 6, isAvailable: true },
      ]);
    }

    console.log('✅ [Seed] Multi-tenant infrastructure populated.');
    console.log('\n--- DEV ACCOUNTS SUMMARY ---');
    console.table(summary);
    console.log('Password for all users: "password123"\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed] Failed:', error);
    process.exit(1);
  }
}

seedDev();
