// backend/src/modules/bulk-upload/bulk-upload.controller.js
const prisma = require('../../config/database');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const { logAudit } = require('../../utils/auditLogger');

/**
 * Helper to parse uploaded Excel (.xlsx) or CSV buffer/file
 */
const parseUploadedFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet, { defval: '' });
};

/**
 * GET /api/bulk-upload/template/:module
 * Generates and downloads a pre-formatted template with sample rows (.xlsx or .csv)
 */
exports.downloadTemplate = async (req, res, next) => {
  try {
    const { module: mod } = req.params;
    const format = (req.query.format || 'xlsx').toLowerCase();

    let sampleData = [];
    let filename = `${mod}_sample_template`;

    switch (mod.toLowerCase()) {
      case 'stores':
      case 'shops':
        filename = 'Shops_Stores_Template';
        sampleData = [
          {
            'Shop Name*': 'Annai Maligai Store',
            'Owner Name': 'R. Murugan',
            'Phone*': '9840123456',
            'Address*': '12 Bazaar Road, T Nagar',
            'City*': 'Chennai',
            'Pincode*': '600017',
            'State': 'Tamil Nadu',
            'Zone': 'South Zone',
            'Category': 'RETAIL',
            'GST Number': '',
            'Dealer Phone or Name': '7904441760',
            'Latitude': '13.0418',
            'Longitude': '80.2341'
          },
          {
            'Shop Name*': 'Sri Krishna Supermarket',
            'Owner Name': 'K. Suresh',
            'Phone*': '9840987654',
            'Address*': '45 Gandhi Road',
            'City*': 'Coimbatore',
            'Pincode*': '641001',
            'State': 'Tamil Nadu',
            'Zone': 'West Zone',
            'Category': 'KIRANA',
            'GST Number': '33AABCS1234F1Z5',
            'Dealer Phone or Name': '',
            'Latitude': '',
            'Longitude': ''
          }
        ];
        break;

      case 'products':
      case 'stock':
        filename = 'Products_Stock_Template';
        sampleData = [
          {
            'Product Name*': 'Mansara Idly Chilli Powder 100g',
            'SKU*': 'MF-IDL-100',
            'Category*': 'Masala Powders',
            'MRP*': 45.00,
            'Carton Size (Pack)': 24,
            'Net Weight (g)': 100,
            'GST Percent': 5,
            'Current Stock': 150
          },
          {
            'Product Name*': 'Mansara Sambar Powder 200g',
            'SKU*': 'MF-SAM-200',
            'Category*': 'Masala Powders',
            'MRP*': 85.00,
            'Carton Size (Pack)': 24,
            'Net Weight (g)': 200,
            'GST Percent': 5,
            'Current Stock': 80
          }
        ];
        break;

      case 'orders':
        filename = 'Orders_Template';
        sampleData = [
          {
            'Store Phone or Name*': '9840123456',
            'Product SKU or Name*': 'MF-IDL-100',
            'Quantity*': 48,
            'Unit Price': 40.00,
            'Order Date (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
            'Payment Method': 'CASH',
            'Notes': 'Delivery before 5 PM'
          }
        ];
        break;

      case 'customers':
      case 'leads':
        filename = 'Customers_Leads_Template';
        sampleData = [
          {
            'Customer Name*': 'K. Rajan',
            'Company or Store': 'Rajan Provision Store',
            'Phone*': '9876543210',
            'Email': 'rajan@example.com',
            'City*': 'Madurai',
            'Zone': 'South Zone',
            'Address': '15 West Masi Street',
            'Status': 'ACTIVE'
          }
        ];
        break;

      default:
        return res.status(400).json({ success: false, message: `Unknown module: ${mod}` });
    }

    const ws = xlsx.utils.json_to_sheet(sampleData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template');

    if (format === 'csv') {
      const csvBuffer = xlsx.write(wb, { bookType: 'csv', type: 'buffer' });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csvBuffer);
    } else {
      const xlsxBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(xlsxBuffer);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bulk-upload/validate
 * Validates uploaded file and returns row-by-row validation feedback and preview
 */
exports.validateUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel or CSV file' });
    }

    const { module: mod } = req.body;
    if (!mod) {
      return res.status(400).json({ success: false, message: 'Module type is required' });
    }

    const rows = parseUploadedFile(req.file.path);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty' });
    }

    const validationResults = [];
    let validCount = 0;
    let errorCount = 0;

    // Load reference data for validation
    const StoreModel = mongoose.model('Store');
    const ProductModel = mongoose.model('Product');
    const DealerModel = mongoose.model('Dealer');

    // Cache existing records to detect duplicates quickly
    const existingStores = await StoreModel.find({ isActive: true }).select('phone name city').lean();
    const existingStorePhones = new Set(existingStores.map(s => String(s.phone || '').trim()).filter(Boolean));

    const existingProducts = await ProductModel.find({ isActive: true }).select('sku name').lean();
    const existingSkus = new Set(existingProducts.map(p => String(p.sku || '').trim().toLowerCase()).filter(Boolean));

    const allDealers = await DealerModel.find({}).select('_id companyName phone name').lean();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // Excel header is row 1
      const rawRow = rows[i];
      const errors = [];
      const sanitized = {};

      switch (mod.toUpperCase()) {
        case 'STORES':
        case 'SHOPS': {
          const name = String(rawRow['Shop Name*'] || rawRow['Shop Name'] || rawRow['name'] || '').trim();
          const phone = String(rawRow['Phone*'] || rawRow['Phone'] || rawRow['phone'] || '').trim().replace(/\D/g, '');
          const address = String(rawRow['Address*'] || rawRow['Address'] || rawRow['address'] || '').trim();
          const city = String(rawRow['City*'] || rawRow['City'] || rawRow['city'] || '').trim();
          const pincode = String(rawRow['Pincode*'] || rawRow['Pincode'] || rawRow['pincode'] || '').trim();
          const ownerName = String(rawRow['Owner Name'] || rawRow['ownerName'] || '').trim();
          const state = String(rawRow['State'] || rawRow['state'] || 'Tamil Nadu').trim();
          const zone = String(rawRow['Zone'] || rawRow['zone'] || '').trim();
          const category = String(rawRow['Category'] || rawRow['category'] || 'RETAIL').toUpperCase();
          const gstNumber = String(rawRow['GST Number'] || rawRow['gstNumber'] || '').trim();
          const dealerInput = String(rawRow['Dealer Phone or Name'] || rawRow['Dealer'] || '').trim();
          const lat = parseFloat(rawRow['Latitude'] || rawRow['latitude']);
          const lng = parseFloat(rawRow['Longitude'] || rawRow['longitude']);

          if (!name) errors.push('Shop Name is required');
          if (!phone) {
            errors.push('Phone number is required');
          } else if (phone.length < 10) {
            errors.push('Phone number must be at least 10 digits');
          } else if (existingStorePhones.has(phone)) {
            errors.push(`Duplicate: Shop with phone ${phone} already exists`);
          }

          if (!address) errors.push('Shop address is required');
          if (!city) errors.push('City is required');
          if (pincode && pincode.length !== 6) {
            errors.push('Pincode must be exactly 6 digits');
          }

          // Match dealer if provided
          let resolvedDealer = null;
          if (dealerInput) {
            const cleanD = dealerInput.toLowerCase();
            resolvedDealer = allDealers.find(d => 
              (d.phone && d.phone.includes(dealerInput)) ||
              (d.companyName && d.companyName.toLowerCase().includes(cleanD)) ||
              (d.name && d.name.toLowerCase().includes(cleanD))
            );
            if (!resolvedDealer) {
              errors.push(`Dealer '${dealerInput}' not found in system (will be created as Direct Store if continued)`);
            }
          }

          sanitized.name = name;
          sanitized.ownerName = ownerName;
          sanitized.phone = phone;
          sanitized.address = address;
          sanitized.city = city;
          sanitized.pincode = pincode;
          sanitized.state = state;
          sanitized.zone = zone;
          sanitized.category = ['RETAIL', 'KIRANA'].includes(category) ? category : 'RETAIL';
          sanitized.gstNumber = gstNumber;
          sanitized.dealerId = resolvedDealer ? resolvedDealer._id : null;
          sanitized.dealerName = resolvedDealer ? (resolvedDealer.companyName || resolvedDealer.name) : 'Direct / Head Office';
          sanitized.latitude = !isNaN(lat) ? lat : undefined;
          sanitized.longitude = !isNaN(lng) ? lng : undefined;
          sanitized.locationStatus = (!isNaN(lat) && !isNaN(lng)) ? 'COORDINATES_CAPTURED' : 'PENDING_COORDINATES';
          break;
        }

        case 'PRODUCTS':
        case 'STOCK': {
          const name = String(rawRow['Product Name*'] || rawRow['Product Name'] || rawRow['name'] || '').trim();
          const sku = String(rawRow['SKU*'] || rawRow['SKU'] || rawRow['sku'] || '').trim();
          const cat = String(rawRow['Category*'] || rawRow['Category'] || '').trim();
          const mrp = parseFloat(rawRow['MRP*'] || rawRow['MRP'] || 0);
          const pac = parseInt(rawRow['Carton Size (Pack)'] || rawRow['Carton Size'] || 24, 10);
          const weight = parseFloat(rawRow['Net Weight (g)'] || rawRow['Weight'] || 100);
          const gst = parseFloat(rawRow['GST Percent'] || 5);
          const stock = parseInt(rawRow['Current Stock'] || 0, 10);

          if (!name) errors.push('Product Name is required');
          if (!sku) {
            errors.push('Product SKU is required');
          } else if (existingSkus.has(sku.toLowerCase())) {
            errors.push(`Duplicate: Product with SKU '${sku}' already exists`);
          }
          if (isNaN(mrp) || mrp <= 0) errors.push('Valid MRP is required');

          sanitized.name = name;
          sanitized.sku = sku;
          sanitized.category = cat || 'General';
          sanitized.mrp = mrp;
          sanitized.price = mrp;
          sanitized.cartonSize = pac;
          sanitized.netWeightG = weight;
          sanitized.gstPercent = gst;
          sanitized.currentStock = stock;
          break;
        }

        default:
          errors.push(`Unsupported module validation: ${mod}`);
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++; else errorCount++;

      validationResults.push({
        rowNumber: rowNum,
        isValid,
        errors,
        data: sanitized,
        raw: rawRow
      });
    }

    // Clean up uploaded temporary file
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    res.json({
      success: true,
      data: {
        module: mod,
        filename: req.file.originalname,
        totalRows: rows.length,
        validCount,
        errorCount,
        results: validationResults
      }
    });
  } catch (error) {
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
    next(error);
  }
};

/**
 * POST /api/bulk-upload/commit
 * Commits verified rows to the database and logs history
 */
exports.commitUpload = async (req, res, next) => {
  try {
    const { module: mod, filename = 'bulk_import', rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows provided for import' });
    }

    const StoreModel = mongoose.model('Store');
    const ProductModel = mongoose.model('Product');
    const BulkUploadHistoryModel = mongoose.model('BulkUploadHistory');

    let successCount = 0;
    let failedCount = 0;
    const errors = [];
    const createdIds = [];

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      try {
        if (mod.toUpperCase() === 'STORES' || mod.toUpperCase() === 'SHOPS') {
          // Check for duplicate phone one last time
          if (item.phone) {
            const exists = await StoreModel.findOne({ phone: item.phone, isActive: true });
            if (exists) {
              failedCount++;
              errors.push({ row: i + 1, field: 'phone', message: `Duplicate phone number: ${item.phone}`, data: item });
              continue;
            }
          }

          const newStore = await StoreModel.create({
            name: item.name,
            ownerName: item.ownerName || '',
            phone: item.phone,
            address: item.address,
            city: item.city,
            pincode: item.pincode || '',
            state: item.state || 'Tamil Nadu',
            zone: item.zone || '',
            category: item.category || 'RETAIL',
            gstNumber: item.gstNumber || '',
            dealerId: item.dealerId || undefined,
            latitude: item.latitude || undefined,
            longitude: item.longitude || undefined,
            isLocationVerified: item.latitude && item.longitude ? false : false,
            locationStatus: item.latitude && item.longitude ? 'COORDINATES_CAPTURED' : 'PENDING_COORDINATES',
            manualAddress: item.address,
            isActive: true
          });

          createdIds.push(newStore._id);
          successCount++;
        } else if (mod.toUpperCase() === 'PRODUCTS' || mod.toUpperCase() === 'STOCK') {
          const newProd = await ProductModel.create({
            name: item.name,
            sku: item.sku,
            category: item.category,
            mrp: item.mrp,
            price: item.mrp,
            cartonSize: item.cartonSize || 24,
            netWeightG: item.netWeightG || 100,
            gstPercent: item.gstPercent || 5,
            isActive: true
          });

          createdIds.push(newProd._id);
          successCount++;
        }
      } catch (rowErr) {
        failedCount++;
        errors.push({ row: i + 1, field: 'save', message: rowErr.message, data: item });
      }
    }

    // Save Bulk Upload History record
    const historyDoc = await BulkUploadHistoryModel.create({
      module: mod.toUpperCase(),
      filename,
      totalRows: rows.length,
      successCount,
      failedCount,
      errors,
      uploadedBy: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      action: 'BULK_UPLOAD',
      entity: mod.toUpperCase(),
      entityId: historyDoc._id.toString(),
      recordTitle: `Bulk Import: ${filename}`,
      details: `Imported ${successCount} record(s) with ${failedCount} failure(s) into ${mod}`,
      req
    });

    res.json({
      success: true,
      message: `Bulk import completed: ${successCount} successful, ${failedCount} failed`,
      data: {
        historyId: historyDoc._id,
        successCount,
        failedCount,
        createdCount: createdIds.length,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bulk-upload/history
 * List historical bulk upload operations
 */
exports.getUploadHistory = async (req, res, next) => {
  try {
    const BulkUploadHistoryModel = mongoose.model('BulkUploadHistory');
    const history = await BulkUploadHistoryModel.find({})
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};
