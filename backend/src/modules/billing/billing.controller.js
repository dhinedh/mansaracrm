// src/modules/billing/billing.controller.js
const prisma = require('../../config/database');
const { generateInvoicePdf } = require('../../utils/pdfGenerator');
const { buildInvoiceHtml } = require('../../utils/pdfTemplate');

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
        // If not specified, look for configured margin, fallback to 0
        const configuredMargin = await prisma.margin.findFirst({
          where: {
            dealerId,
            OR: [
              { storeId: store.id },
              { productId: item.productId },
              { categoryId: product.categoryId }
            ]
          }
        });
        marginPct = configuredMargin ? parseFloat(configuredMargin.marginPercent) : 0;
      }

      // Calculations:
      // sellingPrice = base price * (1 + marginPct/100)
      const basePrice = parseFloat(product.price);
      const sellingPrice = basePrice * (1 + marginPct / 100);
      const gstPct = parseFloat(product.gstPercent);
      
      const lineSubtotal = sellingPrice * item.quantity;
      const lineGst = isGstEnabled ? (lineSubtotal * (gstPct / 100)) : 0;
      const lineTotal = lineSubtotal + lineGst;

      calculatedSubtotal += lineSubtotal;
      calculatedGstTotal += lineGst;

      invoiceItemsDetails.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: basePrice,
        marginPct,
        sellingPrice,
        gstPercent: isGstEnabled ? gstPct : 0,
        gstAmount: isGstEnabled ? lineGst : 0,
        lineTotal
      });
    }

    const calculatedGrandTotal = calculatedSubtotal + calculatedGstTotal + parseFloat(shippingCharges || 0);

    // 3. Execute invoice generation in single secure Transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // A. Get & increment invoice sequence
      const seq = await tx.invoiceSequence.upsert({
        where: { id: 'singleton' },
        update: { lastNumber: { increment: 1 } },
        create: { id: 'singleton', lastNumber: 1, prefix: 'MF-INV' }
      });

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
    const html = buildInvoiceHtml(company, invoice);

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

