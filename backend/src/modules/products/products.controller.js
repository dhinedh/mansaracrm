// src/modules/products/products.controller.js
const prisma = require('../../config/database');

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
      images
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
      images
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
