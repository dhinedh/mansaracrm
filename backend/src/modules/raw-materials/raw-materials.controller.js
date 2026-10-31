// src/modules/raw-materials/raw-materials.controller.js
const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');

// Initial default seed categories & items if database is freshly started
const DEFAULT_SEED_DATA = [
  {
    category: {
      name: 'Pulses & Legumes',
      code: 'RMC-PLS',
      description: 'Primary pulse flours and whole lentils used for base dough & crisp formulations',
      subCategories: ['Urad Dal (Black Gram)', 'Toor Dal', 'Moong Dal', 'Gram Flour (Besan)']
    },
    items: [
      {
        name: 'Urad Dal Flour - Super Fine Grade',
        sku: 'RM-PLS-URAD01',
        subCategory: 'Urad Dal (Black Gram)',
        unit: 'kg',
        costPerUnit: 115,
        currentStock: 1250,
        minStockLevel: 300,
        hsnCode: '1106',
        gstPercent: 0,
        storageCondition: 'Airtight dry silo, <12% humidity',
        specifications: 'Protein min 24%, Moisture max 10.5%, Fine 120 mesh'
      },
      {
        name: 'Pure Besan (Chana Dal Flour)',
        sku: 'RM-PLS-BSN01',
        subCategory: 'Gram Flour (Besan)',
        unit: 'kg',
        costPerUnit: 82,
        currentStock: 480,
        minStockLevel: 150,
        hsnCode: '1106',
        gstPercent: 0,
        storageCondition: 'Cool dry warehouse',
        specifications: '100% pure chana dal, zero adulteration, yellow tone'
      }
    ]
  },
  {
    category: {
      name: 'Grains & Millets',
      code: 'RMC-GRN',
      description: 'Nutritious millet flours and cereal grains for high-fibre, crunchy formulations',
      subCategories: ['Finger Millet (Ragi)', 'Pearl Millet (Bajra)', 'Fine Rice Flour', 'Corn Flour']
    },
    items: [
      {
        name: 'Finger Millet (Ragi) Flour',
        sku: 'RM-GRN-RAGI01',
        subCategory: 'Finger Millet (Ragi)',
        unit: 'kg',
        costPerUnit: 44,
        currentStock: 600,
        minStockLevel: 150,
        hsnCode: '1008',
        gstPercent: 0,
        storageCondition: 'Moisture-proof bags on pallets',
        specifications: 'Rich in dietary calcium, roasted aroma'
      },
      {
        name: 'Fine White Rice Flour - 100 Mesh',
        sku: 'RM-GRN-RICE01',
        subCategory: 'Fine Rice Flour',
        unit: 'kg',
        costPerUnit: 36,
        currentStock: 950,
        minStockLevel: 250,
        hsnCode: '1102',
        gstPercent: 0,
        storageCondition: 'Dry ambient warehouse',
        specifications: 'High gelatinization index for extra crispness'
      }
    ]
  },
  {
    category: {
      name: 'Spices & Condiments',
      code: 'RMC-SPC',
      description: 'Aromatic whole and grounded spices for traditional seasoning and flavour profiles',
      subCategories: ['Black Pepper', 'Cumin Seeds (Jeera)', 'Asafoetida (Hing)', 'Red Chili Powder', 'Ajwain']
    },
    items: [
      {
        name: 'Crushed Malabar Black Pepper Powder',
        sku: 'RM-SPC-PEP01',
        subCategory: 'Black Pepper',
        unit: 'kg',
        costPerUnit: 680,
        currentStock: 75,
        minStockLevel: 25,
        hsnCode: '0904',
        gstPercent: 5,
        storageCondition: 'Cool, dark spice cellar in airtight drums',
        specifications: 'Coarse ground 30-40 mesh, Piperine > 5.5%'
      },
      {
        name: 'Premium Cumin Seeds (Jeera)',
        sku: 'RM-SPC-JRA01',
        subCategory: 'Cumin Seeds (Jeera)',
        unit: 'kg',
        costPerUnit: 390,
        currentStock: 140,
        minStockLevel: 40,
        hsnCode: '0909',
        gstPercent: 5,
        storageCondition: 'Dry airtight storage',
        specifications: 'Purity 99.5%, Machine cleaned Sortex pass'
      },
      {
        name: 'Compounded Asafoetida (Hing)',
        sku: 'RM-SPC-HNG01',
        subCategory: 'Asafoetida (Hing)',
        unit: 'kg',
        costPerUnit: 1450,
        currentStock: 30,
        minStockLevel: 10,
        hsnCode: '1301',
        gstPercent: 5,
        storageCondition: 'Double sealed containers, ambient',
        specifications: 'Strong lingering pungent aroma, wheat starch base'
      }
    ]
  },
  {
    category: {
      name: 'Oils & Fats',
      code: 'RMC-OIL',
      description: 'Edible cooking oils for dough kneading and frying operations',
      subCategories: ['Refined Sunflower Oil', 'Cold Pressed Sesame (Gingelly) Oil', 'Palmolein Oil']
    },
    items: [
      {
        name: 'Refined Sunflower Oil',
        sku: 'RM-OIL-SUN01',
        subCategory: 'Refined Sunflower Oil',
        unit: 'L',
        costPerUnit: 122,
        currentStock: 600,
        minStockLevel: 200,
        hsnCode: '1512',
        gstPercent: 5,
        storageCondition: 'Stainless steel tanks',
        specifications: 'Free fatty acid < 0.15%, transparent pale yellow'
      },
      {
        name: 'Cold Pressed Sesame (Gingelly) Oil',
        sku: 'RM-OIL-SES01',
        subCategory: 'Cold Pressed Sesame (Gingelly) Oil',
        unit: 'L',
        costPerUnit: 265,
        currentStock: 110,
        minStockLevel: 30,
        hsnCode: '1515',
        gstPercent: 5,
        storageCondition: 'Opaque cool drums',
        specifications: 'Traditional wood-pressed, distinct nutty aroma'
      }
    ]
  },
  {
    category: {
      name: 'Packaging Materials',
      code: 'RMC-PKG',
      description: 'Food grade flexible laminates, nitrogen-flush pouches, and corrugated master cartons',
      subCategories: ['Printed Pouches', 'Outer Corrugated Boxes', 'Moisture Proof Liners', 'Adhesive Tapes']
    },
    items: [
      {
        name: '200g Laminated Moisture Barrier Pouch',
        sku: 'RM-PKG-PCH200',
        subCategory: 'Printed Pouches',
        unit: 'pcs',
        costPerUnit: 2.85,
        currentStock: 6500,
        minStockLevel: 2000,
        hsnCode: '3923',
        gstPercent: 18,
        storageCondition: 'Dust-free carton storage',
        specifications: 'PET / Met-PET / Poly 70 micron, food grade certified'
      },
      {
        name: 'Master Corrugated Shipper Box (50 pkts)',
        sku: 'RM-PKG-BOX50',
        subCategory: 'Outer Corrugated Boxes',
        unit: 'pcs',
        costPerUnit: 36,
        currentStock: 420,
        minStockLevel: 100,
        hsnCode: '4819',
        gstPercent: 18,
        storageCondition: 'Dry rack storage, elevated off ground',
        specifications: '5-ply Kraft 180 GSM, Bursting factor > 16'
      }
    ]
  }
];

// Helper to seed default data if collection is empty
async function ensureSeedData() {
  const RawMaterialCategory = mongoose.model('RawMaterialCategory');
  const RawMaterialItem = mongoose.model('RawMaterialItem');

  const count = await RawMaterialCategory.countDocuments();
  if (count === 0) {
    for (const group of DEFAULT_SEED_DATA) {
      let cat = await RawMaterialCategory.create(group.category);
      if (group.items && group.items.length > 0) {
        for (const item of group.items) {
          await RawMaterialItem.create({
            ...item,
            categoryId: cat._id,
            categoryName: cat.name
          });
        }
      }
    }
  }
}

// ─────────────────────────────────────────────
// RAW MATERIAL CATEGORY CONTROLLERS
// ─────────────────────────────────────────────

// GET /api/raw-materials/categories
exports.getCategories = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const RawMaterialItem = mongoose.model('RawMaterialItem');

    await ensureSeedData();

    const categories = await RawMaterialCategory.find().sort({ createdAt: -1 }).lean();

    // Attach item count and low stock count for each category
    const itemCounts = await RawMaterialItem.aggregate([
      {
        $group: {
          _id: '$categoryId',
          totalItems: { $sum: 1 },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const countMap = {};
    itemCounts.forEach(c => {
      countMap[c._id.toString()] = {
        totalItems: c.totalItems,
        lowStockItems: c.lowStockItems
      };
    });

    const enriched = categories.map(cat => ({
      ...cat,
      itemCount: countMap[cat._id.toString()]?.totalItems || 0,
      lowStockCount: countMap[cat._id.toString()]?.lowStockItems || 0
    }));

    res.json({
      success: true,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/raw-materials/categories
exports.createCategory = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const { name, code, description, subCategories, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const existing = await RawMaterialCategory.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    // Process subCategories
    let subs = [];
    if (Array.isArray(subCategories)) {
      subs = subCategories.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof subCategories === 'string' && subCategories.trim()) {
      subs = subCategories.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Auto-generate code if missing
    let genCode = code ? code.trim().toUpperCase() : `RMC-${trimmedName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const category = await RawMaterialCategory.create({
      name: trimmedName,
      code: genCode,
      description: description ? description.trim() : '',
      subCategories: [...new Set(subs)],
      status: status || 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Raw material category created successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/raw-materials/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const RawMaterialItem = mongoose.model('RawMaterialItem');
    const { id } = req.params;
    const { name, code, description, subCategories, status } = req.body;

    const category = await RawMaterialCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await RawMaterialCategory.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category with this name already exists' });
      }
      category.name = trimmedName;

      // Update cached categoryName on child items
      await RawMaterialItem.updateMany(
        { categoryId: category._id },
        { $set: { categoryName: trimmedName } }
      );
    }

    if (code) category.code = code.trim().toUpperCase();
    if (description !== undefined) category.description = description.trim();
    if (status) category.status = status;

    if (subCategories !== undefined) {
      let subs = [];
      if (Array.isArray(subCategories)) {
        subs = subCategories.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof subCategories === 'string') {
        subs = subCategories.split(',').map(s => s.trim()).filter(Boolean);
      }
      category.subCategories = [...new Set(subs)];
    }

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/raw-materials/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const RawMaterialItem = mongoose.model('RawMaterialItem');
    const { id } = req.params;

    const category = await RawMaterialCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const itemCount = await RawMaterialItem.countDocuments({ categoryId: id });
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: Contains ${itemCount} raw material products/items. Please reassign or delete these items first.`
      });
    }

    await RawMaterialCategory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Raw material category deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/raw-materials/categories/:id/subcategories
exports.addSubCategory = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const { id } = req.params;
    const { subCategory } = req.body;

    if (!subCategory || !subCategory.trim()) {
      return res.status(400).json({ success: false, message: 'Sub-category name is required' });
    }

    const trimmed = subCategory.trim();
    const category = await RawMaterialCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (!category.subCategories.includes(trimmed)) {
      category.subCategories.push(trimmed);
      await category.save();
    }

    res.json({
      success: true,
      message: `Sub-category "${trimmed}" added`,
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/raw-materials/categories/:id/subcategories/:subName
exports.removeSubCategory = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const RawMaterialItem = mongoose.model('RawMaterialItem');
    const { id, subName } = req.params;

    const category = await RawMaterialCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const decodedSub = decodeURIComponent(subName).trim();
    category.subCategories = category.subCategories.filter(s => s !== decodedSub);
    await category.save();

    // Clear subcategory for items that had this subcategory
    await RawMaterialItem.updateMany(
      { categoryId: id, subCategory: decodedSub },
      { $set: { subCategory: '' } }
    );

    res.json({
      success: true,
      message: `Sub-category "${decodedSub}" removed`,
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RAW MATERIAL PRODUCT / ITEM CONTROLLERS
// ─────────────────────────────────────────────

// GET /api/raw-materials/items
exports.getItems = async (req, res, next) => {
  try {
    const RawMaterialItem = mongoose.model('RawMaterialItem');
    const { categoryId, subCategory, search, status, lowStockOnly } = req.query;

    const query = {};

    if (categoryId) query.categoryId = categoryId;
    if (subCategory) query.subCategory = subCategory;
    if (status && status !== 'ALL') query.status = status;

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { categoryName: { $regex: q, $options: 'i' } },
        { subCategory: { $regex: q, $options: 'i' } },
        { hsnCode: { $regex: q, $options: 'i' } }
      ];
    }

    let items = await RawMaterialItem.find(query)
      .populate('categoryId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    if (lowStockOnly === 'true' || lowStockOnly === true) {
      items = items.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 10));
    }

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/raw-materials/items/:id
exports.getItemById = async (req, res, next) => {
  try {
    const RawMaterialItem = mongoose.model('RawMaterialItem');
    const item = await RawMaterialItem.findById(req.params.id)
      .populate('categoryId', 'name code subCategories')
      .lean();

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// POST /api/raw-materials/items
exports.createItem = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const RawMaterialItem = mongoose.model('RawMaterialItem');

    const {
      name,
      sku,
      categoryId,
      subCategory,
      unit,
      costPerUnit,
      currentStock,
      minStockLevel,
      hsnCode,
      gstPercent,
      storageCondition,
      specifications,
      notes,
      status
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Item / Product name is required' });
    }
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const category = await RawMaterialCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Selected Category does not exist' });
    }

    // Auto-generate or validate SKU
    let finalSku = sku ? sku.trim().toUpperCase() : '';
    if (!finalSku) {
      const prefix = category.code || 'RM';
      const count = await RawMaterialItem.countDocuments({ categoryId });
      finalSku = `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
    }

    // Check SKU duplicate
    const existingSku = await RawMaterialItem.findOne({ sku: finalSku });
    if (existingSku) {
      finalSku = `${finalSku}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure subCategory exists in category subCategories list
    const subCatTrimmed = subCategory ? subCategory.trim() : '';
    if (subCatTrimmed && !category.subCategories.includes(subCatTrimmed)) {
      category.subCategories.push(subCatTrimmed);
      await category.save();
    }

    const item = await RawMaterialItem.create({
      name: name.trim(),
      sku: finalSku,
      categoryId: category._id,
      categoryName: category.name,
      subCategory: subCatTrimmed,
      unit: unit ? unit.trim() : 'kg',
      costPerUnit: Number(costPerUnit) || 0,
      currentStock: Number(currentStock) || 0,
      minStockLevel: Number(minStockLevel) >= 0 ? Number(minStockLevel) : 10,
      hsnCode: hsnCode ? hsnCode.trim() : '',
      gstPercent: gstPercent !== undefined ? Number(gstPercent) : 5,
      storageCondition: storageCondition ? storageCondition.trim() : 'Cool & Dry',
      specifications: specifications ? specifications.trim() : '',
      notes: notes ? notes.trim() : '',
      status: status || 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Raw material product created successfully',
      data: item
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/raw-materials/items/:id
exports.updateItem = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const RawMaterialItem = mongoose.model('RawMaterialItem');
    const { id } = req.params;

    const item = await RawMaterialItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const {
      name,
      sku,
      categoryId,
      subCategory,
      unit,
      costPerUnit,
      currentStock,
      minStockLevel,
      hsnCode,
      gstPercent,
      storageCondition,
      specifications,
      notes,
      status
    } = req.body;

    if (name) item.name = name.trim();

    if (sku && sku.trim().toUpperCase() !== item.sku) {
      const existingSku = await RawMaterialItem.findOne({
        _id: { $ne: id },
        sku: sku.trim().toUpperCase()
      });
      if (existingSku) {
        return res.status(400).json({ success: false, message: 'SKU code already exists' });
      }
      item.sku = sku.trim().toUpperCase();
    }

    if (categoryId && categoryId.toString() !== item.categoryId.toString()) {
      const cat = await RawMaterialCategory.findById(categoryId);
      if (!cat) {
        return res.status(400).json({ success: false, message: 'Category does not exist' });
      }
      item.categoryId = cat._id;
      item.categoryName = cat.name;
    }

    if (subCategory !== undefined) {
      const subCatTrimmed = subCategory.trim();
      item.subCategory = subCatTrimmed;
      // Auto-add to category if new
      if (subCatTrimmed && item.categoryId) {
        const cat = await RawMaterialCategory.findById(item.categoryId);
        if (cat && !cat.subCategories.includes(subCatTrimmed)) {
          cat.subCategories.push(subCatTrimmed);
          await cat.save();
        }
      }
    }

    if (unit !== undefined) item.unit = unit.trim();
    if (costPerUnit !== undefined) item.costPerUnit = Number(costPerUnit) || 0;
    if (currentStock !== undefined) item.currentStock = Number(currentStock) || 0;
    if (minStockLevel !== undefined) item.minStockLevel = Number(minStockLevel) || 0;
    if (hsnCode !== undefined) item.hsnCode = hsnCode.trim();
    if (gstPercent !== undefined) item.gstPercent = Number(gstPercent) || 0;
    if (storageCondition !== undefined) item.storageCondition = storageCondition.trim();
    if (specifications !== undefined) item.specifications = specifications.trim();
    if (notes !== undefined) item.notes = notes.trim();
    if (status !== undefined) item.status = status;

    await item.save();

    res.json({
      success: true,
      message: 'Raw material product updated successfully',
      data: item
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/raw-materials/items/:id
exports.deleteItem = async (req, res, next) => {
  try {
    const RawMaterialItem = mongoose.model('RawMaterialItem');
    const item = await RawMaterialItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({
      success: true,
      message: `Raw material product "${item.name}" deleted successfully`
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// BULK UPLOAD & IMPORT CONTROLLERS
// ─────────────────────────────────────────────

/**
 * Helper to parse a line of CSV handling quotes
 */
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// POST /api/raw-materials/bulk-upload
exports.bulkUpload = async (req, res, next) => {
  try {
    const RawMaterialCategory = mongoose.model('RawMaterialCategory');
    const RawMaterialItem = mongoose.model('RawMaterialItem');

    let rows = [];

    // Support 1: Multipart file upload
    if (req.file) {
      const filePath = req.file.path;
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

        if (lines.length > 0) {
          const rawHeaders = parseCsvLine(lines[0]);
          const headers = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

          for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            const row = {};
            headers.forEach((h, idx) => {
              row[h] = cols[idx] !== undefined ? cols[idx].replace(/^"|"$/g, '') : '';
            });
            rows.push(row);
          }
        }
      } finally {
        // Clean up temp file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } 
    // Support 2: Direct JSON array payload in req.body.items or req.body
    else if (Array.isArray(req.body.items)) {
      rows = req.body.items;
    } else if (Array.isArray(req.body)) {
      rows = req.body;
    } else {
      return res.status(400).json({
        success: false,
        message: 'No CSV file or items array provided for bulk upload.'
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data rows found in uploaded bulk file.'
      });
    }

    // Load existing categories for fast mapping
    const existingCats = await RawMaterialCategory.find();
    const catMap = new Map();
    existingCats.forEach(c => {
      catMap.set(c.name.trim().toLowerCase(), c);
      if (c.code) catMap.set(c.code.trim().toUpperCase(), c);
    });

    let categoriesCreated = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let errors = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2; // considering header as row 1

      // Normalize field names
      const catName = row.categoryname || row.category || row.category_name || row['category name'] || '';
      const catCode = row.categorycode || row.catcode || row.category_code || '';
      const subCatName = row.subcategory || row.subcategoryname || row['sub category'] || row['sub-category'] || '';
      const itemName = row.itemname || row.productname || row.name || row['item name'] || row['product name'] || '';
      const sku = row.sku || row.itemcode || row.code || row['item code'] || '';
      const unit = row.unit || row.uom || 'kg';
      const cost = parseFloat(row.costperunit || row.cost || row.price || row.standardcost || 0);
      const stock = parseFloat(row.currentstock || row.stock || row.quantity || 0);
      const minStock = parseFloat(row.minstocklevel || row.minstock || row.reorderlevel || 10);
      const hsn = row.hsncode || row.hsn || '';
      const gst = parseFloat(row.gstpercent || row.gst || 5);
      const storage = row.storagecondition || row.storage || 'Cool & Dry';
      const specs = row.specifications || row.specs || '';
      const notes = row.notes || '';

      if (!catName.trim() && !itemName.trim()) {
        continue; // skip blank row
      }

      if (!catName.trim()) {
        errors.push({ row: rowNum, message: 'Missing category name' });
        continue;
      }

      // 1. Resolve or Create Category
      const catKey = catName.trim().toLowerCase();
      let category = catMap.get(catKey);

      if (!category) {
        const generatedCode = catCode.trim().toUpperCase() || `RMC-${catName.trim().slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        category = await RawMaterialCategory.create({
          name: catName.trim(),
          code: generatedCode,
          description: row.categorydescription || `Auto-created from bulk import`,
          subCategories: subCatName.trim() ? [subCatName.trim()] : []
        });
        catMap.set(catKey, category);
        categoriesCreated++;
      } else {
        // Ensure subcategory is tracked
        if (subCatName.trim() && !category.subCategories.includes(subCatName.trim())) {
          category.subCategories.push(subCatName.trim());
          await category.save();
        }
      }

      // 2. If row has an Item/Product, create or update it
      if (itemName.trim()) {
        const itemTrimmed = itemName.trim();
        const skuTrimmed = sku.trim().toUpperCase();

        // Search by SKU or (Name + CategoryId)
        let existingItem = null;
        if (skuTrimmed) {
          existingItem = await RawMaterialItem.findOne({ sku: skuTrimmed });
        }
        if (!existingItem) {
          existingItem = await RawMaterialItem.findOne({
            categoryId: category._id,
            name: { $regex: new RegExp(`^${itemTrimmed}$`, 'i') }
          });
        }

        if (existingItem) {
          // Update existing
          existingItem.costPerUnit = !isNaN(cost) ? cost : existingItem.costPerUnit;
          existingItem.currentStock = !isNaN(stock) ? stock : existingItem.currentStock;
          existingItem.minStockLevel = !isNaN(minStock) ? minStock : existingItem.minStockLevel;
          if (subCatName.trim()) existingItem.subCategory = subCatName.trim();
          if (unit) existingItem.unit = unit.trim();
          if (hsn) existingItem.hsnCode = hsn.trim();
          if (!isNaN(gst)) existingItem.gstPercent = gst;
          if (storage) existingItem.storageCondition = storage.trim();
          if (specs) existingItem.specifications = specs.trim();
          if (notes) existingItem.notes = notes.trim();

          await existingItem.save();
          itemsUpdated++;
        } else {
          // Create new item
          let finalSku = skuTrimmed;
          if (!finalSku) {
            const count = await RawMaterialItem.countDocuments({ categoryId: category._id });
            finalSku = `${category.code || 'RM'}-${(count + 1).toString().padStart(3, '0')}`;
          }

          // Check if collision
          const dupSku = await RawMaterialItem.findOne({ sku: finalSku });
          if (dupSku) {
            finalSku = `${finalSku}-${Math.floor(100 + Math.random() * 900)}`;
          }

          await RawMaterialItem.create({
            name: itemTrimmed,
            sku: finalSku,
            categoryId: category._id,
            categoryName: category.name,
            subCategory: subCatName.trim(),
            unit: unit.trim() || 'kg',
            costPerUnit: !isNaN(cost) ? cost : 0,
            currentStock: !isNaN(stock) ? stock : 0,
            minStockLevel: !isNaN(minStock) ? minStock : 10,
            hsnCode: hsn.trim(),
            gstPercent: !isNaN(gst) ? gst : 5,
            storageCondition: storage.trim() || 'Cool & Dry',
            specifications: specs.trim(),
            notes: notes.trim(),
            status: 'ACTIVE'
          });
          itemsCreated++;
        }
      }
    }

    res.json({
      success: true,
      message: `Bulk upload processed successfully: ${itemsCreated} products created, ${itemsUpdated} updated, ${categoriesCreated} new categories created.`,
      summary: {
        totalRows: rows.length,
        categoriesCreated,
        itemsCreated,
        itemsUpdated,
        errorsCount: errors.length,
        errors
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/raw-materials/template - Download Sample CSV Template
exports.downloadTemplate = async (req, res, next) => {
  try {
    const csvContent = [
      'Category Name,Category Code,Sub Category,Item Name,SKU,Unit,Cost Per Unit,Current Stock,Min Stock Level,HSN Code,GST Percent,Storage Condition,Specifications',
      '"Pulses & Legumes","RMC-PLS","Urad Dal (Black Gram)","Superfine Urad Flour","RM-PLS-001","kg",115,500,100,"1106",0,"Airtight Silo","Moisture < 10.5%"',
      '"Grains & Millets","RMC-GRN","Finger Millet (Ragi)","Roasted Ragi Powder","RM-GRN-001","kg",45,350,150,"1008",0,"Dry warehouse","High calcium grade"',
      '"Spices & Condiments","RMC-SPC","Black Pepper","Crushed Black Pepper","RM-SPC-001","kg",680,80,20,"0904",5,"Spice cellar","Piperine > 5%"',
      '"Packaging Materials","RMC-PKG","Printed Pouches","200g Laminated Moisture Pouch","RM-PKG-001","pcs",2.85,5000,1500,"3923",18,"Dust-free racks","70 micron multi-layer"'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="raw_materials_bulk_template.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

// GET /api/raw-materials/export - Export All Raw Material Categories & Items
exports.exportCsv = async (req, res, next) => {
  try {
    const RawMaterialItem = mongoose.model('RawMaterialItem');
    const items = await RawMaterialItem.find().populate('categoryId').sort({ categoryName: 1, name: 1 }).lean();

    const headers = [
      'Category Name',
      'Category Code',
      'Sub Category',
      'Item Name',
      'SKU',
      'Unit',
      'Cost Per Unit',
      'Current Stock',
      'Min Stock Level',
      'HSN Code',
      'GST Percent',
      'Storage Condition',
      'Specifications',
      'Status'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines = [headers.join(',')];

    items.forEach(item => {
      lines.push([
        escapeCsv(item.categoryName || item.categoryId?.name || ''),
        escapeCsv(item.categoryId?.code || ''),
        escapeCsv(item.subCategory || ''),
        escapeCsv(item.name || ''),
        escapeCsv(item.sku || ''),
        escapeCsv(item.unit || 'kg'),
        item.costPerUnit || 0,
        item.currentStock || 0,
        item.minStockLevel || 0,
        escapeCsv(item.hsnCode || ''),
        item.gstPercent || 0,
        escapeCsv(item.storageCondition || ''),
        escapeCsv(item.specifications || ''),
        escapeCsv(item.status || 'ACTIVE')
      ].join(','));
    });

    const csvContent = lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="mansara_raw_materials_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};
