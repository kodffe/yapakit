# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Dynamic Tenant Theming (Branding & Appearance):**
  - New `branding` object in `Restaurant` model with `primaryColor` and `fontFamily`.
  - Configured Tailwind CSS to use CSS variables (`--brand-primary`, `--brand-font`) for runtime styling.
  - Implemented `ThemeProvider.tsx` to inject branding styles based on tenant configuration.
  - Revamped `SettingsPage.tsx` with a new "Branding & Appearance" section featuring:
    - Predefined safe color palette for primary actions.
    - Typography selector (Modern, Elegant, Casual) with automatic font loading.
    - Logo and Hero image upload integration.
  - Refactored core UI components (`PosCart`, `PosMenuGrid`, `CheckoutModal`, `WaiterPosPage`) to use `bg-brand-primary` and `text-brand-primary` instead of hardcoded colors.
  - Integrated branding into public-facing pages (`PublicLandingPage`, `PublicMenuPage`).

- **Public Menu Layouts & Item Detail Modal:**
  - Added `publicLayout` field to `Restaurant.branding` (enum: `classic-tabs`, `visual-grid`, `minimal-list`).
  - New "Menu Layout" selector in Settings → Branding & Appearance with 3 flat rectangular cards.
  - Refactored `PublicMenuPage.tsx` with 3 layout render functions:
    - **Classic Tabs**: Hero image, sticky horizontal category tabs, vertical list items with thumbnails.
    - **Visual Grid**: Category section headers with a responsive 2/3-column photo grid.
    - **Minimal List**: Centered logo, elegant text-only layout with dotted-line price alignment.
  - New `MenuItemDetailModal.tsx` component: flat-color bottom-sheet (mobile) / centered modal (desktop) showing item image, name, price, and full description.
  - Clicking any menu item in any layout opens the unified detail modal.

- **Tenant Sidebar Navigation:**
  - Replaced floating action button (`FloatingNav`) with a standard responsive B2B sidebar (`TenantSidebar`).
  - Desktop: collapsible sidebar rail (`w-64` expanded / `w-20` collapsed) with smooth transitions.
  - Mobile: off-canvas drawer with solid overlay, hamburger button in TopBar.
  - Active navigation links use dynamic `bg-brand-primary text-white` for tenant branding.
  - Bottom section: Switch Business (manager only), Logout, and collapse toggle.
  - Refactored `TenantLayout.tsx` to flex h-screen layout with ThemeProvider at root level.
  - Simplified `TopBar.tsx` to minimal mobile header with hamburger + NetworkBadge.

- **Sales & Growth Dashboard Refinement:**
  - Specialized metrics for Sales users (Total Tenants, Active, Trial, Past Due).
  - New "Memberships Expiring Soon" table (30-day window).
  - Restricted "Support" navigation to Superadmins and Support roles.
- **Comprehensive Project Documentation Overhaul:**
  - Revamped `README.md` with clear Quick Start and Feature summaries.
  - Added `.env.example` templates for both `client` and `server`.
  - New `docs/CONTRIBUTING.md` for standardized English-first development.
  - New `docs/EXTERNAL_SERVICES.md` documenting Cloudinary and Brevo integrations.
  - Updated `docs/DEVELOPER_GUIDE.md` with modern tech stack and role logic.

- **Support Ticket System:** Foundational implementation for platform-wide technical support.
  - New `Ticket` model with priority and status tracking.
  - Tenant-side `POST /api/tickets` route for Managers to submit support requests.
  - Admin-side Ticket Directory with real-time status updates and detail modals.
- **Role-Based Admin UI:** Refined the Admin Portal to distinguish between `superadmin` and `support` roles.
  - Conditional navigation: "Users" management restricted to Superadmins.
  - Role-specific Dashboard: Support staff see ticket KPIs (Open/In-Progress/Resolved), while Superadmins see SaaS growth metrics.
- **Advanced Admin Portal UI:** Implemented robust filtering, pagination, and multi-tenant visibility controls.
  - Added a tabbed interface in `RestaurantsListPage` to toggle between Restaurants and Managers views.
  - Enabled keyword and status filtering across all global administrative tables.
  - Integrated Manager joins in `getAllRestaurants` to show linked administrators for each tenant.
  - Created `getAllManagers` endpoint and view to track cross-tenant assignments.
  - Added record-level Detail Modals for Businesses and Administrators.
- **Admin User Management CRUD:** Implemented full lifecycle management for global administrative users (Superadmin, Support, Sales). Features a secure backend with `requireSuperAdmin` protection and a dark flat-themed UI in the Admin Portal.
- **Multi-Tenant Hub**: Refactored `/select-restaurant` into a full management hub. Users can now create new restaurants directly (no OTP required), with auto-slug generation, membership assignment, and tenant seeding. Restaurant cards show clickable names for direct navigation and a "Settings" button for managers.
- **Soft Delete (Disable Restaurant)**: Added `isActive` field to the `Restaurant` model. Managers can disable a restaurant from Settings > Danger Zone. Disabled restaurants are filtered out at login and hidden from all users. `PUT /api/restaurants/:id/disable` endpoint added.
- **Switch Business Navigation**: Added a "Switch Business" button in the floating navigation menu for managers, allowing quick navigation back to `/select-restaurant`.
- **White-Label UI Options**: Replaced global Yapakit branding in the `TenantLayout` navbar and the `RestaurantSelector` list with the restaurant's uploaded `logoUrl` (using a flat `Building2`/`Store` icon fallback if no logo is present). Added a "Powered by Yapakit" mini-footer to the tenant views.
- **Phase A User Management**: Deployed OTP-based Password Recovery for Managers via `/forgot-password`, routing a 6-digit HTML email securely through Brevo. Expanded the Tenant Staff Management grid (`/staff`) aligning with strictly flat UX and PIN terminologies. Also fortified the Superadmin Global Dashboard with 4 distinct analytical cards and a Top 5 Recent Restaurants tabular display.
- **Manager Analytics Dashboard**: Revamped the manager dashboard (`/dashboard`) using `recharts` for visual data representation. Features dynamic Date Range filtering, Top level KPI flat cards (Revenue, Orders, AOV), an interactive Sales Trend Bar Chart grouped by day, and a Top Selling Items tabular tracker. Powered by 3 high-performance MongoDB aggregation pipelines (`/api/reports/dashboard`).
- **Custom Payment Methods**: Restaurants can now configure dynamic payment methods (e.g., Nequi, DeUna, Zelle) via Settings. Includes `isExactAmountOnly` toggle to control whether the cashier can input an overpayment amount to calculate change.
- **Payments History Dashboard**: New centralized ledger for Cashiers/Managers (`/payments`). Displays key metrics (Total Collected, Cash vs Card), filters by date/method, and supports both Table and Card view modes.
- **Void Payments**: Cashiers can now void an accidental payment directly from the History dashboard. Auto-recalculates order balances and reverses the order to "Served" if it was previously marked "Completed".
- **Reprint Receipts**: Added the ability to fetch any historical order and trigger a thermal receipt re-print (`ReprintModal.tsx`) directly from the Payments History page.
- **Checkout Quick Cash**: The `CheckoutModal` now dynamically generates smart "Quick Cash" buttons (e.g., Exact, $10, $20, $50, $100) based on the remaining balance due if the selected method supports calculating change.
- **Takeaway Fees**: Configurable `defaultTakeawayFee` in Restaurant settings, auto-applied when waiter selects Takeaway order type, editable inline in the POS Cart.
- **Customer Data Capture**: New `CustomerDataModal` to attach customer name, phone, and optional invoice fields (Tax ID, Address, Email) to orders. Embedded `customer` sub-document in Order model.
- **Staff Menu Responsiveness**: Refactored `WaiterPosPage` and `PosMenuGrid` to a "Mobile-First Speed Menu". Desktop now uses a 3-column layout (Categories Sidebar, Dense Item List, Cart Sidebar). Mobile uses a horizontally scrollable category top bar and a fixed sticky "View Cart" bottom bar.
- **Dense Menu Item List (Staff)**: Converted the staff menu grid into a dense tabular list with flat alternating row colors and touch-friendly "ADD +" buttons, removing images for absolute speed in operations.
- **Pre-Tax Manual Discounts**: Added ability for Cashiers and Waiters to apply a manual fixed-amount discount. Recalculates tax and totals accordingly before processing payment.
- **Cashier Edit Order**: Added an "Edit Order" button to the Checkout Modal, allowing cashiers to quickly load the active order into their local cart and jump to the Staff Menu to modify items.
- **Customer Model**: New `Customer.ts` Mongoose model for future CRM/invoicing features.
- **PosCartItem Component**: Extracted cart item row with always-visible, mobile-first touch controls (+/−/delete). Removed hover-dependent interactions.
- **Order Modification**: Waiters can edit active orders (sent/preparing). Loads order back into POS cart via `loadOrder()`, sends `PUT /api/orders/:id` with incremented `revision` counter. KDS receives `order:modified` socket event in real-time.
- **Order Cancellation**: Waiters can cancel active orders with a reason via `PUT /api/orders/:id/cancel`. KDS receives `order:cancelled` socket event and removes the ticket instantly.
- **KDS Revision Badge**: Modified orders display a prominent solid red `⚠️ URGENT: MODIFIED (Rev: N)` banner and `border-4 border-red-600` on the ticket card.
- **POS Edit Mode**: Cart shows yellow `bg-yellow-400` top banner when editing. UPDATE KITCHEN button in green. Full-width red Cancel Edit button.
- **Cloudinary Image Uploads**: Backend integration with Cloudinary (`POST /api/upload`). Reusable `ImageUpload.tsx` component with file validation (JPG/PNG/WebP, 5MB max), preview, and remove. Server packages: `cloudinary`, `multer`, `multer-storage-cloudinary`.
- **Restaurant Branding**: Added `logoUrl` and `heroImageUrl` to Restaurant settings schema. New "Branding & Images" section in SettingsPage for uploading logo and hero image.
- **Menu Item Photos**: Added `ImageUpload` to `MenuItemFormModal.tsx` for dish photo uploads. Fixed `MenuItem` interface to use `imageUrl`.
- **Public Landing Page** (`/p/:slug`): Unauthenticated restaurant page showing logo, name, hero image, address, phone, "View Menu" and "Book a Table (Coming Soon)" buttons.
- **Public QR Menu** (`/p/:slug/menu`): Read-only, mobile-first menu with category tabs, item thumbnails, descriptions, and prices. No cart or hover effects.
- **Public API**: New `GET /api/public/:slug` and `GET /api/public/:slug/menu` endpoints (no auth).
- **Reservations (Phase 1)**: Added `Reservation.ts` schema and updated `Restaurant.ts` with `reservationDuration` and `operatingHours` (weekly schedule).
- **Staff Reservations UI**: New `StaffReservationsPage.tsx` interface to view, approve, or reject bookings. Managers can optionally assign tables from the floor plan during approval.
- **Reservation Emails**: Built an `emailService` using `nodemailer` and Brevo. Customers receive automated HTML emails when their reservation is approved or declined.
- **Settings Page Updates**: Added "Operating Hours & Reservations" card to manage the weekly schedule (open/close times per day) and default reservation duration (e.g. 90 mins).
- **Public Reservation Wizard**: Built a flat-color multi-step UI (`ReservationWizard.tsx`) on the public landing page for customers to submit bookings without authenticating.
- **Availability Algorithm**: Added `GET /api/public/:slug/availability` that checks `operatingHours` and filters timeslots dynamically based on the number of existing reservations vs. total tables.
- **Blind Customer Merge**: Added `POST /api/public/:slug/reservations`. During booking, the system creates/updates customer records and links the `Reservation` seamlessly.
- **Split Checks (Cashier)**: Added support for partial payments. The Cashier Checkout Modal now tracks `totalPaid` vs `balanceDue`. Orders auto-complete seamlessly when balance reaches zero.
- **Split by Item / Per-Payment Invoicing**: Implemented advanced itemized split logic. Cashier can toggle to "Split by Item" to select independent items using a Stepper component. Customer invoicing data can be optionally attached per-payment.
- **Payment History on Receipts**: `ReceiptTicket.tsx` now prints all individual payments (e.g. "Cash: $10", "Card: $15") and calculates the final balance due logic, or filters down to ONLY the active split for itemized invoicing.
- **Cashier: Itemized Checkout View**: Pay Full Balance tab now shows a complete order breakdown (items with modifiers/notes, subtotal, discount, tax, takeaway/delivery fees, paid amounts, and balance due) instead of just the total.
- **Cashier: View Order Details**: Added an 👁 button on each order card that opens a detailed modal showing items, modifiers, notes, customer info, and financial summary — so cashiers can review the full order before checkout.
- **Cashier: Split Quantity Context**: Split by Item stepper now shows "X of Y remaining" per item to prevent selection errors.

### Fixed

- **Edit Order Flow**: Fixed `loadOrder` to also set `selectedTableId` (not just `tableName`), enabling proper dine-in order editing with table context preserved.
- **Touch Targets**: Enlarged Edit/Cancel buttons on WaiterOrdersPage (`py-3.5`, `text-sm`) for tablet-friendly interaction.

### Changed

- **Style Refactor**: Removed all gradients (`bg-gradient-to`), opacities (`/50`), and glassmorphism (`backdrop-blur`) from Login, AlertManager, POS Cart, KDS OrderTicket. All styles now use flat solid colors.
- **POS/Menu Consolidation (Waiter)**: Removed the redundant `/pos` route and navbar tab. The `/menu` route now serves as the single order-taking interface for Waiters (via `MenuRoute`), while Managers see the Menu CRUD editor on the same route.
- **POS Menu Item Images**: Fixed `PosMenuGrid` to display Cloudinary `imageUrl` when available, with `UtensilsCrossed` icon as fallback (matching `PublicMenuPage` pattern).
- **Cart Item Redesign**: Replaced vertical +/- layout with a compact horizontal action bar `[- qty +] [Note 📝] [🗑]`. Added inline note editing with save/cancel directly on each cart item.
- **PosCart.tsx**: Integrated `PosCartItem`, Customer badge, Takeaway fee row, and flat color buttons.
- **SettingsPage.tsx**: Added "Default Takeaway Fee" input and "Branding & Images" card with ImageUpload components.

## [1.0.0-alpha.1] - 2026-03-04

### Added

- **Order Configurations & Final Pricing Adjustments**:
  - Expanded `Restaurant` backend schema and `SettingsPage.tsx` UI to configure `enabledOrderTypes` (Dine-in, Takeaway, Delivery) and a `defaultDeliveryFee`.
  - Refactored `PosCart.tsx` to automatically disable unselected order types and natively inject the `deliveryFee` directly into the `cartStore.ts` calculating pipeline (Gross -> Net -> Tax -> Total).
- **Mobile-First UX Optimization**:
  - Redesigned `TenantLayout.tsx` moving the navigation system from a hamburger menu into a smoothly scrolling, horizontally-snapping touch navigation bar.
  - Added smart filtering to dynamically hide the POS "Floor Plan" tab if the Restaurant disables the "Dine-in" option.

- **Restaurant Settings (Manager)**:
  - Extended the backend `Restaurant` model with `address` and `phone` fields (useful for receipts).
  - Built `PUT /api/restaurants/settings` to allow updating business info (`name`, `address`, `phone`) and financial settings (`taxRate`, `currency`).
  - Created `useRestaurantDetails` and `useUpdateSettings` custom TanStack Query hooks in the frontend.
  - Built `<SettingsPage />` UI with sections for "General Information" and "Financial & Regional".
  - Updating the `taxRate` or `currency` now live-updates the POS `cartStore` state for seamless recalculations without a reload.
  - Mapped to `/:slug/settings` in the Manager's sidebar/navbar.

- Initial Monorepo project structure setup.
- Developed the foundational Backend skeleton (Node.js, Express, TypeScript).
- Integrated **Socket.io** hub with tenant-specific room isolation logic for real-time updates.
- Implemented core **Mongoose models** (`User`, `Restaurant`, `Membership`) with strict TypeScript interfaces.
- Implemented **JWT Authentication** and **Multi-Tenant Context Middleware** (`requireAuth`, `requireTenantContext`).
- Implemented **Auth API** (`POST /api/auth/register`, `POST /api/auth/login`) with bcrypt password hashing and JWT issuance.
- Implemented **Restaurant API** (`POST /api/restaurants`) with auto-manager membership assignment.
- Implemented **Order Management System** (`Order` model, `POST /api/orders`, `PATCH /api/orders/:id/status`, `GET /api/orders`) with real-time Socket.io event emission scoped by tenant room.
- Implemented **Operational Core Models** (`Zone`, `Table`, `Category`, `MenuItem`) with compound indexes for tenant-scoped queries.
- Implemented **Menu API** (`GET/POST /api/menu/categories`, `GET/POST /api/menu/items`) with tenant-scoped CRUD.
- Implemented **Zone & Table API** (`GET/POST /api/zones`, `GET/POST /api/zones/tables`) with tenant-scoped CRUD.
- Established the **Core Documentation** suite in `/docs`:
  - `YAPAKIT_CORE_ARCHITECTURE.md`
  - `TECH_STACK_AND_STRUCTURE.md`
  - `DATABASE_SCHEMAS.md`
  - `OPERATIONAL_SCHEMAS.md`
- Added project-level `README.md` and centralized `CHANGELOG.md`.
- Scaffolded **Frontend MVP** (`/client`): Vite, React 18, TypeScript, Tailwind CSS, TanStack Query, Zustand, Axios with JWT/tenant interceptors.
- Implemented **Frontend Authentication Flow**: Zustand persisted auth store, login API, `LoginForm` with TanStack Query mutation, `ProtectedRoute` wrapper, and `LoginPage`.
- Implemented **Seeding Strategy**: Tenant auto-seeder (Cold Start Prevention) and development CLI seeder (`npm run seed`) with demo data.
- Implemented **POS App Layout** (`AppLayout`): navbar with brand, restaurant name, user info, and logout. **Table Selector** with zone tabs, status-colored responsive grid, and TanStack Query floor plan hook.
- Implemented **Role-Based Routing**: Smart `ProtectedRoute` with auto-context selection, `RestaurantSelector` for multi-membership users, mobile-first `TenantLayout` with role-scoped navigation, and dark-themed `SuperadminLayout`.
- Implemented **Menu Management Feature**: Created `MenuManagerPage` containing a `CategoryList` sidebar, a dynamic grid of `MenuItemCard`s, and an `AddMenuItemModal`. Integrated TanStack Query hooks for precise caching and mutations.
- Enhanced **Menu Management Feature**: Added category color themes, inline category editing/reordering/deleting with a Three-Dots Dropdown, and modified `AddMenuItemModal` to support updating existing menu items.
- Fixed **App Navigation**: Restored the global Top Navbar for Kitchen layouts, prioritizing user accessibility. Resolved a bug with Menu Item Filtering due to Mongoose reference population typings.
- Implemented **Manager Dashboard**: Created a basic `ManagerDashboard` view displaying key performance indicators (Revenue, Orders, Staff details) and placeholder analytics sections, resolving the issue where `/dashboard` incorrectly showed the Floor Plan.
- Implemented **Item Modifiers & Waiter POS**: Upgraded `MenuItem` schema with `modifiers` and `displayOrder`. Built the POS Interface including `PosMenuGrid`, `PosCart` with dynamic modifier pricing, `ModifierModal` for item customization, and `ViewToggle` for layout switching. Integrated everything into `WaiterPosPage` and wired it into `App.tsx` routing.
- Enhanced **Manager Menu CRUD**: Integrated `@dnd-kit` to support Drag & Drop bulk reordering of menu items (`MenuItemSortable` and `useReorderMenuItems`), including List/Grid view toggles. Refactored `AddMenuItemModal` into a comprehensive `MenuItemFormModal` with an interactive, dynamic form specifically designed to construct complex array modifier groups, price modifiers, and required widget choices.
- Implemented **Role-Based Routing & POS Enhancements**: Restructured `App.tsx` routes to enforce strict Role-Based Access Control (RBAC), mapping `/menu` dynamic logic for Managers vs Waiters. Upgraded the Backend with a Restaurant Settings endpoint and enhanced the POS `cartStore` to dynamically fetch and compute scientific tax rates and multi-currency formatting using `Intl.NumberFormat`.
- Implemented **Real-Time Kitchen Display System (KDS)**: Integrated `socket.io-client` with a custom `useSocket` hook for tenant-isolated room connectivity. Created the `OrderTicket` UI component and the full-screen dark-themed `KitchenKdsPage`. Hooked the Waiter POS Cart's "SEND TO KITCHEN" button to a new `useCreateOrder` mutation, which dynamically populates the kitchen dashboard without full page reloads via optimistic caching updates.
- **Cashier Dashboard & Atomic Order Numbering**: Built the `CashierDashboard` for managing "Ready" and "Served" orders. Implemented an atomic `Counter` service to guarantee sequential order numbers (e.g., #001) per tenant. Added "Process Payment & Close" workflow.
- **Offline Sync Strategy**: Documented the 3-layer PWA/offline architecture in `docs/OFFLINE_SYNC_STRATEGY.md`.
- **Manager Backoffice**:
  - Built `GET /api/reports/daily` aggregation endpoint computing today's sales, completed orders, and active orders.
  - Built `GET/POST /api/staff` endpoints for listing and adding restaurant staff with automatic user creation.
  - Replaced hardcoded `ManagerDashboard` with live metric cards powered by `useDailyStats()` and `useRestaurantSettings()`.
  - Built `StaffManagementPage` with a data table, role badges, status indicators, and a full "Add Staff Member" modal form.
- **Promotions Engine & Shift Management**:
  - Created `Promotion` model with compound unique index (`restaurantId` + `code`) and date-range validation.
  - Built `GET /api/promotions/validate/:code` endpoint with active status, date range, and existence checks.
  - Created `Shift` model to track cashier shift lifecycle (open/close, starting/expected/actual cash).
  - Built `POST /api/shifts/open` (prevents duplicate open shifts) and `GET /api/shifts/current` endpoints.
  - Upgraded `cartStore.ts` with full discount calculation: `grossSubtotal → discountAmount → netSubtotal → taxAmount → total`.
  - Enhanced `PosCart.tsx` with promo code input, validation feedback, applied discount display with remove button, and updated totals breakdown.
  - Added `discountCode` and `discountAmount` fields to `Order` model and frontend interfaces.
  - Updated `seedDev.ts` to include the `Promotion` model and seeded a demo 'VERANO20' (20% discount) code.
- **Backend Structural Infrastructure**:
  - Added `sales` to `systemRole` in `User` model.
  - Added `subscriptionStatus` and `subscriptionExpiresAt` to `Restaurant` model.
  - Upgraded `Order` model with `orderType` and conditional logic making `tableId`/`tableName` required only for 'dine-in'.
  - Refactored `requireTenantContext` middleware to support **Role Impersonation** for global roles (Superadmin, Support, Sales), bypassing membership checks via `x-restaurant-id` header.
  - Completely rewrote `seedDev.ts` to generate a complex 3-restaurant multi-tenant environment with cross-tenant managers.
  - Created `docs/DEVELOPER_GUIDE.md` with system overview and test account summary.
- **UI Consistency & UX**:
  - Created shared `TopBar.tsx` component for consistent headers.
  - Integrated `TopBar` in `RestaurantSelector.tsx` to provide a logout mechanism for users with no restaurant context.
  - Refactored `AppLayout.tsx` to use the shared `TopBar`.
- **Floor Plan CRUD, Order Types & Waiter Orders**:
  - Built `FloorPlanManagerPage.tsx` with Zone list (create inline) and Table grid (create inline with capacity) for Managers.
  - Added `useCreateZone` and `useCreateTable` mutations to `getFloorPlan.ts`.
  - Upgraded `cartStore.ts` with `orderType` state ('dine-in', 'takeaway', 'delivery') and `setOrderType` action that auto-clears table for non-dine-in.
  - Enhanced `PosCart.tsx` with a segmented Order Type selector (Dine-In / Takeaway / Delivery) and conditional table validation for the "SEND TO KITCHEN" button.
  - Updated `orderApi.ts` with `orderType` in `OrderCreatePayload` and `Order` interfaces.
  - Built `WaiterOrdersPage.tsx` with color-coded active order cards showing order number, type, table, status, items summary, time, and total.
  - Updated `App.tsx` routing: `/floor-plan` → `FloorPlanManagerPage`, `/orders` → `WaiterOrdersPage`.
- **Floor Plan Full CRUD & Bug Fix**:
  - Fixed table display bug caused by `populate('zoneId')` in backend `getTables` (zoneId was an object, not a string).
  - Added backend endpoints: `PUT /api/zones/:id`, `DELETE /api/zones/:id` (cascade deletes tables), `PUT /api/zones/tables/:id`, `DELETE /api/zones/tables/:id`.
  - Restricted Zone/Table create/update/delete to `manager` role only.
  - Added 3-dot context menus (Edit / Delete) on both Zone cards and Table cards in `FloorPlanManagerPage`.
  - Inline forms now support both Create and Edit modes for zones and tables.
  - Added all CRUD mutations (`useUpdateZone`, `useDeleteZone`, `useUpdateTable`, `useDeleteTable`) to `getFloorPlan.ts`.
- **Zone & Table State Management**:
  - Added `isActive` boolean to `Zone` model (default: true) with Activate/Deactivate toggle in zone context menu.
  - Inactive zones appear dimmed with an "Inactive" badge.
  - Table edit form includes a 4-button status selector: Available, Occupied, Reserved, Out of Service.
  - Status changes are persisted via `PUT /api/zones/tables/:id`.
- **POS Table Picker**:
  - Created `TablePickerModal.tsx` — compact modal grouped by zone with color-coded availability (available, occupied, reserved, out of service).
  - POS Cart header now shows a clickable "📍 Select a table" link (dine-in only) that opens the table picker.
  - POS Cart header now shows a clickable "📍 Select a table" link (dine-in only) that opens the table picker.
  - After selection, shows "Table A1 (change)" with ability to switch.
  - Added `selectedTableName` to `cartStore` for display purposes.
- **Global Admin Portal & Impersonation**:
  - Implemented backend Admin API with `getAllRestaurants` and `getGlobalStats` in `adminController.ts`.
  - Added strict Global Role check middleware (`requireGlobalRole`).
  - Created Frontend TanStack Query hooks in `adminApi.ts`.
  - Built `GlobalDashboardPage.tsx` with top-level SaaS metrics.
  - Built `RestaurantsListPage.tsx` featuring a comprehensive Tenant DataTable and a "Enter as Manager" action.
  - Implemented Impersonation logic via `setRestaurantContext(restaurant._id)` and React Router redirection.
  - Upgraded `ProtectedRoute` to smartly bypass context checks and redirect global roles (`superadmin`, `support`, `sales`) straight to `/admin` upon login.
- **Cashier Shift Management**:
  - Implemented `closeShift` backend logic in `shiftController.ts` which calculates `expectedCash` from processed orders.
  - Created TanStack Query hooks `useCurrentShift`, `useOpenShift`, and `useCloseShift` in `shiftApi.ts`.
  - Built `OpenShiftCard.tsx` logic to force cashiers to open a register before seeing orders.
  - Built `CloseShiftModal.tsx` logic to finalize the drawer count.
  - Re-designed `CashierDashboard.tsx` to conditionally render the shift requirements versus the active orders layout.
- **Thermal Receipt Printing**:
  - Integrated `react-to-print` for Cashier checkout flow.
  - Built `<ReceiptTicket />` optimized for 80mm POS thermal printers (font-mono, strict margins, clean item breakdowns).
  - Built `<CheckoutModal />` that intercepts the payment confirmation, processes the order, and immediately offers a "Print Receipt" action.
  - Updated `index.css` to include global `@media print` rules hiding the browser UI and centering the 80mm document.
- **KDS (Kitchen Display System) Overhaul**:
  - Fixed wrong "Walk-in" label — now shows correct order type (Dine-in/Table, Takeaway, Delivery) with icon badges.
  - Added Cards ↔ Table view toggle for different workflow preferences.
  - Added status filter tabs: New | Preparing | Completed (last 24h via new `GET /api/orders/completed` endpoint).
  - Built `OrderDetailModal` — clicking a card header opens a full-detail modal with clean layout and action buttons.
  - Built `OrderTableView` — responsive table/list view with inline status actions.
  - Implemented Web Audio API notification chime for new orders with persistent banner until staff interaction.
  - Added sound on/off toggle in the KDS header.
- **Offline Resilience Strategy (PWA)**:
  - Configured `vite-plugin-pwa` with `autoUpdate`, service worker, and workbox caching for static assets and Google Fonts.
  - Built `QueryProvider.tsx` with IndexedDB persister (`idb-keyval`) for TanStack Query cache survival across refreshes and network drops.
  - Set `networkMode: 'offlineFirst'` globally for both queries and mutations, with 3 mutation retries.
  - Created `NetworkBadge.tsx` component showing live connectivity status (Offline → queued, Syncing → pending mutations, Online → green dot).
  - Integrated `NetworkBadge` into the `TenantLayout` top navbar for all tenant roles.

### Fixed

- **Auth Routing Flow**:
  - `LoginForm.tsx`: Fixed race conditions on sign-in. Global roles now route to `/admin` and single-membership users auto-route to their dashboard immediately.
  - `ProtectedRoute.tsx`: Redesigned as a strict traffic controller. Now accepts `allowedSystemRoles` and performs precise fallback routing for context-less users.
  - `App.tsx`: Added a `<RootRedirect>` component for `/` to smartly route authenticated users away from the `LandingPage` and straight into their working environment (`/admin` or `/:slug`).
- **Order Creation**:
  - Fixed 500 Internal Server Error in `orderController.ts` by ensuring `orderType` and `tableId` are correctly persisted to the database, preventing Mongoose validation failures for dine-in orders.
- Resolved "blank page" issue during login/auto-selection by adding a loading state to `ProtectedRoute`.
- Fixed root path (`/`) navigation by adding a professional Landing Page.
- Implemented login redirection: authenticated users are now automatically redirected away from `/login` to prevent session confusion.
- Resolved TypeScript compilation error in `requireAuth` and `requireTenantContext` by correctly augmenting `express-serve-static-core` Request interface.
- **Fixed Real-Time Connectivity**: Resolved "Disconnected" state in KDS by fixing the Socket.io CORS conflict with `withCredentials`. Refined frontend `SOCKET_URL` logic to correctly handle environmental URL variations and improved the `useSocket` hook for persistent room joining.

---

_Internal Release - Foundational Setup Phase_
