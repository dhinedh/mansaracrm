// src/config/database.js — Mongoose ODM with Prisma Compatibility Layer
const mongoose = require('mongoose');

// Determine database connection URL
let dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/mansara_crm';
// Strip replicaSet parameters in development to support standalone local MongoDB
if (process.env.NODE_ENV === 'development') {
  dbUrl = dbUrl.replace(/[?&]replicaSet=[^&]*/, '');
}

// Connect to MongoDB
mongoose.connect(dbUrl)
  .then(() => console.log('🔌 Connected to MongoDB via Mongoose'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const Schema = mongoose.Schema;

// ─────────────────────────────────────────────
// SCHEMA DEFINITIONS
// ─────────────────────────────────────────────

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'DEALER'], default: 'DEALER' },
  staffRole: { type: String, enum: ['ADMIN', 'ECOM_MANAGER', 'B2B_MANAGER', 'SUPPORT_AGENT', 'FINANCE_OFFICER', 'VIEWER'], default: 'ADMIN' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  passwordReset: { type: String },
  resetExpiry: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.virtual('dealer', {
  ref: 'Dealer',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

UserSchema.virtual('notifications', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'userId'
});

UserSchema.virtual('auditLogs', {
  ref: 'AuditLog',
  localField: '_id',
  foreignField: 'userId'
});

// Dealer
const DealerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  companyName: { type: String, required: true },
  gstNumber: { type: String, unique: true, sparse: true },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  zones: [{ type: String }],
  area: { type: String },
  phone: { type: String, required: true },
  dealerType: { type: String, enum: ['WHOLESALE', 'RETAIL', 'DISTRIBUTOR', 'SUPER_DISTRIBUTOR'], default: 'RETAIL' },
  dealerCategory: { type: String, enum: ['STARTER', 'GROWTH', 'PREMIUM', 'SUPER'], default: 'STARTER' },
  approvalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvedAt: { type: Date },
  approvedBy: { type: String },
  creditLimit: { type: Number },
  initialDeposit: { type: Number, default: 0 },
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  notes: { type: String },
  logoBase64: { type: String },
  logoUrl: { type: String },
  bankDetails: {
    bankName: { type: String },
    accountNo: { type: String },
    ifscCode: { type: String },
    branch: { type: String },
    accountType: { type: String, default: 'Current' }
  },
  invoiceTerms: { type: String, default: '' },
  invoicePrefix: { type: String },
  defaultMargin: { type: Number, default: 10 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Backward-compatible getter — returns the first zone string
DealerSchema.virtual('zone').get(function () {
  return this.zones && this.zones.length > 0 ? this.zones[0] : null;
});

DealerSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

DealerSchema.virtual('categoryDetails', {
  ref: 'Category',
  localField: 'categories',
  foreignField: '_id'
});

DealerSchema.virtual('stores', {
  ref: 'Store',
  localField: '_id',
  foreignField: 'dealerId'
});

DealerSchema.virtual('inventory', {
  ref: 'DealerInventory',
  localField: '_id',
  foreignField: 'dealerId'
});

DealerSchema.virtual('stockTransfers', {
  ref: 'StockTransfer',
  localField: '_id',
  foreignField: 'dealerId'
});

DealerSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'dealerId'
});

DealerSchema.virtual('margins', {
  ref: 'Margin',
  localField: '_id',
  foreignField: 'dealerId'
});

// Category
const CategorySchema = new Schema({
  name: { type: String, unique: true, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// Product
const ProductSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true, sparse: true, index: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number, alias: 'mrp' },
  gstPercent: { type: Number, default: 5 },
  hsnCode: { type: String, default: '1901' },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, alias: 'categoryId' },
  image: { type: String, alias: 'imageUrl' },
  unit: { type: String, default: 'PCS' },
  cartonSize: { type: Number, default: 24, alias: 'pacQuantity' },
  minOrderQty: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 10 },
  // E-commerce specific fields
  slug: { type: String, unique: true, sparse: true },
  offerPrice: { type: Number },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isOffer: { type: Boolean, default: false },
  ingredients: { type: String },
  howToUse: { type: String },
  storage: { type: String },
  weight: { type: String },
  images: [{ type: String }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ProductSchema.virtual('companyStock').get(function () {
  return {
    id: this._id.toString(),
    productId: this._id.toString(),
    quantity: this.stock || 0,
    minQuantity: this.minQuantity || 10
  };
});


ProductSchema.virtual('dealerStocks', {
  ref: 'DealerInventory',
  localField: '_id',
  foreignField: 'productId'
});

ProductSchema.virtual('transferItems', {
  ref: 'StockTransferItem',
  localField: '_id',
  foreignField: 'productId'
});

ProductSchema.virtual('invoiceItems', {
  ref: 'InvoiceItem',
  localField: '_id',
  foreignField: 'productId'
});

ProductSchema.virtual('margins', {
  ref: 'Margin',
  localField: '_id',
  foreignField: 'productId'
});

ProductSchema.virtual('stockMovements', {
  ref: 'StockMovement',
  localField: '_id',
  foreignField: 'productId'
});

// CompanyInventory
const CompanyInventorySchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', unique: true, required: true },
  quantity: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 10 }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CompanyInventorySchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// DealerInventory
const DealerInventorySchema = new Schema({
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

DealerInventorySchema.index({ dealerId: 1, productId: 1 }, { unique: true });

DealerInventorySchema.virtual('dealer', {
  ref: 'Dealer',
  localField: 'dealerId',
  foreignField: '_id',
  justOne: true
});

DealerInventorySchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// StockMovement
const StockMovementSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['IN', 'OUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT'], required: true },
  quantity: { type: Number, required: true },
  referenceId: { type: String },
  notes: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

StockMovementSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// StockTransfer
const StockTransferSchema = new Schema({
  transferNo: { type: String, unique: true, required: true },
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  status: { type: String, enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DISCREPANCY'], default: 'PENDING' },
  notes: { type: String },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  createdBy: { type: String, required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

StockTransferSchema.virtual('dealer', {
  ref: 'Dealer',
  localField: 'dealerId',
  foreignField: '_id',
  justOne: true
});

StockTransferSchema.virtual('invoice', {
  ref: 'Invoice',
  localField: 'invoiceId',
  foreignField: '_id',
  justOne: true
});

StockTransferSchema.virtual('items', {
  ref: 'StockTransferItem',
  localField: '_id',
  foreignField: 'transferId'
});

// StockTransferItem
const StockTransferItemSchema = new Schema({
  transferId: { type: Schema.Types.ObjectId, ref: 'StockTransfer', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  marginPct: { type: Number, default: 0 },
  receivedQuantity: { type: Number },
  hasDiscrepancy: { type: Boolean, default: false },
  discrepancyComment: { type: String, default: '' }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

StockTransferItemSchema.virtual('transfer', {
  ref: 'StockTransfer',
  localField: 'transferId',
  foreignField: '_id',
  justOne: true
});

StockTransferItemSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Store
const StoreSchema = new Schema({
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer' }, // optional for standalone B2C stores
  name: { type: String, required: true },
  ownerName: { type: String },
  ownerPhone: { type: String },
  gstNumber: { type: String },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  zone: { type: String },
  phone: { type: String },
  classification: { type: String, enum: ['RETAIL', 'KIRANA'], default: 'RETAIL' },
  initialInvestment: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  photos: [{ type: String }],
  revisitDate: { type: Date },
  lastVisitDate: { type: Date },
  isActive: { type: Boolean, default: true },
  tabletopStands: { type: Number, default: 0 },
  hangerStands: { type: Number, default: 0 },
  kitNotes: { type: String, default: '' },
  initialKitAllocated: { type: Boolean, default: false },
  // B2C Stock Configuration (freeze workflow)
  stockStatus: { type: String, enum: ['DRAFT', 'FROZEN'], default: 'DRAFT' },
  stockConfig: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    assignedStock: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

StoreSchema.virtual('dealer', {
  ref: 'Dealer',
  localField: 'dealerId',
  foreignField: '_id',
  justOne: true
});

StoreSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'storeId'
});

StoreSchema.virtual('margins', {
  ref: 'Margin',
  localField: '_id',
  foreignField: 'storeId'
});

StoreSchema.virtual('visits', {
  ref: 'Visit',
  localField: '_id',
  foreignField: 'storeId'
});

// Margin
const MarginSchema = new Schema({
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  categoryId: { type: String },
  marginPercent: { type: Number, required: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

MarginSchema.virtual('dealer', {
  ref: 'Dealer',
  localField: 'dealerId',
  foreignField: '_id',
  justOne: true
});

MarginSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

MarginSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Invoice
const InvoiceSchema = new Schema({
  invoiceNo: { type: String, unique: true, required: true },
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
  channel: { type: String, enum: ['B2B', 'WEBSITE', 'E_COMMERCE'], default: 'B2B' },
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalGst: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  isGstEnabled: { type: Boolean, default: true },
  totalAmount: { type: Number, required: true },
  shippingCharges: { type: Number, default: 0 },
  status: { type: String, enum: ['DRAFT', 'GENERATED', 'PAID', 'CANCELLED', 'OPEN', 'CLOSED'], default: 'OPEN' },
  pdfUrl: { type: String },
  notes: { type: String },
  isCredit: { type: Boolean, default: false },
  dueDate: { type: Date },
  paidAt: { type: Date },
  invoiceType: { type: String, enum: ['NORMAL', 'ADVANCE'], default: 'NORMAL' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

InvoiceSchema.virtual('dealer', {
  ref: 'Dealer',
  localField: 'dealerId',
  foreignField: '_id',
  justOne: true
});

InvoiceSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

InvoiceSchema.virtual('items', {
  ref: 'InvoiceItem',
  localField: '_id',
  foreignField: 'invoiceId'
});

// InvoiceItem
const InvoiceItemSchema = new Schema({
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  fulfilledQuantity: { type: Number, default: 0 },
  unit: { type: String, enum: ['PCS', 'CTN'], default: 'PCS' },
  unitPrice: { type: Number, required: true },
  marginPct: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true },
  gstPercent: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  lineTotal: { type: Number, required: true }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

InvoiceItemSchema.virtual('invoice', {
  ref: 'Invoice',
  localField: 'invoiceId',
  foreignField: '_id',
  justOne: true
});

InvoiceItemSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Notification
const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['STOCK_TRANSFER', 'INVOICE_GENERATED', 'DELIVERY_UPDATE', 'ACCOUNT_UPDATE', 'SYSTEM'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// AuditLog
const AuditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String },
  oldValues: { type: Schema.Types.Mixed },
  newValues: { type: Schema.Types.Mixed },
  ipAddress: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

AuditLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// InvoiceSequence
const InvoiceSequenceSchema = new Schema({
  _id: { type: String, required: true },
  lastNumber: { type: Number, default: 0 },
  prefix: { type: String, default: 'INV' }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Lead
const LeadSchema = new Schema({
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'CONVERTED', 'LOST'], default: 'PENDING' },
  notes: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Visit
const VisitSchema = new Schema({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer' },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
  visitorName: { type: String, required: true },
  purpose: { type: String, required: true },
  outcome: { type: String },
  remarks: { type: String, default: '' },
  photos: [{ type: String }],
  latitude: { type: Number },
  longitude: { type: Number },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  verified: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  paymentsCollected: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['CASH', 'ONLINE', 'NONE'], default: 'NONE' },
  newInvoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  revisitDate: { type: Date },
  returns: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    quantity: { type: Number },
    reason: { type: String }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Stall Session (for location-based performance & investment tracking)
const StallSessionSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  operatorName: { type: String, required: true },
  investment: { type: Number, required: true, default: 0 },
  registrationAmount: { type: Number, default: 0 },
  stage: { type: Number, enum: [1, 2, 3, 4, 5], default: 1 },
  stockStatus: { type: String, enum: ['DRAFT', 'FROZEN'], default: 'DRAFT' },
  products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    initialStock: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    price: { type: Number, default: 0 }
  }],
  expenses: {
    store: { type: Number, default: 0 },
    travel: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    hotel: { type: Number, default: 0 },
    offer: { type: Number, default: 0 },
    billUrl: { type: String }
  },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Stall Sale (high-speed billing transactions)
const StallSaleSchema = new Schema({
  stallSessionId: { type: Schema.Types.ObjectId, ref: 'StallSession', required: true, index: true },
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['CASH', 'ONLINE'], required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sample
const SampleSchema = new Schema({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer' },
  products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true }
  }],
  status: { type: String, enum: ['PENDING', 'CONVERTED', 'REJECTED'], default: 'PENDING' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Return
const ReturnSchema = new Schema({
  returnNo: { type: String, unique: true, required: true },
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  transferId: { type: Schema.Types.ObjectId, ref: 'StockTransfer' },
  type: { type: String, enum: ['DEALER_TO_WAREHOUSE', 'STORE_TO_DEALER'], required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, default: 'Defective/Return' }
  }],
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  notes: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ReturnSchema.virtual('dealer', {
  ref: 'Dealer',
  localField: 'dealerId',
  foreignField: '_id',
  justOne: true
});

// StockRequest (Dealer Order Requests)
const StockRequestSchema = new Schema({
  requestNo: { type: String, unique: true, required: true },
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true }
  }],
  status: { type: String, enum: ['PENDING', 'DISPATCHED', 'CANCELLED'], default: 'PENDING' },
  notes: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

StockRequestSchema.virtual('dealer', {
  ref: 'Dealer',
  localField: 'dealerId',
  foreignField: '_id',
  justOne: true
});

// ComplaintTicket
const ComplaintTicketSchema = new Schema({
  ticketNo: { type: String, unique: true, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ['DELIVERY', 'BILLING', 'QUALITY', 'OTHER'], default: 'OTHER' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  description: { type: String, required: true },
  replies: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

// Expense Schema
const ExpenseSchema = new Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now, required: true },
  category: { type: String, required: true },
  dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
  stallSessionId: { type: Schema.Types.ObjectId, ref: 'StallSession', index: true },
  billUrl: String,
  notes: String,
  status: { type: String, enum: ['SUBMITTED', 'APPROVED', 'REJECTED'], default: 'SUBMITTED' },
  rejectionRemarks: { type: String, default: '' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ExpenseSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

ExpenseSchema.virtual('stallSession', {
  ref: 'StallSession',
  localField: 'stallSessionId',
  foreignField: '_id',
  justOne: true
});

// Offer Item Schema
const OfferItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  purchaseCost: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  initialQuantity: { type: Number, required: true, min: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Offer Distribution Schema
const OfferDistributionSchema = new Schema({
  offerItemId: { type: Schema.Types.ObjectId, ref: 'OfferItem', required: true, index: true },
  quantity: { type: Number, required: true, min: 1 },
  date: { type: Date, default: Date.now, required: true },
  distributedToType: { type: String, enum: ['STORE', 'EVENT', 'GENERAL'], required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
  stallSessionId: { type: Schema.Types.ObjectId, ref: 'StallSession', index: true },
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

OfferDistributionSchema.virtual('offerItem', {
  ref: 'OfferItem',
  localField: 'offerItemId',
  foreignField: '_id',
  justOne: true
});

OfferDistributionSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

OfferDistributionSchema.virtual('stallSession', {
  ref: 'StallSession',
  localField: 'stallSessionId',
  foreignField: '_id',
  justOne: true
});


// ======================================================
// E-COMMERCE SCHEMAS
// ======================================================

// Combo Schema
const ComboSchema = new Schema({
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  comboPrice: { type: Number, required: true, min: 0 }
});

// Banner Schema
const BannerSchema = new Schema({
  page: { type: String, enum: ['home', 'products', 'about', 'contact'], required: true, index: true },
  image: { type: String, required: true },
  mobileImage: { type: String },
  title: String,
  subtitle: String,
  link: String,
  order: { type: Number, default: 0, index: true },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

// BlogPost Schema
const BlogPostSchema = new Schema({
  title: { type: String, required: true, trim: true, index: true },
  slug: { type: String, unique: true, index: true },
  content: { type: String, required: true },
  excerpt: String,
  featuredImage: String,
  video: String,
  category: { type: String, index: true },
  tags: { type: [String], index: true },
  isPublished: { type: Boolean, default: false, index: true },
  publishedAt: { type: Date, index: true }
}, { timestamps: true });

// Career Schema
const CareerSchema = new Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, unique: true, index: true },
  description: String,
  requirements: [String],
  responsibilities: [String],
  location: { type: String, index: true },
  department: { type: String, index: true },
  employmentType: { type: String, index: true },
  experience: String,
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'INR' }
  },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

// PressRelease Schema
const PressReleaseSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  summary: { type: String, required: true },
  content: { type: String },
  externalLink: { type: String },
  image: { type: String },
  images: [String],
  video: String,
  date: { type: Date, default: Date.now, required: true },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

// Review Schema
const ReviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
  images: [String],
  isApproved: { type: Boolean, default: false, index: true },
  adminResponse: {
    text: String,
    date: Date
  }
}, { timestamps: true });

// Setting Schema
const SettingSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true, default: 'site_settings' },
  website_name: { type: String, default: 'MANSARA Foods' },
  contact_email: { type: String, default: 'contact@mansarafoods.com' },
  phone_number: String,
  address: String,
  facebook_url: String,
  instagram_url: String,
  twitter_url: String,
  whatsapp_number: String,
  freeShippingThreshold: { type: Number, default: 0 },
  defaultShippingCharge: { type: Number, default: 0 },
  enableB2cStall: { type: Boolean, default: true },
  enableFieldSales: { type: Boolean, default: true }
}, { timestamps: true });

// Order Schema
const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: String, unique: true, required: true, index: true },
  date: { type: Date, default: Date.now, index: true },
  total: { type: Number, required: true, min: 0, index: true },
  paymentStatus: { type: String, default: 'Pending', index: true },
  orderStatus: { type: String, default: 'Ordered', index: true },
  feedbackStatus: { type: String, default: 'Pending', index: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    image: String,
    weight: String
  }],
  deliveryAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: String
  },
  paymentMethod: { type: String, default: 'Cash on Delivery', index: true },
  estimatedDeliveryDate: { type: Date, index: true },
  trackingNumber: String,
  courier: String,
  shipping: {
    srOrderId: String,
    shipmentId: String,
    awb: { type: String, index: true },
    courierName: String,
    labelUrl: String,
    invoiceUrl: String,
    status: { type: String, default: 'pending' },
    trackingUrl: String
  }
}, { timestamps: true });

// Compile Models
const User = mongoose.model('User', UserSchema, 'users');
const Dealer = mongoose.model('Dealer', DealerSchema, 'dealers');
const Category = mongoose.model('Category', CategorySchema, 'categories');
const Product = mongoose.model('Product', ProductSchema, 'products');
const Combo = Product.discriminator('Combo', ComboSchema);
const Banner = mongoose.model('Banner', BannerSchema, 'banners');
const BlogPost = mongoose.model('BlogPost', BlogPostSchema, 'blogposts');
const Career = mongoose.model('Career', CareerSchema, 'careers');
const PressRelease = mongoose.model('PressRelease', PressReleaseSchema, 'pressreleases');
const Review = mongoose.model('Review', ReviewSchema, 'reviews');
const Setting = mongoose.model('Setting', SettingSchema, 'settings');
const Order = mongoose.model('Order', OrderSchema, 'orders');
const CompanyInventory = mongoose.model('CompanyInventory', CompanyInventorySchema, 'company_inventory');
const DealerInventory = mongoose.model('DealerInventory', DealerInventorySchema, 'dealer_inventory');
const StockMovement = mongoose.model('StockMovement', StockMovementSchema, 'stock_movements');
const StockTransfer = mongoose.model('StockTransfer', StockTransferSchema, 'stock_transfers');
const StockTransferItem = mongoose.model('StockTransferItem', StockTransferItemSchema, 'stock_transfer_items');
const Store = mongoose.model('Store', StoreSchema, 'stores');
const Margin = mongoose.model('Margin', MarginSchema, 'margins');
const Invoice = mongoose.model('Invoice', InvoiceSchema, 'invoices');
const InvoiceItem = mongoose.model('InvoiceItem', InvoiceItemSchema, 'invoice_items');
const Notification = mongoose.model('Notification', NotificationSchema, 'notifications');
const AuditLog = mongoose.model('AuditLog', AuditLogSchema, 'audit_logs');
const InvoiceSequence = mongoose.model('InvoiceSequence', InvoiceSequenceSchema, 'invoice_sequence');
const Lead = mongoose.model('Lead', LeadSchema, 'leads');
const Visit = mongoose.model('Visit', VisitSchema, 'visits');
const StallSession = mongoose.model('StallSession', StallSessionSchema, 'stall_sessions');
const StallSale = mongoose.model('StallSale', StallSaleSchema, 'stall_sales');
const Sample = mongoose.model('Sample', SampleSchema, 'samples');
const Return = mongoose.model('Return', ReturnSchema, 'returns');
const StockRequest = mongoose.model('StockRequest', StockRequestSchema, 'stock_requests');
const ComplaintTicket = mongoose.model('ComplaintTicket', ComplaintTicketSchema, 'complaint_tickets');
// SavedReport Schema
const SavedReportSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  parameters: { type: Schema.Types.Mixed },
  data: { type: Schema.Types.Mixed },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  creatorName: { type: String, default: 'Admin' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

SavedReportSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

const SavedReport = mongoose.model('SavedReport', SavedReportSchema, 'saved_reports');
const Expense = mongoose.model('Expense', ExpenseSchema, 'expenses');
const OfferItem = mongoose.model('OfferItem', OfferItemSchema, 'offer_items');
const OfferDistribution = mongoose.model('OfferDistribution', OfferDistributionSchema, 'offer_distributions');

// ─────────────────────────────────────────────
// AUTOMATIC DATABASE SCHEMA MIGRATION RUNNER
// ─────────────────────────────────────────────

async function runDatabaseMigrations() {
  try {
    const Dealer = mongoose.model('Dealer');
    const Margin = mongoose.model('Margin');
    
    const dealers = await Dealer.find({});
    console.log(`[Migration] Checking defaults and margin rules for ${dealers.length} dealers...`);
    
    for (const dealer of dealers) {
      // 1. Ensure dealer has default margin rule (10%)
      const hasDefaultMargin = await Margin.findOne({ dealerId: dealer._id, isDefault: true });
      if (!hasDefaultMargin) {
        await Margin.create({
          dealerId: dealer._id,
          marginPercent: 10.0,
          isDefault: true
        });
        console.log(`[Migration] Created default margin rule (10%) for dealer: ${dealer.companyName}`);
      }

      // 2. Ensure all schema default fields (including any future fields) are present and persisted
      let modified = false;
      const schema = Dealer.schema;
      
      for (const path in schema.paths) {
        if (['_id', '__v', 'createdAt', 'updatedAt'].includes(path)) continue;
        
        const schemaType = schema.paths[path];
        
        if (dealer._doc[path] === undefined) {
          let defaultValue = undefined;
          if (schemaType.defaultValue !== undefined) {
            defaultValue = typeof schemaType.defaultValue === 'function'
              ? schemaType.defaultValue()
              : schemaType.defaultValue;
          } else if (schemaType.instance === 'Array') {
            defaultValue = [];
          }
          
          if (defaultValue !== undefined) {
            dealer.set(path, defaultValue);
            modified = true;
          }
        }
      }
      
      if (modified) {
        await dealer.save();
        console.log(`[Migration] Updated missing schema fields for dealer: ${dealer.companyName}`);
      }
    }
    
    // StallSession Migrations
    const StallSession = mongoose.model('StallSession');
    const sessions = await StallSession.find({});
    for (const sess of sessions) {
      let modified = false;
      const schema = StallSession.schema;
      for (const path in schema.paths) {
        if (['_id', '__v', 'createdAt', 'updatedAt'].includes(path)) continue;
        const schemaType = schema.paths[path];
        if (sess._doc[path] === undefined) {
          let defaultValue = undefined;
          if (schemaType.defaultValue !== undefined) {
            defaultValue = typeof schemaType.defaultValue === 'function'
              ? schemaType.defaultValue()
              : schemaType.defaultValue;
          } else if (schemaType.instance === 'Array') {
            defaultValue = [];
          } else if (path === 'expenses') {
            defaultValue = { store: 0, travel: 0, food: 0, hotel: 0, offer: 0, billUrl: '' };
          }
          if (defaultValue !== undefined) {
            sess.set(path, defaultValue);
            modified = true;
          }
        }
      }
      if (modified) {
        await sess.save();
        console.log(`[Migration] Updated missing schema fields for StallSession: ${sess.name}`);
      }
    }
    
    console.log('[Migration] Database migrations completed successfully.');
  } catch (err) {
    console.error('[Migration] Database migration error:', err);
  }
}

// Trigger migrations after mongoose is connected
if (mongoose.connection.readyState === 1) {
  runDatabaseMigrations();
} else {
  mongoose.connection.once('connected', runDatabaseMigrations);
}

// ─────────────────────────────────────────────
// PRISMA COMPATIBILITY WRAPPER LAYER
// ─────────────────────────────────────────────

function translateWhere(where) {
  if (!where) return {};
  const query = {};
  for (let key in where) {
    let val = where[key];
    if (key === 'dealerId_productId') {
      query['dealerId'] = val.dealerId;
      query['productId'] = val.productId;
    } else if (key === 'id') {
      query['_id'] = val;
    } else if (key === 'OR') {
      query['$or'] = val.map(translateWhere);
    } else if (key === 'AND') {
      query['$and'] = val.map(translateWhere);
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const subQuery = {};
      for (let op in val) {
        let opVal = val[op];
        if (op === 'contains') {
          subQuery['$regex'] = opVal;
          if (val.mode === 'insensitive') {
            subQuery['$options'] = 'i';
          }
        } else if (op === 'mode') {
          // handled in contains
        } else if (op === 'gt') {
          subQuery['$gt'] = opVal;
        } else if (op === 'gte') {
          subQuery['$gte'] = opVal;
        } else if (op === 'lt') {
          subQuery['$lt'] = opVal;
        } else if (op === 'lte') {
          subQuery['$lte'] = opVal;
        } else if (op === 'in') {
          subQuery['$in'] = opVal;
        } else if (op === 'not') {
          subQuery['$ne'] = opVal;
        } else if (op === 'notIn') {
          subQuery['$nin'] = opVal;
        } else {
          subQuery[`$${op}`] = opVal;
        }
      }
      query[key] = subQuery;
    } else {
      query[key] = val;
    }
  }
  return query;
}

// Relation filter resolver for cross-collection queries in Prisma where clauses
async function resolveRelationFilters(where, modelName) {
  if (!where) return {};
  const query = {};
  for (let key in where) {
    let val = where[key];
    if (key === 'dealerId_productId') {
      query['dealerId'] = val.dealerId;
      query['productId'] = val.productId;
    } else if (key === 'OR') {
      const resolvedList = [];
      for (const item of val) {
        resolvedList.push(await resolveRelationFilters(item, modelName));
      }
      query['$or'] = resolvedList;
    } else if (key === 'AND') {
      const resolvedList = [];
      for (const item of val) {
        resolvedList.push(await resolveRelationFilters(item, modelName));
      }
      query['$and'] = resolvedList;
    } else if (key === 'invoice' && modelName === 'InvoiceItem') {
      const invoices = await mongoose.models.Invoice.find(await resolveRelationFilters(val, 'Invoice'), { _id: 1 });
      query['invoiceId'] = { $in: invoices.map(i => i._id) };
    } else if (key === 'user' && modelName === 'Dealer') {
      const users = await mongoose.models.User.find(await resolveRelationFilters(val, 'User'), { _id: 1 });
      query['userId'] = { $in: users.map(u => u._id) };
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const subQuery = {};
      for (let op in val) {
        let opVal = val[op];
        if (op === 'contains') {
          subQuery['$regex'] = opVal;
          if (val.mode === 'insensitive') {
            subQuery['$options'] = 'i';
          }
        } else if (op === 'mode') {
          // Handled in contains
        } else if (op === 'gt') {
          subQuery['$gt'] = opVal;
        } else if (op === 'gte') {
          subQuery['$gte'] = opVal;
        } else if (op === 'lt') {
          subQuery['$lt'] = opVal;
        } else if (op === 'lte') {
          subQuery['$lte'] = opVal;
        } else if (op === 'in') {
          subQuery['$in'] = opVal;
        } else if (op === 'not') {
          subQuery['$ne'] = opVal;
        } else if (op === 'notIn') {
          subQuery['$nin'] = opVal;
        } else {
          subQuery[`$${op}`] = opVal;
        }
      }
      query[key] = subQuery;
    } else {
      if (key === 'id') {
        query['_id'] = val;
      } else if (key === 'categoryId' && modelName === 'Product') {
        query['category'] = val;
      } else {
        query[key] = val;
      }
    }
  }
  return query;
}

function translateInclude(include) {
  const populate = [];
  for (let key in include) {
    if (include[key]) {
      if (key === 'companyStock') continue;
      const opt = { path: key };
      if (typeof include[key] === 'object') {
        if (include[key].select) {
          opt.select = Object.keys(include[key].select).map(k => k === 'id' ? '_id' : k).join(' ');
        }
        if (include[key].include) {
          opt.populate = translateInclude(include[key].include);
        }
      }
      populate.push(opt);
    }
  }
  return populate;
}

function translateOrderBy(orderBy) {
  if (!orderBy) return null;
  const sort = {};
  if (Array.isArray(orderBy)) {
    orderBy.forEach(item => {
      for (let k in item) {
        sort[k] = item[k] === 'desc' ? -1 : 1;
      }
    });
  } else {
    for (let k in orderBy) {
      sort[k] = orderBy[k] === 'desc' ? -1 : 1;
    }
  }
  return sort;
}

function translateSelect(select) {
  return Object.keys(select).map(k => k === 'id' ? '_id' : k).join(' ');
}

function translateCreateData(data) {
  if (!data) return {};
  const cleaned = {};
  for (let key in data) {
    let val = data[key];
    if (key === 'id') {
      cleaned['_id'] = val;
    } else if (key === 'gstNumber' && (val === '' || val === null)) {
      // omit empty/null gstNumber to prevent unique index duplicate errors
    } else {
      cleaned[key] = val;
    }
  }
  if (cleaned.pacQuantity !== undefined) {
    cleaned.cartonSize = cleaned.pacQuantity ? parseInt(cleaned.pacQuantity) : 24;
  }
  return cleaned;
}

function translateUpdateData(data) {
  if (!data) return {};
  const cleaned = {};
  for (let key in data) {
    let val = data[key];
    if (key === 'gstNumber' && (val === '' || val === null)) {
      cleaned['$unset'] = cleaned['$unset'] || {};
      cleaned['$unset']['gstNumber'] = "";
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if (val.increment !== undefined) {
        cleaned['$inc'] = cleaned['$inc'] || {};
        cleaned['$inc'][key] = val.increment;
      } else if (val.decrement !== undefined) {
        cleaned['$inc'] = cleaned['$inc'] || {};
        cleaned['$inc'][key] = -val.decrement;
      } else {
        cleaned[key] = val;
      }
    } else {
      cleaned[key] = val;
    }
  }
  if (cleaned.pacQuantity !== undefined) {
    cleaned.cartonSize = cleaned.pacQuantity ? parseInt(cleaned.pacQuantity) : 24;
  }
  return cleaned;
}

function formatResult(doc) {
  if (!doc) return null;
  if (Array.isArray(doc)) {
    return doc.map(formatResult);
  }
  let obj = doc;
  if (typeof doc.toObject === 'function') {
    obj = doc.toObject({ virtuals: true, getters: true });
  }
  return cleanDoc(obj);
}

function cleanDoc(obj) {
  if (!obj) return obj;
  if (obj instanceof mongoose.Types.ObjectId || (obj.constructor && obj.constructor.name === 'ObjectId')) {
    return obj.toString();
  }
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(cleanDoc);

  const cleaned = {};
  for (let key in obj) {
    let val = obj[key];
    if (key === '_id') {
      cleaned['id'] = val.toString();
    } else if (key === '__v') {
      // skip
    } else {
      cleaned[key] = cleanDoc(val);
    }
  }
  if (obj._id && !cleaned.id) {
    cleaned.id = obj._id.toString();
  }
  return cleaned;
}

class PrismaCollectionWrapper {
  constructor(modelName) {
    this.modelName = modelName;
  }

  get model() {
    return mongoose.model(this.modelName);
  }

  async findUnique(args) {
    if (this.modelName === 'CompanyInventory') {
      const prodId = args.where.productId || args.where.id;
      const productModel = mongoose.model('Product');
      let q = productModel.findById(prodId);
      if (args.include && args.include.product) {
        if (args.include.product.include) {
          q = q.populate(translateInclude(args.include.product.include));
        }
      }
      const prod = await q.exec();
      if (!prod) return null;
      return {
        id: prod._id.toString(),
        productId: prod._id.toString(),
        quantity: prod.stock || 0,
        minQuantity: prod.minQuantity || 10,
        product: formatResult(prod)
      };
    }
    const query = await resolveRelationFilters(args.where, this.modelName);
    let q = this.model.findOne(query);
    if (args.include) {
      q = q.populate(translateInclude(args.include));
    }
    const doc = await q.exec();
    return formatResult(doc);
  }

  async findFirst(args) {
    if (this.modelName === 'CompanyInventory') {
      const prodId = args.where.productId || args.where.id;
      const productModel = mongoose.model('Product');
      let q = productModel.findOne({ _id: prodId });
      if (args.include && args.include.product) {
        if (args.include.product.include) {
          q = q.populate(translateInclude(args.include.product.include));
        }
      }
      const prod = await q.exec();
      if (!prod) return null;
      return {
        id: prod._id.toString(),
        productId: prod._id.toString(),
        quantity: prod.stock || 0,
        minQuantity: prod.minQuantity || 10,
        product: formatResult(prod)
      };
    }
    const query = await resolveRelationFilters(args.where, this.modelName);
    let q = this.model.findOne(query);
    if (args.orderBy) {
      q = q.sort(translateOrderBy(args.orderBy));
    }
    if (args.include) {
      q = q.populate(translateInclude(args.include));
    }
    const doc = await q.exec();
    return formatResult(doc);
  }

  async findMany(args = {}) {
    if (this.modelName === 'CompanyInventory') {
      const productModel = mongoose.model('Product');
      let q = productModel.find({ isActive: true });
      if (args.orderBy) {
        q = q.sort({ name: 1 });
      }
      const products = await q.exec();
      return products.map(prod => ({
        id: prod._id.toString(),
        productId: prod._id.toString(),
        quantity: prod.stock || 0,
        minQuantity: prod.minQuantity || 10,
        product: formatResult(prod)
      }));
    }
    const query = await resolveRelationFilters(args.where, this.modelName);
    let q = this.model.find(query);
    if (args.orderBy) {
      q = q.sort(translateOrderBy(args.orderBy));
    }
    if (args.skip) {
      q = q.skip(args.skip);
    }
    if (args.take) {
      q = q.limit(args.take);
    }
    if (args.select) {
      q = q.select(translateSelect(args.select));
    }
    if (args.include) {
      q = q.populate(translateInclude(args.include));
    }
    const docs = await q.exec();
    return formatResult(docs);
  }

  async create(args) {
    if (this.modelName === 'CompanyInventory') {
      const productModel = mongoose.model('Product');
      const quantity = args.data.quantity || 0;
      const minQuantity = args.data.minQuantity || 10;
      const prod = await productModel.findByIdAndUpdate(
        args.data.productId,
        { $set: { stock: quantity, minQuantity } },
        { new: true }
      );
      return {
        id: prod._id.toString(),
        productId: prod._id.toString(),
        quantity: prod.stock || 0,
        minQuantity: prod.minQuantity || 10,
        product: formatResult(prod)
      };
    }
    // Extract nested create operations
    const nestedCreates = [];
    const cleanData = {};
    for (const key in args.data) {
      const val = args.data[key];
      if (val && typeof val === 'object' && val.create) {
        const virtual = this.model.schema.virtuals[key];
        if (virtual && virtual.options && virtual.options.ref && virtual.options.foreignField) {
          nestedCreates.push({
            key,
            ref: virtual.options.ref,
            foreignField: virtual.options.foreignField,
            localField: virtual.options.localField || '_id',
            createVal: val.create
          });
        } else {
          cleanData[key] = val;
        }
      } else {
        cleanData[key] = val;
      }
    }

    const data = translateCreateData(cleanData);
    const doc = await this.model.create(data);

    // Execute nested creations
    for (const nc of nestedCreates) {
      const relatedModel = mongoose.model(nc.ref);
      const foreignKey = nc.foreignField;
      const parentId = nc.localField === '_id' ? doc._id : doc[nc.localField];

      const createItems = Array.isArray(nc.createVal) ? nc.createVal : [nc.createVal];
      for (const itemData of createItems) {
        const itemToCreate = {
          ...itemData,
          [foreignKey]: parentId
        };
        const cleanItemData = translateCreateData(itemToCreate);
        await relatedModel.create(cleanItemData);
      }
    }

    let result = doc;
    if (args.include) {
      result = await this.model.findById(doc._id).populate(translateInclude(args.include));
    }
    return formatResult(result);
  }

  async update(args) {
    if (this.modelName === 'CompanyInventory') {
      const productModel = mongoose.model('Product');
      const prodId = args.where.productId || args.where.id;
      const data = translateUpdateData(args.data);
      let updateQuery = {};
      const setFields = {};
      if (data.quantity !== undefined) {
        setFields.stock = data.quantity;
      }
      if (data.minQuantity !== undefined) {
        setFields.minQuantity = data.minQuantity;
      }
      if (data['$inc']) {
        updateQuery = { $inc: { stock: data['$inc'].quantity } };
      } else {
        updateQuery = { $set: setFields };
      }
      const prod = await productModel.findByIdAndUpdate(prodId, updateQuery, { new: true });
      return {
        id: prod._id.toString(),
        productId: prod._id.toString(),
        quantity: prod.stock || 0,
        minQuantity: prod.minQuantity || 10,
        product: formatResult(prod)
      };
    }
    const query = await resolveRelationFilters(args.where, this.modelName);
    const data = translateUpdateData(args.data);

    // Extract operator updates ($inc, $unset) vs standard updates ($set)
    const updateQuery = {};
    if (data['$inc']) {
      updateQuery['$inc'] = data['$inc'];
      delete data['$inc'];
    }
    if (data['$unset']) {
      updateQuery['$unset'] = data['$unset'];
      delete data['$unset'];
    }
    if (Object.keys(data).length > 0) {
      updateQuery['$set'] = data;
    }

    const doc = await this.model.findOneAndUpdate(query, updateQuery, { new: true });
    let result = doc;
    if (args.include && doc) {
      result = await this.model.findById(doc._id).populate(translateInclude(args.include));
    }
    return formatResult(result);
  }

  async delete(args) {
    if (this.modelName === 'CompanyInventory') {
      return null;
    }
    const query = await resolveRelationFilters(args.where, this.modelName);
    const doc = await this.model.findOneAndDelete(query);
    return formatResult(doc);
  }

  async deleteMany(args = {}) {
    if (this.modelName === 'CompanyInventory') {
      return { count: 0 };
    }
    const query = await resolveRelationFilters(args.where, this.modelName);
    const res = await this.model.deleteMany(query);
    return { count: res.deletedCount };
  }

  async updateMany(args) {
    const query = await resolveRelationFilters(args.where, this.modelName);
    const data = translateUpdateData(args.data);

    const updateQuery = {};
    if (data['$inc']) {
      updateQuery['$inc'] = data['$inc'];
      delete data['$inc'];
    }
    if (data['$unset']) {
      updateQuery['$unset'] = data['$unset'];
      delete data['$unset'];
    }
    if (Object.keys(data).length > 0) {
      updateQuery['$set'] = data;
    }

    const res = await this.model.updateMany(query, updateQuery);
    return { count: res.modifiedCount };
  }

  async upsert(args) {
    const query = await resolveRelationFilters(args.where, this.modelName);
    const existing = await this.model.findOne(query);
    if (existing) {
      const data = translateUpdateData(args.update);
      const updateQuery = {};
      if (data['$inc']) {
        updateQuery['$inc'] = data['$inc'];
        delete data['$inc'];
      }
      if (data['$unset']) {
        updateQuery['$unset'] = data['$unset'];
        delete data['$unset'];
      }
      if (Object.keys(data).length > 0) {
        updateQuery['$set'] = data;
      }
      const doc = await this.model.findOneAndUpdate(query, updateQuery, { new: true });
      return formatResult(doc);
    } else {
      const data = translateCreateData({ ...args.where, ...args.create });
      const doc = await this.model.create(data);
      return formatResult(doc);
    }
  }

  async count(args = {}) {
    const query = await resolveRelationFilters(args.where, this.modelName);
    return await this.model.countDocuments(query);
  }

  async aggregate(args) {
    const docs = await this.findMany({ where: args.where });
    const result = { _sum: {}, _count: {} };
    if (args._sum) {
      for (let k in args._sum) {
        result._sum[k] = docs.reduce((acc, doc) => acc + (parseFloat(doc[k]) || 0), 0);
      }
    }
    if (args._count) {
      for (let k in args._count) {
        result._count[k] = docs.length;
      }
    }
    return result;
  }

  async groupBy(args) {
    const docs = await this.findMany({ where: args.where });
    const groups = {};
    docs.forEach(doc => {
      const groupKey = args.by.map(k => doc[k]).join('|');
      if (!groups[groupKey]) {
        groups[groupKey] = { docs: [], keys: {} };
        args.by.forEach(k => {
          groups[groupKey].keys[k] = doc[k];
        });
      }
      groups[groupKey].docs.push(doc);
    });

    let result = Object.values(groups).map(g => {
      const res = { ...g.keys };
      if (args._sum) {
        res._sum = {};
        for (let k in args._sum) {
          res._sum[k] = g.docs.reduce((acc, d) => acc + (parseFloat(d[k]) || 0), 0);
        }
      }
      return res;
    });

    if (args.orderBy) {
      const sort = translateOrderBy(args.orderBy);
      result.sort((a, b) => {
        for (let k in sort) {
          let valA, valB;
          if (k.startsWith('_sum.')) {
            const sumKey = k.split('.')[1];
            valA = a._sum?.[sumKey] || 0;
            valB = b._sum?.[sumKey] || 0;
          } else {
            valA = a[k];
            valB = b[k];
          }
          if (valA < valB) return sort[k] * -1;
          if (valA > valB) return sort[k] * 1;
        }
        return 0;
      });
    }

    if (args.take) {
      result = result.slice(0, args.take);
    }
    return result;
  }
}

// ─────────────────────────────────────────────
// EXPORT PRISMA DROP-IN CLIENT
// ─────────────────────────────────────────────

const prisma = {
  user: new PrismaCollectionWrapper('User'),
  dealer: new PrismaCollectionWrapper('Dealer'),
  category: new PrismaCollectionWrapper('Category'),
  product: new PrismaCollectionWrapper('Product'),
  companyInventory: new PrismaCollectionWrapper('CompanyInventory'),
  dealerInventory: new PrismaCollectionWrapper('DealerInventory'),
  stockMovement: new PrismaCollectionWrapper('StockMovement'),
  stockTransfer: new PrismaCollectionWrapper('StockTransfer'),
  stockTransferItem: new PrismaCollectionWrapper('StockTransferItem'),
  store: new PrismaCollectionWrapper('Store'),
  margin: new PrismaCollectionWrapper('Margin'),
  invoice: new PrismaCollectionWrapper('Invoice'),
  invoiceItem: new PrismaCollectionWrapper('InvoiceItem'),
  notification: new PrismaCollectionWrapper('Notification'),
  auditLog: new PrismaCollectionWrapper('AuditLog'),
  invoiceSequence: new PrismaCollectionWrapper('InvoiceSequence'),
  lead: new PrismaCollectionWrapper('Lead'),
  visit: new PrismaCollectionWrapper('Visit'),
  sample: new PrismaCollectionWrapper('Sample'),
  return: new PrismaCollectionWrapper('Return'),
  stockRequest: new PrismaCollectionWrapper('StockRequest'),
  complaintTicket: new PrismaCollectionWrapper('ComplaintTicket'),
  combo: new PrismaCollectionWrapper('Combo'),
  banner: new PrismaCollectionWrapper('Banner'),
  blogPost: new PrismaCollectionWrapper('BlogPost'),
  career: new PrismaCollectionWrapper('Career'),
  pressRelease: new PrismaCollectionWrapper('PressRelease'),
  review: new PrismaCollectionWrapper('Review'),
  setting: new PrismaCollectionWrapper('Setting'),
  order: new PrismaCollectionWrapper('Order'),
  stallSession: new PrismaCollectionWrapper('StallSession'),
  stallSale: new PrismaCollectionWrapper('StallSale'),
  expense: new PrismaCollectionWrapper('Expense'),
  offerItem: new PrismaCollectionWrapper('OfferItem'),
  offerDistribution: new PrismaCollectionWrapper('OfferDistribution'),
  savedReport: new PrismaCollectionWrapper('SavedReport'),

  $transaction: async (fn) => {
    // Run transactions sequentially on standalone local MongoDB instances
    const tx = prisma;
    return await fn(tx);
  },

  $disconnect: async () => {
    await mongoose.disconnect();
  }
};

class PrismaClient {
  constructor() {
    return prisma;
  }
}

prisma.PrismaClient = PrismaClient;

module.exports = prisma;
