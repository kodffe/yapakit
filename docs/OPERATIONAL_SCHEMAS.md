# Yapakit - Operational Core Schemas

This document defines the Mongoose schemas for the restaurant's operational infrastructure: **Floor Plan** (Zones & Tables) and **Menu** (Categories & Menu Items). All schemas enforce Multi-Tenant data isolation via the mandatory `restaurantId` field.

---

## 1. Floor Plan

### Zone Schema (`Zone.ts`)

Zones represent logical areas within a restaurant (e.g., "Terrace", "Main Hall", "Bar").

| Field          | Type                       | Required | Default | Description                 |
| :------------- | :------------------------- | :------- | :------ | :-------------------------- |
| `restaurantId` | ObjectId (ref: Restaurant) | ✅       | —       | Tenant isolation key        |
| `name`         | String                     | ✅       | —       | Zone name (e.g., "Terrace") |
| `description`  | String                     | —        | `''`    | Optional description        |

**Indexes:**

- Compound Unique: `{ restaurantId: 1, name: 1 }` — Prevents duplicate zone names within a restaurant.

---

### Table Schema (`Table.ts`)

Tables are physical seating positions within a Zone.

| Field          | Type                       | Required | Default       | Description                                           |
| :------------- | :------------------------- | :------- | :------------ | :---------------------------------------------------- |
| `restaurantId` | ObjectId (ref: Restaurant) | ✅       | —             | Tenant isolation key                                  |
| `zoneId`       | ObjectId (ref: Zone)       | ✅       | —             | Parent zone                                           |
| `name`         | String                     | ✅       | —             | Table identifier (e.g., "T1")                         |
| `capacity`     | Number                     | —        | `2`           | Seat capacity                                         |
| `status`       | Enum                       | —        | `'available'` | `available`, `occupied`, `reserved`, `out_of_service` |

**Indexes:**

- Compound Unique: `{ restaurantId: 1, name: 1 }` — Prevents duplicate table names within a restaurant.

---

## 2. Menu

### Category Schema (`Category.ts`)

Categories group menu items (e.g., "Appetizers", "Drinks", "Desserts").

| Field          | Type                       | Required | Default | Description                          |
| :------------- | :------------------------- | :------- | :------ | :----------------------------------- |
| `restaurantId` | ObjectId (ref: Restaurant) | ✅       | —       | Tenant isolation key                 |
| `name`         | String                     | ✅       | —       | Category name                        |
| `color`        | String                     | —        | —       | HEX/CSS color for guest menu styling |
| `displayOrder` | Number                     | —        | `0`     | Sort position in menus               |

**Indexes:**

- Compound: `{ restaurantId: 1, displayOrder: 1 }` — Optimizes ordered category listing queries.

---

### MenuItem Schema (`MenuItem.ts`)

Individual products/dishes served by the restaurant.

| Field          | Type                       | Required | Default       | Description                            |
| :------------- | :------------------------- | :------- | :------------ | :------------------------------------- |
| `restaurantId` | ObjectId (ref: Restaurant) | ✅       | —             | Tenant isolation key                   |
| `categoryId`   | ObjectId (ref: Category)   | ✅       | —             | Parent category                        |
| `name`         | String                     | ✅       | —             | Item name                              |
| `description`  | String                     | —        | `''`          | Item description                       |
| `price`        | Number                     | ✅       | —             | Unit price                             |
| `imageUrl`     | String                     | —        | —             | Product image URL                      |
| `region`       | Enum                       | —        | `'available'` | `featured`, `available`, `unavailable` |
| `isAvailable`  | Boolean                    | —        | `true`        | Quick availability toggle              |

**Indexes:**

- Compound Query: `{ restaurantId: 1, categoryId: 1, region: 1 }` — Optimizes filtered menu queries for the POS and guest-facing menu.

---

## Tenant Data Isolation Rule

> All operational schemas **must** include `restaurantId` as a required field. Every API query **must** filter by the authenticated tenant's `restaurantId` to prevent cross-tenant data leakage.
