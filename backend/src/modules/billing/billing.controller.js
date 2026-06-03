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

    const { storeId, items, notes } = req.body; // items: [{ productId, quantity, marginPct }]
    const dealerId = req.user.dealer.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one product' });
    }

    // 1. Verify store exists and belongs to dealer
    const store = await prisma.store.findFirst({
      where: { id: storeId, dealerId, isActive: true }
    });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found or unauthorized' });
    }

    // 2. Load dealer inventory & products to verify stock
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

      // Check dealer stock
      const dealerStock = await prisma.dealerInventory.findUnique({
        where: {
          dealerId_productId: { dealerId, productId: item.productId }
        }
      });

      if (!dealerStock || dealerStock.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}. Available: ${dealerStock ? dealerStock.quantity : 0}`
        });
      }

      // Determine margin percentage
      let marginPct = parseFloat(item.marginPct);
      if (isNaN(marginPct)) {
        // If not specified, look for configured margin, fallback to 0
        const configuredMargin = await prisma.margin.findFirst({
          where: {
            dealerId,
            OR: [
              { storeId },
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
      const lineGst = lineSubtotal * (gstPct / 100);
      const lineTotal = lineSubtotal + lineGst;

      calculatedSubtotal += lineSubtotal;
      calculatedGstTotal += lineGst;

      invoiceItemsDetails.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: basePrice,
        marginPct,
        sellingPrice,
        gstPercent: gstPct,
        gstAmount: lineGst,
        lineTotal
      });
    }

    const calculatedGrandTotal = calculatedSubtotal + calculatedGstTotal;

    // 3. Execute invoice generation in single secure Transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // A. Get & increment invoice sequence
      const seq = await tx.invoiceSequence.upsert({
        where: { id: 'singleton' },
        update: { lastNumber: { increment: 1 } },
        create: { id: 'singleton', lastNumber: 1, prefix: 'MF-INV' }
      });

      const invoiceNo = `${seq.prefix}-${String(seq.lastNumber).padStart(5, '0')}`;

      // B. Create Invoice
      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          dealerId,
          storeId,
          subtotal: calculatedSubtotal,
          totalGst: calculatedGstTotal,
          totalAmount: calculatedGrandTotal,
          status: 'GENERATED',
          notes,
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

      // C. Decrement Dealer Stock & Record Movement
      for (const item of invoiceItemsDetails) {
        const dealerStock = await tx.dealerInventory.findUnique({
          where: {
            dealerId_productId: { dealerId, productId: item.productId }
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
            referenceId: inv.id,
            notes: `Billed to store: ${store.name} in Invoice ${invoiceNo}`
          }
        });
      }

      // D. Send Notification to Admin & Dealer
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'INVOICE_GENERATED',
          title: 'Invoice Generated',
          message: `Invoice ${invoiceNo} generated for ${store.name}. Total amount: ₹${calculatedGrandTotal.toFixed(2)}`,
          metadata: { invoiceId: inv.id }
        }
      });

      return inv;
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
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
        dealer: true,
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
        dealer: true,
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
        dealer: true,
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

    const pdfBuffer = await generateInvoicePdf(html);

    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
