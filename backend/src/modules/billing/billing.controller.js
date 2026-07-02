// src/modules/billing/billing.controller.js
const prisma = require('../../config/database');
const { generateInvoicePdf } = require('../../utils/pdfGenerator');
const { buildInvoiceHtml, buildSimpleRetailInvoiceHtml, buildAgreementHtml } = require('../../utils/pdfTemplate');

// Helper to fetch company settings
const getCompanyDetails = () => {
  return {
    name: process.env.COMPANY_NAME || 'Mansara Foods Pvt. Ltd.',
    gstNumber: process.env.COMPANY_GST || '27AABCM1234F1Z5',
    address: process.env.COMPANY_ADDRESS || 'Mumbai, Maharashtra, India',
    phone: process.env.COMPANY_PHONE || '+91 98765 43210',
    email: process.env.COMPANY_EMAIL || 'info@mansarafoods.com'
  };
};

exports.createInvoice = async (req, res, next) => {
  try {
    if (req.user.role !== 'DEALER') {
      return res.status(403).json({ success: false, message: 'Only dealers can generate invoices' });
    }

    const { storeId, storeName, items, notes, isGstEnabled = true, shippingCharges = 0, isCredit = false } = req.body; // items: [{ productId, quantity, marginPct }]
    const dealerId = req.user.dealer.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one product' });
    }

    // 1. Verify store exists and belongs to dealer, or find/create it dynamically by name
    let store;
    if (storeId) {
      store = await prisma.store.findFirst({
        where: { id: storeId, dealerId, isActive: true }
      });
    } else if (storeName) {
      const trimmedName = storeName.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Store name cannot be empty' });
      }

      // Find store by name case-insensitively in JS
      const dealerStores = await prisma.store.findMany({
        where: { dealerId, isActive: true }
      });
      store = dealerStores.find(s => s.name.trim().toLowerCase() === trimmedName.toLowerCase());

      if (!store) {
        // Create new store on the fly
        store = await prisma.store.create({
          data: {
            name: trimmedName,
            dealerId,
            address: 'Added dynamically during invoice creation',
            isActive: true
          }
        });
      }
    }

    if (!store) {
      return res.status(404).json({ success: false, message: 'Target Store/Outlet not selected or created' });
    }

    // 2. Load dealer inventory & products to verify products exist
    const invoiceItemsDetails = [];
    let calculatedSubtotal = 0;
    let calculatedGstTotal = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      // Determine margin percentage
      let marginPct = parseFloat(item.marginPct);
      if (isNaN(marginPct)) {
        // Retrieve custom margins for this dealer (including default rules)
        const marginRules = await prisma.margin.findMany({
          where: {
            OR: [
              { dealerId },
              { isDefault: true }
            ]
          }
        });
        
        let foundMargin = null;
        const catId = product.categoryId?.toString() || product.category?.toString();
        
        // 1. Check rule matching storeId AND productId
        const storeProductRule = store ? marginRules.find(r => 
          r.storeId?.toString() === store.id?.toString() && 
          r.productId?.toString() === product.id?.toString() && 
          !r.isDefault
        ) : null;
        
        // 2. Check rule matching storeId AND categoryId
        const storeCategoryRule = store ? marginRules.find(r => 
          r.storeId?.toString() === store.id?.toString() && 
          r.categoryId?.toString() === catId && 
          !r.isDefault
        ) : null;
        
        // 3. Check rule matching storeId only in margin rules table
        const storeOnlyRule = store ? marginRules.find(r => 
          r.storeId?.toString() === store.id?.toString() && 
          !r.productId && !r.categoryId && 
          !r.isDefault
        ) : null;
        
        // 4. Fallback check: store's direct marginPercent property
        let storeDirectMargin = null;
        if (store && store.marginPercent !== undefined && store.marginPercent !== null && store.marginPercent !== '') {
          storeDirectMargin = parseFloat(store.marginPercent);
        }
        
        // 5. Check rule matching productId only (dealer-wide, no storeId)
        const productRule = marginRules.find(r => 
          !r.storeId && 
          r.productId?.toString() === product.id?.toString() && 
          !r.isDefault
        );
        
        // 6. Check rule matching categoryId only (dealer-wide, no storeId)
        const categoryRule = marginRules.find(r => 
          !r.storeId && 
          r.categoryId?.toString() === catId && 
          !r.isDefault
        );
        
        // 7. Check default margin rule
        const defaultRule = marginRules.find(r => r.isDefault);
        
        if (storeProductRule) {
          foundMargin = parseFloat(storeProductRule.marginPercent);
        } else if (storeCategoryRule) {
          foundMargin = parseFloat(storeCategoryRule.marginPercent);
        } else if (storeOnlyRule) {
          foundMargin = parseFloat(storeOnlyRule.marginPercent);
        } else if (storeDirectMargin !== null && !isNaN(storeDirectMargin)) {
          foundMargin = storeDirectMargin;
        } else if (productRule) {
          foundMargin = parseFloat(productRule.marginPercent);
        } else if (categoryRule) {
          foundMargin = parseFloat(categoryRule.marginPercent);
        } else if (defaultRule) {
          foundMargin = parseFloat(defaultRule.marginPercent);
        }
        
        marginPct = foundMargin !== null ? foundMargin : 10; // default margin fallback
      }

      // Determine unit and quantity normalization
      const unit = item.unit || 'PCS';
      const cartonSize = product.cartonSize || 24;
      const qtyInPieces = unit === 'CTN' ? (item.quantity * cartonSize) : item.quantity;

      // Calculations:
      // sellingPrice = MRP * (1 - marginPct/100)
      const mrp = parseFloat(product.mrp || product.price || 0);
      const sellingPrice = mrp * (1 - marginPct / 100);
      const gstPct = parseFloat(product.gstPercent);
      
      const lineSubtotal = sellingPrice * qtyInPieces;
      const lineGst = isGstEnabled ? (lineSubtotal * (gstPct / 100)) : 0;
      const lineTotal = lineSubtotal + lineGst;

      calculatedSubtotal += lineSubtotal;
      calculatedGstTotal += lineGst;

      invoiceItemsDetails.push({
        productId: item.productId,
        quantity: qtyInPieces,
        unit: unit,
        unitPrice: mrp, // store MRP as reference price
        marginPct,
        sellingPrice,
        gstPercent: isGstEnabled ? gstPct : 0,
        gstAmount: isGstEnabled ? lineGst : 0,
        lineTotal
      });
    }

    const calculatedGrandTotal = calculatedSubtotal + calculatedGstTotal + parseFloat(shippingCharges || 0);

    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId }
    });

    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer profile not found' });
    }

    // 3. Execute invoice generation in single secure Transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // A. Get & increment invoice sequence
      const seqId = dealer.invoicePrefix ? `dealer_${dealerId}` : 'singleton';
      const defaultPrefix = dealer.invoicePrefix ? dealer.invoicePrefix : 'MF-INV';

      const seq = await tx.invoiceSequence.upsert({
        where: { id: seqId },
        update: { lastNumber: { increment: 1 } },
        create: { id: seqId, lastNumber: 1, prefix: defaultPrefix }
      });

      // Ensure the sequence prefix is up to date with the dealer's profile setting
      if (dealer.invoicePrefix && seq.prefix !== dealer.invoicePrefix) {
        await tx.invoiceSequence.update({
          where: { id: seqId },
          data: { prefix: dealer.invoicePrefix }
        });
        seq.prefix = dealer.invoicePrefix;
      }

      const invoiceNo = `${seq.prefix}-${String(seq.lastNumber).padStart(5, '0')}`;

      let dueDate = null;
      if (isCredit) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);
      }

      // B. Create Invoice as OPEN
      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          dealerId,
          storeId: store.id,
          subtotal: calculatedSubtotal,
          totalGst: calculatedGstTotal,
          cgst: isGstEnabled ? (calculatedGstTotal / 2) : 0,
          sgst: isGstEnabled ? (calculatedGstTotal / 2) : 0,
          isGstEnabled: !!isGstEnabled,
          totalAmount: calculatedGrandTotal,
          shippingCharges: parseFloat(shippingCharges || 0),
          status: 'OPEN',
          notes,
          isCredit: !!isCredit,
          dueDate,
          items: {
            create: invoiceItemsDetails
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          dealer: true,
          store: true
        }
      });

      // D. Send Notification to Admin & Dealer
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'INVOICE_GENERATED',
          title: isCredit ? 'Invoice Created on Credit (Open)' : 'Invoice Created (Open)',
          message: `Invoice ${invoiceNo} created as ${isCredit ? 'CREDIT (Open)' : 'OPEN'} for ${store.name}. Total amount: ₹${calculatedGrandTotal.toFixed(2)}`,
          metadata: { invoiceId: inv.id }
        }
      });

      return inv;
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully as OPEN',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

exports.closeInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dealerId = req.user.dealer?.id;

    if (!dealerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
        store: true,
        dealer: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Verify ownership
    if (req.user.role === 'DEALER' && invoice.dealerId !== dealerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (invoice.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: `Invoice is already ${invoice.status}` });
    }

    // Verify stock levels for all items first
    for (const item of invoice.items) {
      const dealerStock = await prisma.dealerInventory.findUnique({
        where: {
          dealerId_productId: { dealerId: invoice.dealerId, productId: item.productId }
        }
      });

      if (!dealerStock || dealerStock.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${item.product.name}. Available: ${dealerStock ? dealerStock.quantity : 0}`
        });
      }
    }

    // Process stock deduction in a transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      for (const item of invoice.items) {
        const dealerStock = await tx.dealerInventory.findUnique({
          where: {
            dealerId_productId: { dealerId: invoice.dealerId, productId: item.productId }
          }
        });

        await tx.dealerInventory.update({
          where: { id: dealerStock.id },
          data: { quantity: dealerStock.quantity - item.quantity }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            referenceId: invoice.id,
            notes: `Billed to store: ${invoice.store ? invoice.store.name : 'Store'} in Invoice ${invoice.invoiceNo}`
          }
        });
      }

      const inv = await tx.invoice.update({
        where: { id },
        data: { status: 'CLOSED' },
        include: {
          items: {
            include: { product: true }
          },
          dealer: {
            include: { user: true }
          },
          store: true
        }
      });

      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'INVOICE_GENERATED',
          title: 'Invoice Closed',
          message: `Invoice ${invoice.invoiceNo} has been CLOSED and stock deducted.`,
          metadata: { invoiceId: invoice.id }
        }
      });

      return inv;
    });

    res.json({
      success: true,
      message: 'Invoice closed and stock updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dealerId = req.user.dealer?.id;

    if (!dealerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Verify ownership
    if (req.user.role === 'DEALER' && invoice.dealerId !== dealerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (invoice.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Only OPEN invoices can be deleted' });
    }

    await prisma.$transaction(async (tx) => {
      // Delete invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      // Delete invoice
      await tx.invoice.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'DELETE_INVOICE',
          entity: 'Invoice',
          entityId: id,
          newValues: { invoiceNo: invoice.invoiceNo }
        }
      });
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};


exports.getInvoices = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'DEALER') {
      where.dealerId = req.user.dealer.id;
    } else if (req.query.dealerId) {
      where.dealerId = req.query.dealerId;
    }

    if (req.query.storeId) {
      where.storeId = req.query.storeId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        store: true,
        dealer: {
          include: { user: true }
        },
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        store: true,
        dealer: {
          include: { user: true }
        },
        items: {
          include: { product: true }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Auth verification
    if (req.user.role === 'DEALER' && invoice.dealerId !== req.user.dealer.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

exports.downloadPdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        store: true,
        dealer: {
          include: { user: true }
        },
        items: {
          include: { product: true }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'DEALER' && invoice.dealerId !== req.user.dealer.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const company = getCompanyDetails();
    // Use simple retail template for dealer→store invoices; full B2B template for warehouse→dealer invoices
    const html = invoice.store
      ? buildSimpleRetailInvoiceHtml(company, invoice)
      : buildInvoiceHtml(company, invoice);

    try {
      const pdfBuffer = await generateInvoicePdf(html);
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceNo}.pdf"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      // Puppeteer unavailable or crashed — serve printable HTML page as fallback
      console.warn(`PDF generation failed for ${invoice.invoiceNo}, falling back to HTML:`, pdfErr.message);
      // Inject auto-print script into HTML
      const printableHtml = html.replace(
        '</body>',
        '<script>window.onload=function(){window.print();}</script></body>'
      );
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoice.invoiceNo}.html"`);
      res.send(printableHtml);
    }
  } catch (error) {
    next(error);
  }
};

exports.downloadAgreementPdf = async (req, res, next) => {
  try {
    const { dealerId } = req.params;

    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      include: {
        user: true
      }
    });

    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer not found' });
    }

    // Auth verification: ADMINs can download any agreement; DEALER can only download their own
    if (req.user.role === 'DEALER' && req.user.dealer?.id !== dealerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const company = getCompanyDetails();
    const html = buildAgreementHtml(company, dealer);

    try {
      const pdfBuffer = await generateInvoicePdf(html);
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Agreement_${dealer.companyName.replace(/\s+/g, '_')}.pdf"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.warn(`PDF agreement generation failed for ${dealer.companyName}, falling back to HTML:`, pdfErr.message);
      const printableHtml = html.replace(
        '</body>',
        '<script>window.onload=function(){window.print();}</script></body>'
      );
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="Agreement_${dealer.companyName.replace(/\s+/g, '_')}.html"`);
      res.send(printableHtml);
    }
  } catch (error) {
    next(error);
  }
};

exports.fulfillInvoiceItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // array of { productId, quantity }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Fulfillment list cannot be empty' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        dealer: true,
        store: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: `Only OPEN invoices can be fulfilled. Current status is ${invoice.status}` });
    }

    // Process fulfillment in a transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      for (const fItem of items) {
        const invItem = invoice.items.find(i => i.productId.toString() === fItem.productId.toString());
        if (!invItem) {
          throw new Error(`Product ${fItem.productId} is not part of this invoice`);
        }

        const qtyToFulfill = parseInt(fItem.quantity || 0);
        if (qtyToFulfill <= 0) continue;

        const currentFulfilled = invItem.fulfilledQuantity || 0;
        const newFulfilled = currentFulfilled + qtyToFulfill;

        if (newFulfilled > invItem.quantity) {
          throw new Error(`Cannot fulfill ${qtyToFulfill} units for product ${fItem.productId}. Only ${invItem.quantity - currentFulfilled} units remain pending.`);
        }

        // Deduct from dealer inventory
        const dealerStock = await tx.dealerInventory.findUnique({
          where: {
            dealerId_productId: { dealerId: invoice.dealerId, productId: fItem.productId }
          }
        });

        if (!dealerStock || dealerStock.quantity < qtyToFulfill) {
          const prod = await tx.product.findUnique({ where: { id: fItem.productId } });
          throw new Error(`Insufficient stock for product ${prod ? prod.name : fItem.productId} in dealer warehouse. Available: ${dealerStock ? dealerStock.quantity : 0}`);
        }

        // Update dealer stock
        await tx.dealerInventory.update({
          where: { id: dealerStock.id },
          data: { quantity: dealerStock.quantity - qtyToFulfill }
        });

        // Log StockMovement
        await tx.stockMovement.create({
          data: {
            productId: fItem.productId,
            type: 'OUT',
            quantity: qtyToFulfill,
            referenceId: invoice.id,
            notes: `Fulfillment delivered to store: ${invoice.store ? invoice.store.name : 'Store'} in Invoice ${invoice.invoiceNo}`
          }
        });

        // Update InvoiceItem's fulfilledQuantity
        await tx.invoiceItem.update({
          where: { id: invItem.id },
          data: { fulfilledQuantity: newFulfilled }
        });
      }

      // Reload invoice items to check if fully fulfilled
      const reloadedItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id }
      });

      const allFulfilled = reloadedItems.every(i => (i.fulfilledQuantity || 0) >= i.quantity);

      let finalStatus = 'OPEN';
      if (allFulfilled) {
        finalStatus = 'CLOSED';
      }

      const inv = await tx.invoice.update({
        where: { id },
        data: { status: finalStatus },
        include: {
          items: {
            include: { product: true }
          },
          dealer: true,
          store: true
        }
      });

      // Send notification if closed
      if (allFulfilled) {
        await tx.notification.create({
          data: {
            userId: req.user.id,
            type: 'INVOICE_GENERATED',
            title: 'Invoice Fully Fulfilled',
            message: `Invoice ${invoice.invoiceNo} has been fully fulfilled and closed.`,
            metadata: { invoiceId: invoice.id }
          }
        });
      }

      return inv;
    });

    res.json({
      success: true,
      message: updatedInvoice.status === 'CLOSED' ? 'Invoice fully fulfilled and closed' : 'Fulfillment updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.adjustInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, shippingCharges } = req.body; // items: [{ productId, quantity, marginPct, unit }]

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Adjusted invoice must contain at least one product' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        dealer: true,
        store: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: `Only OPEN invoices can be adjusted. Current status is ${invoice.status}` });
    }

    // Recalculate invoice subtotal, GST,cgst, sgst, totalAmount based on the new items list
    let calculatedSubtotal = 0;
    let calculatedGstTotal = 0;
    const invoiceItemsDetails = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      let marginPct = parseFloat(item.marginPct);
      if (isNaN(marginPct)) {
        marginPct = 10;
      }

      const unit = item.unit || 'PCS';
      const cartonSize = product.cartonSize || 24;
      const qtyInPieces = unit === 'CTN' ? (item.quantity * cartonSize) : item.quantity;

      const mrp = parseFloat(product.mrp || product.price || 0);
      const sellingPrice = mrp * (1 - marginPct / 100);
      const gstPct = parseFloat(product.gstPercent || 0);
      
      const lineSubtotal = sellingPrice * qtyInPieces;
      const lineGst = invoice.isGstEnabled ? (lineSubtotal * (gstPct / 100)) : 0;
      const lineTotal = lineSubtotal + lineGst;

      calculatedSubtotal += lineSubtotal;
      calculatedGstTotal += lineGst;

      invoiceItemsDetails.push({
        productId: item.productId,
        quantity: qtyInPieces,
        unit: unit,
        unitPrice: mrp,
        marginPct,
        sellingPrice,
        gstPercent: invoice.isGstEnabled ? gstPct : 0,
        gstAmount: invoice.isGstEnabled ? lineGst : 0,
        lineTotal,
        fulfilledQuantity: 0
      });
    }

    const finalShipping = shippingCharges !== undefined ? parseFloat(shippingCharges) : invoice.shippingCharges;
    const calculatedGrandTotal = calculatedSubtotal + calculatedGstTotal + finalShipping;

    const adjustedInvoice = await prisma.$transaction(async (tx) => {
      // Delete old invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      // Update invoice info and create new items
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          subtotal: calculatedSubtotal,
          totalGst: calculatedGstTotal,
          cgst: invoice.isGstEnabled ? (calculatedGstTotal / 2) : 0,
          sgst: invoice.isGstEnabled ? (calculatedGstTotal / 2) : 0,
          totalAmount: calculatedGrandTotal,
          shippingCharges: finalShipping,
          items: {
            create: invoiceItemsDetails
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          dealer: true,
          store: true
        }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ADJUST_INVOICE',
          entity: 'Invoice',
          entityId: id,
          newValues: { invoiceNo: invoice.invoiceNo, totalAmount: calculatedGrandTotal }
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Invoice adjusted successfully',
      data: adjustedInvoice
    });

  } catch (error) {
    next(error);
  }
};

