# Yapakit - Modern POS & Restaurant OS

Yapakit is a **Mobile-First, Multi-Tenant SaaS platform** designed for modern restaurant management. It streamlines the entire operational flow: **Waiter (ORDER) -> Kitchen (COORDINATION) -> Cashier (CHECKOUT)**.

---

## 🚀 Key Features

- **Multi-Tenant Hub:** Isolated database logic for multiple restaurants on a single platform.
- **Waiter POS:** Intuitive interface for tableside or counter ordering.
- **Real-time KDS (Kitchen Display System):** Instant order synchronization via Socket.io.
- **Support Ticket System:** Integrated communication between restaurants and platform support.
- **Subscription Management:** Automated trial flows and tiered feature flags for monetization.
- **Global Admin Portal:** Specialized Dashboards for Superadmins, Sales Agents, and Support Staff.
- **Responsive Branding:** Dynamic theming that replaces the platform logo with the restaurant's own logo.

---

## 🛠 Prerequisites

- **Node.js:** v20.x or higher.
- **MongoDB:** A running instance (Local or Atlas).
- **Package Manager:** npm (v10+).

---

## ⚡ Quick Start

### 1. Backend (Server) Setup
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2. Frontend (Client) Setup
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### 3. Demo Data (Recommended)
In the `server` directory, run:
```bash
npm run seed
```
This will wipe the temporary database and create the demo accounts listed in the [Developer Guide](docs/DEVELOPER_GUIDE.md).

---

## ☁️ External Services

Yapakit integrates with premium services for core functionalities:
- **Cloudinary:** Image hosting and dynamic transformations for menu items and logos.
- **Brevo:** Transactional SMTP for OTPs, registration, and reservation alerts.

Refer to [External Services Setup](docs/EXTERNAL_SERVICES.md) for more info.

---

## 📚 Documentation

Explore our detailed specialized documentation:

- 🏗️ [Core Architecture](docs/YAPAKIT_CORE_ARCHITECTURE.md): Multi-tenant model and real-time flows.
- 📦 [Tech Stack & Structure](docs/TECH_STACK_AND_STRUCTURE.md): Folder hierarchy and libraries.
- 🗄️ [Database Schemas](docs/DATABASE_SCHEMAS.md): Mongoose models and data design.
- 👨‍💻 [Developer Guide](docs/DEVELOPER_GUIDE.md): Seeding, test accounts, and role logic.
- 🤝 [Contributing Guide](docs/CONTRIBUTING.md): Standards for English-first development.

---

_Company Confidential - Kodffe / Yapakit Technology Group_
