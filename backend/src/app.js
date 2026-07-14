// src/app.js — Core Express Server Config for Mansara Foods B2B CRM

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./modules/auth/auth.routes');
const dealersRoutes = require('./modules/dealers/dealers.routes');
const productsRoutes = require('./modules/products/products.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const storesRoutes = require('./modules/stores/stores.routes');
const marginsRoutes = require('./modules/margins/margins.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const returnsRoutes = require('./modules/returns/returns.routes');
const requestsRoutes = require('./modules/requests/requests.routes');
const ticketsRoutes = require('./modules/tickets/tickets.routes');
const crmRoutes = require('./modules/crm/crm.routes');
const ecomRoutes = require('./modules/ecom/ecom.routes');
const stallRoutes = require('./modules/stall/stall.routes');
const fieldSalesRoutes = require('./modules/field-sales/field-sales.routes');
const expenseRoutes = require('./modules/expense/expense.routes');
const offerRoutes = require('./modules/offer/offer.routes');
const b2cStoresRoutes = require('./modules/b2c-stores/b2c-stores.routes');
const { checkFeature } = require('./middleware/featureToggle');

const app = express();

// Trust proxy (Render, Vercel, etc.)
app.set('trust proxy', 1);

// Security HTTP headers with relaxed configurations for static content serving
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
const rawOrigins = [
  process.env.FRONTEND_URL,
  'https://crm.mansarafoods.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

const allowedOrigins = [];
rawOrigins.forEach(originStr => {
  if (originStr) {
    const parts = originStr.split(',');
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed) {
        allowedOrigins.push(trimmed);
        allowedOrigins.push(trimmed.replace(/\/$/, ''));
      }
    });
  }
});

app.use(cors({
  origin: (origin, callback) => {
    // Permit any origin in development mode
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Compressions
app.use(compression());

// Logger
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000, // limit each IP to 1000 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Parsing inputs
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
const uploadsDir = path.join(__dirname, '../', process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Serve Product Images from CRM's own public folder (self-contained)
const crmPublicDir = path.join(__dirname, '../public');
app.use('/', express.static(crmPublicDir));

// ─────────────────────────────────────────────
// ROUTE REGISTRATION
// ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/dealers', dealersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/margins', marginsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/ecom', ecomRoutes);
app.use('/api/stalls', checkFeature('enableB2cStall'), stallRoutes);
app.use('/api/field-sales', checkFeature('enableFieldSales'), fieldSalesRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/b2c-stores', b2cStoresRoutes);

// Base Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Wildcard API 404 Route
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 B2B CRM Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
