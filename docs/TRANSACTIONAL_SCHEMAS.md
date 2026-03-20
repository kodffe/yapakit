# Yapakit - Transactional & CRM Schemas

This document defines the Mongoose schemas for the restaurant's daily runtime data: **Orders**, **Customers**, **Reservations**, **Shifts**, and **Promotions**.

All schemas strictly enforce Multi-Tenant data isolation via the `restaurantId` field.

---

## 1. Core POS Operations

### Order Schema (`Order.ts`)

The central transactional document tracking purchases, taxes, and split payments.

| Field            | Type                       | Required | Description                                                                   |
| :--------------- | :------------------------- | :------- | :---------------------------------------------------------------------------- |
| `restaurantId`   | ObjectId (ref: Restaurant) | ✅       | Tenant isolation key.                                                         |
| `waiterId`       | ObjectId (ref: User)       | ✅       | The staff member who opened the order.                                        |
| `orderNumber`    | String                     | ✅       | Atomic sequential ID per tenant (e.g. `001`).                                 |
| `orderType`      | Enum                       | —        | `'dine-in'`, `'takeaway'`, or `'delivery'` (Default: `'dine-in'`).            |
| `tableName`      | String                     | 🔄       | Name of table (Required if `dine-in`).                                        |
| `tableId`        | ObjectId (ref: Table)      | 🔄       | Reference to table (Required if `dine-in`).                                   |
| `status`         | Enum                       | —        | `'sent'`, `'preparing'`, `'ready'`, `'served'`, `'completed'`, `'cancelled'`. |
| `items`          | Array                      | ✅       | Array of `IOrderItem` (see below).                                            |
| `subtotal`       | Number                     | ✅       | Sum of items before fees/taxes/discounts.                                     |
| `discountCode`   | String                     | —        | Applied promotion code.                                                       |
| `discountAmount` | Number                     | —        | Amount deducted via promotion.                                                |
| `takeawayFee`    | Number                     | —        | Flat fee applied to takeaway orders.                                          |
| `deliveryFee`    | Number                     | —        | Flat fee applied to delivery orders.                                          |
| `taxAmount`      | Number                     | ✅       | Computed tax.                                                                 |
| `total`          | Number                     | ✅       | Final gross amount due.                                                       |
| `payments`       | Array                      | —        | Array of partial split payments (see below).                                  |
| `revision`       | Number                     | —        | Counter incremented on waiter modification (Default: `0`).                    |
| `cancelReason`   | String                     | —        | Note for voids/cancellations.                                                 |

#### Nested: `IOrderItem`

Tracks the individual item lines, including math for itemized split checks.

- `cartItemId` (String): Unique ID to track this line across split payments.
- `menuItemId` / `name` / `quantity` / `basePrice`.
- `paidQuantity` (Number): How many of this item have been paid across split passes.
- `selectedModifiers`: Array of chosen options and extra prices.

#### Nested: `payments`

Tracks partial checkouts on the cashier till. If the balance reaches 0, the order Auto-Completes.

- `amount` (Number): Funds captured.
- `method` (Enum): `'cash'`, `'card'`, `'other'`.
- `itemsPaid`: Array tracking exactly which `cartItemId` and quantity was charged on this pass (for itemized splitting).
- `customerData`: Attached invoice data strictly for this specific payment split (`name`, `taxId`, `address`, `email`).

**Indexes:**

- `{ restaurantId: 1, status: 1 }`: Highly optimized for real-time Kitchen (KDS) queries filtering by active statuses.

---

### Shift Schema (`Shift.ts`)

Tracks Cashier register sessions.

| Field          | Type                       | Required | Description                                                  |
| :------------- | :------------------------- | :------- | :----------------------------------------------------------- |
| `restaurantId` | ObjectId (ref: Restaurant) | ✅       | Tenant isolation key.                                        |
| `cashierId`    | ObjectId (ref: User)       | ✅       | The staff member operating the till.                         |
| `startTime`    | Date                       | ✅       | Shift open time.                                             |
| `endTime`      | Date                       | —        | Shift close time.                                            |
| `startingCash` | Number                     | ✅       | Initial float in the drawer.                                 |
| `expectedCash` | Number                     | —        | Computed cash expected at end of shift (Float + Cash Sales). |
| `actualCash`   | Number                     | —        | What the cashier physically counted.                         |
| `difference`   | Number                     | —        | `actualCash` - `expectedCash`.                               |
| `status`       | Enum                       | —        | `'open'`, `'closed'` (Default: `'open'`).                    |

---

## 2. Customer & Reservation (CRM)

### Customer Schema (`Customer.ts`)

Centralized CRM database generated via POS Manual entry or Blind Mapping from public reservations.

| Field          | Type                       | Required | Description                 |
| :------------- | :------------------------- | :------- | :-------------------------- |
| `restaurantId` | ObjectId (ref: Restaurant) | ✅       | Tenant isolation key.       |
| `name`         | String                     | ✅       | Customer/Company name.      |
| `email`        | String                     | —        | Used for booking lookups.   |
| `phone`        | String                     | —        | Phone contact.              |
| `address`      | String                     | —        | Primary address.            |
| `taxId`        | String                     | —        | RUC / Tax ID for invoicing. |

---

### Reservation Schema (`Reservation.ts`)

Tracks upcoming B2C bookings made via the Landing Page wizard.

| Field             | Type                       | Required | Description                                                            |
| :---------------- | :------------------------- | :------- | :--------------------------------------------------------------------- |
| `restaurantId`    | ObjectId (ref: Restaurant) | ✅       | Tenant isolation key.                                                  |
| `customerId`      | ObjectId (ref: Customer)   | ✅       | Map to CRM doc.                                                        |
| `date`            | Date                       | ✅       | Calendar day of the booking.                                           |
| `time`            | String                     | ✅       | Time (e.g. `'19:30'`).                                                 |
| `partySize`       | Number                     | ✅       | Number of guests.                                                      |
| `status`          | Enum                       | —        | `'pending'`, `'approved'`, `'rejected'`, `'cancelled'`, `'completed'`. |
| `tableId`         | ObjectId (ref: Table)      | —        | Manager assigned table placement.                                      |
| `specialRequests` | String                     | —        | Allergies/Notes.                                                       |

**Indexes:**

- `{ restaurantId: 1, date: 1 }`: Speeds up algorithmic calculation of capacity for the public availability endpoint.

---

## 3. Marketing

### Promotion Schema (`Promotion.ts`)

Promo codes applicable to Orders.

| Field          | Type                       | Required | Description                              |
| :------------- | :------------------------- | :------- | :--------------------------------------- |
| `restaurantId` | ObjectId (ref: Restaurant) | ✅       | Tenant isolation key.                    |
| `code`         | String                     | ✅       | Unique code string (e.g., `'SUMMER20'`). |
| `discountType` | Enum                       | ✅       | `'percentage'` or `'fixed'`.             |
| `amount`       | Number                     | ✅       | Discount value.                          |
| `isActive`     | Boolean                    | —        | Global toggle.                           |
| `validFrom`    | Date                       | —        | Start of campaign.                       |
| `validUntil`   | Date                       | —        | Expiration of campaign.                  |

**Indexes:**

- Compound Unique: `{ restaurantId: 1, code: 1 }`: Prevents duplicate promo codes within a single restaurant.

---

**End of Document**
_Company Confidential - Kodffe / Yapakit Technology Group_
