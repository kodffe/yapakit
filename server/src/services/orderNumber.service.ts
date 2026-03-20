import Counter from '../models/Counter';

/**
 * Generates an atomic, sequential order number for a specific restaurant.
 * Uses MongoDB $inc to guarantee no duplicates even under heavy concurrent load.
 *
 * @param restaurantId The ID of the tenant restaurant
 * @param prefix Optional prefix (default: "#")
 * @param padding Optional zero-padding length (default: 3)
 * @returns Formatted sequence string (e.g., "#001")
 */
export const generateNextOrderNumber = async (
  restaurantId: string,
  prefix: string = '#',
  padding: number = 3
): Promise<string> => {
  // Find the counter for this restaurant and entity, increment by 1
  const counter = await Counter.findOneAndUpdate(
    { restaurantId, entityName: 'Order' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // Create if it doesn't exist
  );

  // Format the sequence number with leading zeros
  const sequenceStr = String(counter.seq).padStart(padding, '0');
  
  return `${prefix}${sequenceStr}`;
};
