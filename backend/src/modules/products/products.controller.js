// src/modules/products/products.controller.js
const prisma = require('../../config/database');
const fs = require('fs');
const readline = require('readline');

// ─────────────────────────────────────────────
// CATEGORY CONTROLLERS
// ─────────────────────────────────────────────

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { name, description }
    });

    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PRODUCT CONTROLLERS
// ─────────────────────────────────────────────

exports.getProducts = async (req, res, next) => {
  try {
    const { categoryId, search, minStock } = req.query;

    const where = { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        companyStock: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        companyStock: true
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      description,
      price,
      mrp,
      gstPercent,
      hsnCode,
      categoryId,
      unit,
      minOrderQty,
      initialStock,
      slug,
      offerPrice,
      isFeatured,
      isNewArrival,
      isOffer,
      ingredients,
      howToUse,
      storage,
      weight,
      images,
      pacQuantity
    } = req.body;

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Product with this SKU already exists' });
    }

    // Set image path if uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          sku,
          description,
          price: parseFloat(price),
          mrp: mrp ? parseFloat(mrp) : null,
          gstPercent: parseFloat(gstPercent),
          hsnCode,
          categoryId,
          imageUrl,
          unit: unit || 'PCS',
          minOrderQty: minOrderQty ? parseInt(minOrderQty) : 1,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          offerPrice: offerPrice ? parseFloat(offerPrice) : null,
          isFeatured: isFeatured === 'true' || isFeatured === true,
          isNewArrival: isNewArrival === 'true' || isNewArrival === true,
          isOffer: isOffer === 'true' || isOffer === true,
          ingredients,
          howToUse,
          storage,
          weight,
          pacQuantity: pacQuantity ? parseInt(pacQuantity) : null,
          images: Array.isArray(images) ? images : (images ? [images] : [])
        }
      });

      // Initialize company stock
      const stock = await tx.companyInventory.create({
        data: {
          productId: p.id,
          quantity: initialStock ? parseInt(initialStock) : 0,
          minQuantity: 10
        }
      });

      if (initialStock && parseInt(initialStock) > 0) {
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            type: 'IN',
            quantity: parseInt(initialStock),
            notes: 'Initial Stock Setup'
          }
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE_PRODUCT',
          entity: 'Product',
          entityId: p.id,
          newValues: { name, sku, price, initialStock }
        }
      });

      return { ...p, companyStock: stock };
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      price,
      mrp,
      gstPercent,
      hsnCode,
      categoryId,
      unit,
      minOrderQty,
      slug,
      offerPrice,
      isFeatured,
      isNewArrival,
      isOffer,
      ingredients,
      howToUse,
      storage,
      weight,
      images,
      pacQuantity
    } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (sku && sku !== existing.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku } });
      if (skuCheck) {
        return res.status(400).json({ success: false, message: 'Product with this SKU already exists' });
      }
    }

    let imageUrl = existing.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: {
          name: name || existing.name,
          sku: sku || existing.sku,
          description: description !== undefined ? description : existing.description,
          price: price ? parseFloat(price) : existing.price,
          mrp: mrp ? parseFloat(mrp) : existing.mrp,
          gstPercent: gstPercent ? parseFloat(gstPercent) : existing.gstPercent,
          hsnCode: hsnCode !== undefined ? hsnCode : existing.hsnCode,
          categoryId: categoryId || existing.categoryId,
          imageUrl,
          unit: unit || existing.unit,
          minOrderQty: minOrderQty ? parseInt(minOrderQty) : existing.minOrderQty,
          slug: slug !== undefined ? slug : existing.slug,
          offerPrice: offerPrice !== undefined ? (offerPrice ? parseFloat(offerPrice) : null) : existing.offerPrice,
          isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : existing.isFeatured,
          isNewArrival: isNewArrival !== undefined ? (isNewArrival === 'true' || isNewArrival === true) : existing.isNewArrival,
          isOffer: isOffer !== undefined ? (isOffer === 'true' || isOffer === true) : existing.isOffer,
          ingredients: ingredients !== undefined ? ingredients : existing.ingredients,
          howToUse: howToUse !== undefined ? howToUse : existing.howToUse,
          storage: storage !== undefined ? storage : existing.storage,
          weight: weight !== undefined ? weight : existing.weight,
          pacQuantity: pacQuantity !== undefined ? (pacQuantity ? parseInt(pacQuantity) : null) : existing.pacQuantity,
          images: images !== undefined ? (Array.isArray(images) ? images : [images]) : existing.images
        }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE_PRODUCT',
          entity: 'Product',
          entityId: id,
          oldValues: existing,
          newValues: p
        }
      });

      return p;
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // soft delete
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { isActive: false }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'DELETE_PRODUCT',
          entity: 'Product',
          entityId: id
        }
      });
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// BULK UPLOAD
// ─────────────────────────────────────────────

/**
 * Expected CSV columns (first row = header, case-insensitive):
 * name, sku, description, price, mrp, gstPercent, hsnCode, categoryId,
 * unit, minOrderQty, initialStock, weight, offerPrice,
 * isFeatured, isNewArrival, isOffer, ingredients, howToUse, storage
 *
 * Only name, sku, price, gstPercent, categoryId are required.
 */
exports.bulkUploadProducts = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No CSV file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    // ── Parse CSV ──────────────────────────────────────────────────
    const rows = await new Promise((resolve, reject) => {
      const lines = [];
      let headers = null;

      const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed) return; // skip empty lines

        // Simple CSV split – handles quoted fields
        const cols = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < trimmed.length; i++) {
          const ch = trimmed[i];
          if (ch === '"') {
            inQuote = !inQuote;
          } else if (ch === ',' && !inQuote) {
            cols.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        cols.push(cur.trim());

        if (!headers) {
          headers = cols.map(h => h.toLowerCase().replace(/\s+/g, ''));
        } else {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
          lines.push(obj);
        }
      });

      rl.on('close', () => resolve(lines));
      rl.on('error', reject);
    });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'CSV file is empty or has no data rows.' });
    }

    // ── Fetch categories once for validation ──────────────────────
    const categories = await prisma.category.findMany({ select: { id: true, name: true } });
    const catById = new Map(categories.map(c => [c.id, c]));
    const catByName = new Map(categories.map(c => [c.name.toLowerCase(), c]));

    // ── Process each row ──────────────────────────────────────────
    const results = [];
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header

      const rowResult = { row: rowNum, sku: row.sku || '(no sku)', name: row.name || '(no name)', status: '', message: '' };

      // ── Validate required fields ────────────────────────────────
      const requiredMissing = [];
      if (!row.name)        requiredMissing.push('name');
      if (!row.sku)         requiredMissing.push('sku');
      if (!row.price)       requiredMissing.push('price');
      if (!row.gstpercent && !row.gstPercent) requiredMissing.push('gstPercent');
      if (!row.categoryid && !row.categoryId && !row.category) requiredMissing.push('categoryId or category');

      if (requiredMissing.length) {
        rowResult.status = 'error';
        rowResult.message = `Missing required: ${requiredMissing.join(', ')}`;
        results.push(rowResult);
        errors++;
        continue;
      }

      // ── Resolve category ────────────────────────────────────────
      const catInput = (row.categoryid || row.categoryId || '').trim();
      const catNameInput = (row.category || '').trim();
      let resolvedCatId = null;

      if (catInput && catById.has(catInput)) {
        resolvedCatId = catInput;
      } else if (catNameInput && catByName.has(catNameInput.toLowerCase())) {
        resolvedCatId = catByName.get(catNameInput.toLowerCase()).id;
      } else {
        // Try matching by name from categoryId column too
        const tryByName = catByName.get(catInput.toLowerCase());
        if (tryByName) resolvedCatId = tryByName.id;
      }

      if (!resolvedCatId) {
        rowResult.status = 'error';
        rowResult.message = `Category not found: "${catInput || catNameInput}"`;
        results.push(rowResult);
        errors++;
        continue;
      }

      // ── Check SKU uniqueness ────────────────────────────────────
      try {
        const existing = await prisma.product.findUnique({ where: { sku: row.sku.trim() } });
        if (existing) {
          rowResult.status = 'skipped';
          rowResult.message = `SKU already exists: ${row.sku}`;
          results.push(rowResult);
          skipped++;
          continue;
        }
      } catch (e) {
        rowResult.status = 'error';
        rowResult.message = `DB lookup failed: ${e.message}`;
        results.push(rowResult);
        errors++;
        continue;
      }

      // ── Create product ──────────────────────────────────────────
      try {
        const gstVal  = parseFloat(row.gstpercent || row.gstPercent || '0');
        const priceVal = parseFloat(row.price);
        const mrpVal  = row.mrp ? parseFloat(row.mrp) : null;
        const offerPriceVal = (row.offerprice || row.offerPrice) ? parseFloat(row.offerprice || row.offerPrice) : null;
        const initialStock  = (row.initialstock || row.initialStock) ? parseInt(row.initialstock || row.initialStock) : 0;
        const minOrderQty   = (row.minorderqty || row.minOrderQty) ? parseInt(row.minorderqty || row.minOrderQty) : 1;
        const nameStr = row.name.trim();

        await prisma.$transaction(async (tx) => {
          const p = await tx.product.create({
            data: {
              name:        nameStr,
              sku:         row.sku.trim(),
              description: (row.description || '').trim() || nameStr,
              price:       priceVal,
              mrp:         mrpVal,
              gstPercent:  gstVal,
              hsnCode:     (row.hsncode || row.hsnCode || '').trim() || null,
              categoryId:  resolvedCatId,
              unit:        (row.unit || 'PCS').trim().toUpperCase(),
              minOrderQty,
              slug:        nameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + row.sku.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              offerPrice:  offerPriceVal,
              isFeatured:  ['true', '1', 'yes'].includes((row.isfeatured || row.isFeatured || '').toLowerCase()),
              isNewArrival:['true', '1', 'yes'].includes((row.isnewarrival || row.isNewArrival || '').toLowerCase()),
              isOffer:     ['true', '1', 'yes'].includes((row.isoffer || row.isOffer || '').toLowerCase()),
              ingredients: (row.ingredients || '').trim() || null,
              howToUse:    (row.howtouse || row.howToUse || '').trim() || null,
              storage:     (row.storage || '').trim() || null,
              weight:      (row.weight || '').trim() || null,
              images:      []
            }
          });

          await tx.companyInventory.create({
            data: { productId: p.id, quantity: initialStock, minQuantity: 10 }
          });

          if (initialStock > 0) {
            await tx.stockMovement.create({
              data: { productId: p.id, type: 'IN', quantity: initialStock, notes: 'Bulk Upload Initial Stock' }
            });
          }

          await tx.auditLog.create({
            data: {
              userId: req.user.id,
              action: 'BULK_CREATE_PRODUCT',
              entity: 'Product',
              entityId: p.id,
              newValues: { name: nameStr, sku: row.sku, price: priceVal }
            }
          });
        });

        rowResult.status = 'created';
        rowResult.message = 'Product created successfully';
        results.push(rowResult);
        created++;
      } catch (e) {
        rowResult.status = 'error';
        rowResult.message = `Failed to create: ${e.message}`;
        results.push(rowResult);
        errors++;
      }
    }

    // Cleanup temp CSV file
    fs.unlink(filePath, () => {});

    res.json({
      success: true,
      summary: { total: rows.length, created, skipped, errors },
      results
    });
  } catch (error) {
    // Cleanup on fatal parse error
    fs.unlink(filePath, () => {});
    next(error);
  }
};
