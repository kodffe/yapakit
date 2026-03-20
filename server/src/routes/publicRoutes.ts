import { Router, Request, Response, NextFunction } from 'express';
import Restaurant from '../models/Restaurant';
import MenuItem from '../models/MenuItem';
import Table from '../models/Table';
import Customer from '../models/Customer';
import Reservation from '../models/Reservation';

const router = Router();

interface ICategory {
  _id: unknown;
  name: string;
  displayOrder: number;
}

/**
 * @route   GET /api/public/:slug
 * @desc    Get public restaurant info by slug (no auth required)
 * @access  Public
 */
router.get('/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne(
      { slug: req.params.slug, status: 'active' },
      'name slug address phone branding settings.logoUrl settings.heroImageUrl settings.currency'
    );

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        _id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        phone: restaurant.phone,
        logoUrl: restaurant.settings?.logoUrl || '',
        heroImageUrl: restaurant.settings?.heroImageUrl || '',
        branding: restaurant.branding || { primaryColor: '#2563EB', fontFamily: 'modern' },
        currency: restaurant.settings?.currency || 'USD',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/public/:slug/menu
 * @desc    Get public menu (categories + items) by restaurant slug
 * @access  Public
 */
router.get('/:slug/menu', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurant = await Restaurant.findOne(
      { slug: req.params.slug, status: 'active' },
      '_id name branding settings.currency'
    );

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    // Import Category model dynamically to avoid circular deps
    const Category = (await import('../models/Category')).default;

    const categories: ICategory[] = await Category.find(
      { restaurantId: restaurant._id },
      'name displayOrder'
    ).sort({ displayOrder: 1 }).lean();

    const items = await MenuItem.find(
      { restaurantId: restaurant._id, isAvailable: true },
      'name description price imageUrl categoryId region trackInventory stockQuantity'
    ).sort({ displayOrder: 1 }).lean();

    res.json({
      success: true,
      data: {
        restaurantName: restaurant.name,
        branding: restaurant.branding || { primaryColor: '#2563EB', fontFamily: 'modern' },
        currency: restaurant.settings?.currency || 'USD',
        categories,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/public/:slug/availability
 * @desc    Get available time slots for a given date
 * @access  Public
 */
router.get('/:slug/availability', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      res.status(400).json({ success: false, message: 'Date (YYYY-MM-DD) is required' });
      return;
    }

    const restaurant = await Restaurant.findOne(
      { slug: req.params.slug, status: 'active' },
      '_id settings.operatingHours settings.reservationDuration'
    );

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    const requestedDate = new Date(date);
    // getUTCDay() or getDay() depending on how date string is parsed. 
    // "YYYY-MM-DD" parsed as Date gives UTC midnight.
    const dayOfWeek = requestedDate.getUTCDay(); 
    
    const operatingHours = restaurant.settings?.operatingHours || [];
    const daySchedule = operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

    let slots: string[] = [];

    // If no schedule or closed, return empty slots
    if (!daySchedule || daySchedule.isClosed || !daySchedule.openTime || !daySchedule.closeTime) {
      res.json({ success: true, data: { availableTimes: [] } });
      return;
    }

    // Generate 30-min slots from openTime to closeTime
    const openParts = daySchedule.openTime.split(':').map(Number);
    const closeParts = daySchedule.closeTime.split(':').map(Number);
    
    let currentMin = openParts[0] * 60 + openParts[1];
    const endMin = closeParts[0] * 60 + closeParts[1];

    while (currentMin <= endMin - 30) { // Assume last slot at least 30 mins before closing
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      currentMin += 30; // 30-minute intervals
    }

    // Filter by capacity (MVP algorithm: # reservations in slot < max tables)
    const totalTables = await Table.countDocuments({ restaurantId: restaurant._id, status: { $ne: 'out_of_service' } });
    
    if (totalTables > 0) {
      const pendingAndApproved = await Reservation.find({
        restaurantId: restaurant._id,
        reservationDate: requestedDate, // ensure matching UTC date
        status: { $in: ['pending', 'approved'] }
      }).select('reservationTime');

      const countsByTime: Record<string, number> = {};
      pendingAndApproved.forEach((res) => {
        countsByTime[res.reservationTime] = (countsByTime[res.reservationTime] || 0) + 1;
      });

      slots = slots.filter((time) => (countsByTime[time] || 0) < totalTables);
    } else {
      slots = []; // No tables available ever
    }

    res.json({ success: true, data: { availableTimes: slots } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/public/:slug/reservations
 * @desc    Create a public reservation with blind merge for customer
 * @access  Public
 */
router.post('/:slug/reservations', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name, phone, partySize, date, time, specialRequests } = req.body;

    if (!email || !name || !partySize || !date || !time) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const restaurant = await Restaurant.findOne({ slug: req.params.slug, status: 'active' }, '_id');
    if (!restaurant) {
      res.status(404).json({ success: false, message: 'Restaurant not found' });
      return;
    }

    // Blind Merge: Update or create customer
    const customer = await Customer.findOneAndUpdate(
      { restaurantId: restaurant._id, email: email.toLowerCase() },
      { name, phone },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Create reservation
    const newReservation = await Reservation.create({
      restaurantId: restaurant._id,
      customerId: customer._id,
      partySize: Number(partySize),
      reservationDate: new Date(date),
      reservationTime: time,
      specialRequests: specialRequests || '',
      status: 'pending',
    });

    res.status(201).json({ success: true, data: newReservation });
  } catch (error) {
    next(error);
  }
});

export default router;
