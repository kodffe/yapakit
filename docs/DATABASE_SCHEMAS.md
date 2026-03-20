# Yapakit - Core Database Schemas & Indexing

Yapakit employs a decoupled Multi-Tenant approach to ensure scalability and data integrity. By separating identities (**Users**) from business entities (**Restaurants**) via a context-aware pivot (**Memberships**), the system allows users to belong to multiple restaurants with distinct roles.

---

## 1. User Schema (`User.ts`)

The `User` collection manages global identity and authentication.

| Field          | Type     | Description                                         |
| :------------- | :------- | :-------------------------------------------------- |
| `_id`          | ObjectId | Primary Key.                                        |
| `email`        | String   | Unique, lowercase, required.                        |
| `passwordHash` | String   | Bcrypt/Argon2 hashed password.                      |
| `firstName`    | String   | User's first name.                                  |
| `lastName`     | String   | User's last name.                                   |
| `systemRole`   | Enum     | `'superadmin'`, `'support'`, or `'none'` (Default). |
| `isActive`     | Boolean  | Account status (Default: `true`).                   |

### Indexing strategy

- **Unique Index:** `{ email: 1 }` - Prevents duplicate registrations.

---

## 2. Restaurant Schema (`Restaurant.ts`)

The `Restaurant` collection defines the tenant entity and its global configuration.

| Field                   | Type     | Description                                                                                                                                                                               |
| :---------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_id`                   | ObjectId | Primary Key.                                                                                                                                                                              |
| `name`                  | String   | Display name of the restaurant.                                                                                                                                                           |
| `slug`                  | String   | Unique identifier used in URLs (lowercase).                                                                                                                                               |
| `status`                | Enum     | `'active'`, `'inactive'`, or `'suspended'` (Default: `'active'`).                                                                                                                         |
| `subscriptionStatus`    | Enum     | Billing state (`'trialing'`, `'active'`, `'past_due'`, etc).                                                                                                                              |
| `subscriptionExpiresAt` | Date     | End date of trial or billing cycle.                                                                                                                                                       |
| `timezone`              | String   | IANA timezone string (e.g., `'America/Guayaquil'`).                                                                                                                                       |
| `address`               | String   | Formatted address for public facing sites/receipts.                                                                                                                                       |
| `phone`                 | String   | Business phone number.                                                                                                                                                                    |
| `logoUrl`               | String   | Cloudinary URL of the Restaurant logo.                                                                                                                                                    |
| `heroImageUrl`          | String   | Cloudinary URL of the Public Landing Page banner.                                                                                                                                         |
| `settings`              | Object   | Tenant Settings: `{ taxRate, currency, enabledOrderTypes, defaultDeliveryFee, defaultTakeawayFee, reservationDuration, operatingHours: [{ dayOfWeek, openTime, closeTime, isClosed }] }`. |

### Indexing strategy

- **Unique Index:** `{ slug: 1 }` - Ensures URL-friendly identifiers are unique.

---

## 3. Membership Schema (`Membership.ts`)

The `Membership` collection is the pivot that connects a **User** to a **Restaurant** and defines their local permissions (RBAC Context).

| Field          | Type     | Description                                           |
| :------------- | :------- | :---------------------------------------------------- |
| `_id`          | ObjectId | Primary Key.                                          |
| `userId`       | ObjectId | Reference to `User` collection.                       |
| `restaurantId` | ObjectId | Reference to `Restaurant` collection.                 |
| `tenantRole`   | Enum     | `'manager'`, `'cashier'`, `'waiter'`, or `'kitchen'`. |
| `isActive`     | Boolean  | Local membership status (Default: `true`).            |

### Indexing strategy

- **Compound Unique Index:** `{ userId: 1, restaurantId: 1 }` - A user can only hold one role/membership per restaurant.
- **Query Index:** `{ restaurantId: 1 }` - Optimized for loading all staff members belonging to a specific tenant.

---

## 4. Tenant Data Isolation Rules

Strict adherence to these rules is mandatory to prevent cross-tenant data leaks and maintain SaaS integrity.

### Rule 1: Mandatory Restaurant Association

EVERY operational collection (including `Orders`, `MenuItems`, `Tables`, `Categories`, `Products`) **MUST** include a `restaurantId` (ObjectId) field.

- _Exception:_ Global system-level logs or reference data.

### Rule 2: API Query Filtering

EVERY backend API route (excluding global superadmin operations) **MUST** filter database queries by the authenticated user's current `restaurantId` context.

- **Correct Pattern:** `Order.find({ restaurantId: req.currentContext.restaurantId })`
- **Incorrect Pattern:** `Order.find({ _id: req.params.id })` (Vulnerable to ID enumeration attacks from other tenants).

---

**End of Document**  
_Company Confidential - Kodffe / Yapakit Technology Group_
