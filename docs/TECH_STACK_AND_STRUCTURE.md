# Yapakit - Tech Stack & Repository Structure

Yapakit is built from the ground up as a modern, high-performance POS & Restaurant OS. Starting from scratch with zero technical debt, the project prioritizes developer velocity, type safety, and real-time responsiveness.

---

## 1. Official Technology Stack

| Layer        | Technologies                                                                                                                                                                   |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | **React 18**, **Vite** (Build Tool), **TypeScript**, **Tailwind CSS** (Styling), **TanStack Query** (Server State), **Zustand** (UI State), **@dnd-kit** (Touch/Draggable UX). |
| **Backend**  | **Node.js**, **Express.js**, **TypeScript**, **Socket.io** (Real-time Hub).                                                                                                    |
| **Database** | **MongoDB** with **Mongoose** (Multi-tenant modeling & ODM).                                                                                                                   |
| **Tooling**  | **ESLint**, **Prettier**, **Husky** (Pre-commit hooks).                                                                                                                        |

---

## 2. Monorepo Directory Structure

Yapakit uses a logical separation between the client and server to enable independent scaling and deployment while maintaining a unified developer experience.

```text
yapakit/
├── client/                 # React SPA (Vite + TypeScript)
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI components (Buttons, Inputs, Modals)
│       ├── features/       # Domain-specific logic (Orders, Menu, Tables)
│       ├── hooks/          # Custom React hooks
│       ├── store/          # Zustand store definitions (UI state)
│       ├── services/       # API client & React Query definitions
│       ├── types/          # Shared TypeScript interfaces
│       └── utils/          # Helper functions & formatters
├── server/                 # Express API (Node.js + TypeScript)
│   └── src/
│       ├── controllers/    # Request handlers & logic orchestration
│       ├── models/         # Mongoose schemas & Multi-tenant logic
│       ├── routes/         # API endpoint definitions
│       ├── sockets/        # Socket.io event handlers & Room management
│       ├── middleware/     # Auth, RBAC, & Validation layers
│       ├── config/         # Environment & DB configuration
│       └── services/       # Business logic & infrastructure integrations
├── docs/                   # Architecture & technical documentation
├── package.json            # Root configuration
└── README.md
```

---

## 3. State Management Strategy (Frontend)

To maintain a clean and predictable data flow, we maintain strict boundaries between different types of state:

### TanStack Query (Server State)

- **Responsibility:** Strictly used for asynchronous server state, including API fetching, caching, synchronization, and error handling.
- **Usage:** All data originating from the MongoDB database (e.g., Menu items, active orders, restaurant settings) must flow through TanStack Query.

### Zustand (Client/UI State)

- **Responsibility:** Strictly used for synchronous global UI state.
- **Usage:** Managing active modals, sidebar toggle states, current selected table context, and local cart items before they are persisted to the server.

### Socket.io Client (Real-time Bridge)

- **Responsibility:** Acts purely as an event listener.
- **Usage:** When a real-time event is received (e.g., `ORDER_READY`), the socket listener triggers a TanStack Query cache invalidation (refetching data) or updates a specific UI state in Zustand.

---

**End of Document**  
_Company Confidential - Kodffe / Yapakit Technology Group_
