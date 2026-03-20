# Yapakit: Offline Sync Strategy

As a Mobile-First Point of Sale (POS) and Restaurant OS, Yapakit is designed to operate seamlessly even in environments with unstable internet connections (e.g., cellars, crowded patios, or rural areas).

Our offline capability strategy is built upon a 3-layer architecture to guarantee data integrity, application availability, and a frictionless user experience.

## Layer 1: Application Shell Cache (Vite PWA)

**Primary Goal:** Ensure the application always loads and UI remains responsive, regardless of network status.

- **Implementation:** We utilize `vite-plugin-pwa` to register a Service Worker.
- **Mechanism:** The Service Worker aggressively caches the App Shell (HTML, CSS, JS bundles) and static assets (fonts, icons, logos).
- **Effect:** When a waiter opens the Yapakit app offline, it bypasses the network and loads instantly from the browser's Cache Storage. Users will never see the "No Internet Connection" dinosaur game.

## Layer 2: Server State & Mutation Queue (TanStack Query)

**Primary Goal:** Enable waiters to continue taking orders offline and guarantee delivery once back online.

- **Implementation:** We integrate `@tanstack/react-query-persist-client` combined with an `IndexedDB` adapter (e.g., `idb-keyval`).
- **Mechanism (Reads - Caching):** `TanStack Query` caches all `GET` responses (Menu, Floor Plan, Active Orders). If offline, queries instantly return the `stale` cached data, allowing the restaurant to keep functioning using the last known state.
- **Mechanism (Writes - Mutating):** When a waiter hits "Send to Kitchen", the `useCreateOrder` mutation is intercepted. If offline, the mutation is pushed into a **Mutation Queue** stored in IndexedDB.
- **Recovery:** Upon detecting a `window.addEventListener('online')` event, TanStack Query automatically replays the queued mutations to the backend. Optimistic UI updates allow the waiter to see the order as "Sent" locally while it waits in the queue.

## Layer 3: Ephemeral Client State (Zustand)

**Primary Goal:** Prevent data loss of active, unsubmitted work (e.g., a complex cart being built).

- **Implementation:** We use Zustand with the `persist` middleware, saving state to `localStorage`.
- **Mechanism:** The `cartStore` (current order items, selected variants, subtotal) is serialized and saved on every change.
- **Effect:** If a waiter is building a 20-item order, loses connection, and their device battery dies, they can swap devices (or reboot). Upon reopening Yapakit, Zustand reinflates the state from `localStorage`, recovering the cart exactly where they left off.

## Conflict Resolution Strategy

Because Yapakit operates as a cohesive Restaurant OS, we favor "Last Write Wins" (LWW) at the document level for simple updates (like changing an order status). For complex arrays (like Menu Modifiers), the backend employs targeted `$push` and `$pull` MongoDB operators to prevent race conditions from concurrent offline devices syncing simultaneously.
