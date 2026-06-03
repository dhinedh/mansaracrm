# B2B Distributor CRM, Inventory & Billing System (MongoDB Edition)

A complete scalable B2B Distributor CRM + Inventory + Billing + Dealer Management System built with a Node.js + Express.js backend, Prisma ORM, MongoDB database, and React + Vite frontend styled with Tailwind CSS.

---

## Technical Highlights

- **Robust Stock Transfer Engine:** Fully safe stock movements between central warehouse (`CompanyInventory`) and regional distributors (`DealerInventory`) via transaction dispatches (`IN_TRANSIT` & `DELIVERED`).
- **GST Invoice Constructor:** Auto-incrementing tax bill generators including margins override, GST calculations (CGST/SGST/IGST), store specific guidelines.
- **A4 PDF Invoicing:** High-fidelity print-ready dynamic A4 PDF invoice generator utilizing server-side `Puppeteer`.
- **Zustand State Engine:** Offline-resilient JWT local sessions injection & real-time cart compiler.
- **Security Protocols:** bcrypt password hashing, input validations, express-rate-limit caps, and Helmet.js integrations.

---

## Setup & Running Guide

### Prerequisite
Make sure you have [Node.js (v18+)](https://nodejs.org/) installed and [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

---

### Step 1: Run MongoDB via Docker Compose
In your terminal, navigate to the `backend` folder and boot up the database:
```bash
cd backend
docker-compose up -d
```
*This starts a local MongoDB replica set instance at port `27017` with replica set name `rs0`, which is required for Prisma multi-document transactions.*

---

### Step 2: Install Backend & Initialize Database
Install NPM dependencies and push schemas/run seeding:
```bash
# In the backend/ folder
npm install
npx prisma db push
npx prisma db seed
```
*This will sync the Prisma schemas with MongoDB, deploy indexes, generate the Prisma Client, and seed default test credentials:*
- **Super Admin:** `admin@mansarafoods.com` / `Admin@123`
- **Dealer Partner:** `dealer@test.com` / `Dealer@123`

Start backend server:
```bash
npm run dev
```
*Server boots on [http://localhost:5000](http://localhost:5000).*

---

### Step 3: Install & Start Frontend
Open a new terminal window, navigate to the `frontend` folder, install packages and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
*Frontend boots on [http://localhost:5173](http://localhost:5173).*

---

## Project Structure

```
crm/
├── backend/                   # Node.js + Express API server
│   ├── prisma/
│   │   ├── schema.prisma      # DB Schema definition (MongoDB)
│   │   └── seed.js            # Initial Admin & sample catalog data
│   ├── src/
│   │   ├── config/            # DB client singleton
│   │   ├── middleware/        # JWT auth, role validation, validators
│   │   ├── modules/           # Modulized business modules (Auth, Billing, etc.)
│   │   └── app.js             # Main server app
│   └── docker-compose.yml     # Local MongoDB replica set container mapping
│
└── frontend/                  # React.js + Vite app
    ├── src/
    │   ├── layouts/           # Admin/Dealer sidebar panels
    │   ├── pages/             # Authentications, catalog grid, invoices history, cart builders
    │   ├── store/             # Zustand stores (Auth & Cart)
    │   └── main.jsx
    └── index.html
```
