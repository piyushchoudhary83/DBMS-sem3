# Inventory Management System

The frontend was started from a friend's project and redesigned; the inventory database and backend were built separately.

A full-stack inventory management tool featuring live stock tracking, automated low-stock threshold detection, atomic stock movements, and an audit trail.

---

## Features

- **Dashboard & Analytics:** Overview metrics tracking total products, total stock units, low-stock alerts count, and 30-day inbound/outbound movement volumes.
- **Stock Movement Timeline:** Visualizes 30-day stock inflow (bars) vs. outflow (trend line) aggregated from actual movement history.
- **Low-Stock Detection:** Real-time table identifying products at or below configured reorder levels with automatic shortfall computation.
- **Product Catalog Management:** Full CRUD operations (Add, Edit, Delete with confirmation) across categories (Electronics, Stationery, Grocery).
- **Atomic Stock In / Out Movements:** Stock replenishment and dispatch with transaction boundaries (`BEGIN` / `COMMIT` / `ROLLBACK`) preventing negative balances.
- **Movement History:** Complete audit trail of all historical stock movements with timestamps and product associations.

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts
- **Backend:** Node.js, Express, `pg` (node-postgres), CORS, dotenv
- **Database:** PostgreSQL (`inventory_db`)

---

## Database Tables

- **`categories`**: Product categories (`id`, `name`). Pre-seeded with Electronics, Stationery, Grocery.
- **`products`**: Inventory items (`id`, `name`, `category_id`, `price`, `quantity`, `reorder_level`).
- **`stock_movements`**: Transaction log (`id`, `product_id`, `type`, `quantity`, `created_at`). Type is restricted to `IN` or `OUT`.

---

## API Routes

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health check |
| `GET` | `/products` | List all products with category names |
| `POST` | `/products` | Add a new product (`name`, `category_id`, `price`, `reorder_level`) |
| `PUT` | `/products/:id` | Update product details |
| `DELETE`| `/products/:id` | Remove a product |
| `POST` | `/stock` | Record stock movement (`product_id`, `type`, `quantity`) |
| `GET` | `/products/low-stock` | List products with quantity $\le$ reorder level |
| `GET` | `/history` | Chronological stock movement log |

---

## Setup & Installation

### 1. Initialize PostgreSQL Database
Ensure PostgreSQL is running locally, then create the database and execute the schema:
```bash
createdb inventory_db
psql -d inventory_db -f inventory-backend/schema.sql
```

### 2. Configure Backend Environment
Create `inventory-backend/.env` with your database credentials:
```env
PORT=4000
DATABASE_URL=postgres://localhost:5432/inventory_db
```

### 3. Start Backend Server
```bash
cd inventory-backend
node server.js
```
The server will start listening on port 4000.

### 4. Start Frontend
In a separate terminal:
```bash
cd warehouse-ui
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
