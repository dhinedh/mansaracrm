// src/modules/billing/billing.controller.js
const prisma = require('../../config/database');
const { generateInvoicePdf } = require('../../utils/pdfGenerator');
const { buildInvoiceHtml, buildSimpleRetailInvoiceHtml, buildAgreementHtml, buildClosureAgreementHtml } = require('../../utils/pdfTemplate');
const { getOrAssignDealerAgreementNumber, getOrAssignDealerClosureAgreementNumber } = require('../../utils/agreementSequence');
const { mergeAppointmentTemplate, mergeClosureTemplate } = require('../../utils/defaultAgreementTemplates');
const centralNotificationService = require('../../utils/centralNotificationService');


// Helper to fetch company settings dynamically
const getCompanyDetails = async (dealer = null) => {
  let settings = null;
  try {
    settings = await prisma.setting.findFirst({
      where: { key: 'invoice_settings' }
    });
    if (!settings) {
      settings = await prisma.setting.findFirst({
        where: { key: 'site_settings' }
      });
    }
  } catch (err) {
    console.error('Error loading invoice settings from DB:', err.message);
  }

  const base = {
    name: settings?.companyName || process.env.COMPANY_NAME || 'Mansara Foods Pvt. Ltd.',
    companyName: settings?.companyName || process.env.COMPANY_NAME || 'Mansara Foods Pvt. Ltd.',
    logoBase64: settings?.logoBase64 || '',
    logoUrl: settings?.logoUrl || '',
    gstNumber: settings?.gstNumber || process.env.COMPANY_GST || '27AABCM1234F1Z5',
    address: settings?.address || process.env.COMPANY_ADDRESS || 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal',
    city: settings?.city || process.env.COMPANY_CITY || 'Chennai',
    state: settings?.state || process.env.COMPANY_STATE || 'Tamil Nadu',
    pincode: settings?.pincode || process.env.COMPANY_PINCODE || '600077',
    phone: settings?.phone || process.env.COMPANY_PHONE || '+91-88388 87064',
    email: settings?.email || process.env.COMPANY_EMAIL || 'contact@mansarafoods.com',
    invoicePrefix: settings?.invoicePrefix || 'MF-INV',
    placeOfSupply: settings?.placeOfSupply || 'Tamil Nadu (33)',
    invoiceTerms: settings?.invoiceTerms || '1. Payment within 15 days.\n2. Interest @ 2% per month on delay.\n3. Claims if any must be reported at delivery.',
    bankDetails: settings?.bankDetails || {},
    signatoryTitle: settings?.signatoryTitle || 'Authorised Signatory',
    signatoryName: settings?.signatoryName || 'Mansara Foods Pvt. Ltd.'
  };

  // Only non-identifying dealer overrides (e.g. custom retail prefix or terms) if needed;
  // NEVER overwrite companyName, name or logo of Mansara Foods!
  if (dealer) {
    if (dealer.invoicePrefix) base.invoicePrefix = dealer.invoicePrefix;
    if (dealer.invoiceTerms) base.invoiceTerms = dealer.invoiceTerms;
    if (dealer.bankDetails && Object.keys(dealer.bankDetails).length > 0) {
      base.bankDetails = { ...base.bankDetails, ...dealer.bankDetails };
    }
  }

  return base;
};

// GET /api/billing/settings
exports.getInvoiceSettings = async (req, res, next) => {
  try {
    let settings = await prisma.setting.findFirst({
      where: { key: 'invoice_settings' }
    });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          key: 'invoice_settings',
          companyName: 'Mansara Foods Pvt. Ltd.',
          logoBase64: '',
          logoUrl: '',
          gstNumber: '27AABCM1234F1Z5',
          address: 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600077',
          phone: '+91-88388 87064',
          email: 'contact@mansarafoods.com',
          invoicePrefix: 'MF-INV',
          nextSequenceNumber: 38,
          placeOfSupply: 'Tamil Nadu (33)',
          invoiceTerms: '1. Payment within 15 days.\n2. Interest @ 2% per month on delay.\n3. Claims if any must be reported at delivery.',
          bankDetails: {
            bankName: '',
            accountNo: '',
            ifscCode: '',
            branch: '',
            accountType: 'Current'
          },
          signatoryTitle: 'Authorised Signatory',
          signatoryName: 'Mansara Foods Pvt. Ltd.'
        }
      });
    }

    const seq = await prisma.invoiceSequence.findUnique({
      where: { id: 'singleton' }
    });

    const currentLast = seq ? seq.lastNumber : (settings.nextSequenceNumber ? settings.nextSequenceNumber - 1 : 37);
    const nextSeq = currentLast + 1;

    res.json({
      success: true,
      data: {
        ...(settings.toJSON ? settings.toJSON() : settings),
        nextSequenceNumber: nextSeq,
        currentLastNumber: currentLast,
        invoicePrefix: seq?.prefix || settings.invoicePrefix || 'MF-INV'
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/billing/settings
exports.updateInvoiceSettings = async (req, res, next) => {
  try {
    const {
      companyName,
      logoBase64,
      logoUrl,
      gstNumber,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      invoicePrefix,
      nextSequenceNumber,
      placeOfSupply,
      invoiceTerms,
      bankDetails,
      signatoryTitle,
      signatoryName
    } = req.body;

    let settings = await prisma.setting.findFirst({
      where: { key: 'invoice_settings' }
    });

    const updateData = {
      ...(companyName !== undefined && { companyName }),
      ...(logoBase64 !== undefined && { logoBase64 }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(gstNumber !== undefined && { gstNumber }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(invoicePrefix !== undefined && { invoicePrefix }),
      ...(placeOfSupply !== undefined && { placeOfSupply }),
      ...(invoiceTerms !== undefined && { invoiceTerms }),
      ...(bankDetails !== undefined && { bankDetails }),
      ...(signatoryTitle !== undefined && { signatoryTitle }),
      ...(signatoryName !== undefined && { signatoryName })
    };

    if (settings) {
      settings = await prisma.setting.update({
        where: { id: settings.id || settings._id },
        data: updateData
      });
    } else {
      settings = await prisma.setting.create({
        data: {
          key: 'invoice_settings',
          ...updateData
        }
      });
    }

    // Sync sequence number & prefix if updated
    if (nextSequenceNumber !== undefined || invoicePrefix !== undefined) {
      const seqId = 'singleton';
      const parsedSeq = parseInt(nextSequenceNumber, 10);
      const newLast = !isNaN(parsedSeq) ? Math.max(0, parsedSeq - 1) : undefined;
      const prefixToUse = invoicePrefix || settings.invoicePrefix || 'MF-INV';

      await prisma.invoiceSequence.upsert({
        where: { id: seqId },
        update: {
          ...(newLast !== undefined && { lastNumber: newLast }),
          ...(prefixToUse && { prefix: prefixToUse })
        },
        create: {
          id: seqId,
          lastNumber: newLast !== undefined ? newLast : 37,
          prefix: prefixToUse
        }
      });
    }

    res.json({
      success: true,
      message: 'Invoice configuration updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    if (req.user.role !== 'DEALER') {
      return res.status(403).json({ success: false, message: 'Only dealers can generate invoices' });
    }

    const { storeId, storeName, items, notes, isGstEnabled = true, shippingCharges = 0, isCredit = false, totalDiscount = 0 } = req.body; // items: [{ productId, quantity, marginPct }]
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

    const discount = parseFloat(totalDiscount || 0);
    const calculatedGrandTotal = Math.max(0, calculatedSubtotal + calculatedGstTotal + parseFloat(shippingCharges || 0) - discount);

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
          totalDiscount: discount,
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

    // Trigger Dealer Invoice Generated Notification
    centralNotificationService.notifyInvoiceGenerated(invoice, invoice.dealer || req.user.dealer).catch(err => {
      console.error('[NOTIF ERROR] Invoice alert failed:', err.message);
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
      where: { id },
      include: {
        dealer: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Verify ownership for DEALER
    if (req.user.role === 'DEALER' && invoice.dealerId !== dealerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Dealers can only delete their own OPEN or CANCELLED invoices; ADMIN can delete any
    if (req.user.role === 'DEALER' && invoice.status !== 'OPEN' && invoice.status !== 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Only OPEN or CANCELLED invoices can be deleted' });
    }

    let nextSequenceNumber = null;

    await prisma.$transaction(async (tx) => {
      // Unlink any stock transfers pointing to this invoice
      await tx.stockTransfer.updateMany({
        where: { invoiceId: id },
        data: { invoiceId: null }
      });

      // Delete invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      // Delete invoice
      await tx.invoice.delete({
        where: { id }
      });

      // Recalculate sequence counter so next invoice continues seamlessly from current number
      const match = invoice.invoiceNo ? invoice.invoiceNo.match(/^(.*?)-(\d+)$/) : null;
      if (match) {
        const prefix = match[1];
        const seqId = invoice.dealerId && invoice.storeId ? `dealer_${invoice.dealerId}` : 'singleton';

        // Find all remaining invoices with this prefix
        const allInvoices = await tx.invoice.findMany({});
        let maxRemainingNumber = 0;
        const targetIdStr = String(id);
        for (const rem of allInvoices) {
          const invIdStr = String(rem.id || rem._id);
          if (invIdStr === targetIdStr) continue;

          const m = rem.invoiceNo ? rem.invoiceNo.match(/^(.*?)-(\d+)$/) : null;
          if (m && m[1] === prefix) {
            const n = parseInt(m[2], 10);
            if (!isNaN(n) && n > maxRemainingNumber) {
              maxRemainingNumber = n;
            }
          }
        }

        // Update the sequence generator to max remaining
        await tx.invoiceSequence.upsert({
          where: { id: seqId },
          update: { lastNumber: maxRemainingNumber, prefix },
          create: { id: seqId, lastNumber: maxRemainingNumber, prefix }
        });

        // Also update invoice_settings nextSequenceNumber if this is the company singleton sequence
        if (seqId === 'singleton') {
          await tx.setting.updateMany({
            where: { key: 'invoice_settings' },
            data: { nextSequenceNumber: maxRemainingNumber + 1 }
          });
        }

        nextSequenceNumber = maxRemainingNumber + 1;
      }

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'DELETE_INVOICE',
          entity: 'Invoice',
          entityId: id,
          newValues: {
            invoiceNo: invoice.invoiceNo,
            nextSequenceNumber
          }
        }
      });
    });

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNo} deleted successfully. Next invoice will continue from ${nextSequenceNumber !== null ? `#${nextSequenceNumber}` : 'the current number'}.`,
      data: {
        deletedInvoiceNo: invoice.invoiceNo,
        nextSequenceNumber
      }
    });
  } catch (error) {
    next(error);
  }
};


exports.getInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.user.role === 'DEALER') {
      where.dealerId = req.user.dealer.id;
    } else if (req.query.dealerId) {
      where.dealerId = req.query.dealerId;
    }

    if (req.query.storeId) {
      where.storeId = req.query.storeId;
    }

    const { data: invoices, total } = await prisma.invoice.findMany({
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    res.json({ success: true, data: invoices, total, page, limit });
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

    const company = await getCompanyDetails(invoice.store ? invoice.dealer : null);
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

    // Ensure sequential agreement number (MFD/DAA/YYYY/XXX)
    const { agreementNumber, agreeSeq } = await getOrAssignDealerAgreementNumber(dealer.id);
    dealer.agreementNumber = agreementNumber;
    dealer.agreeSeq = agreeSeq;

    const company = await getCompanyDetails();
    const agreementSettings = await prisma.setting.findFirst({
      where: { key: 'agreement_templates' }
    });
    const html = buildAgreementHtml(company, dealer, agreementSettings?.appointment);

    try {
      const pdfBuffer = await generateInvoicePdf(html);
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Agreement_${dealer.companyName.replace(/\s+/g, '_')}.pdf"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.warn(`PDF agreement generation failed for ${dealer.companyName}, falling back to HTML:`, pdfErr.message);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Agreement_${dealer.companyName.replace(/\s+/g, '_')}.html"`);
      res.send(html);
    }
  } catch (error) {
    next(error);
  }
};

exports.downloadClosureAgreementPdf = async (req, res, next) => {
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

    // Ensure sequential closure agreement number (MFD/DCA/YYYY/XXX)
    const { closureAgreementNumber, closureAgreeSeq } = await getOrAssignDealerClosureAgreementNumber(dealer.id);
    dealer.closureAgreementNumber = closureAgreementNumber;
    dealer.closureAgreeSeq = closureAgreeSeq;

    const company = await getCompanyDetails();
    const agreementSettings = await prisma.setting.findFirst({
      where: { key: 'agreement_templates' }
    });
    const html = buildClosureAgreementHtml(company, dealer, agreementSettings?.closure);

    try {
      const pdfBuffer = await generateInvoicePdf(html);
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Closure_Agreement_${dealer.companyName.replace(/\s+/g, '_')}.pdf"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.warn(`PDF closure agreement generation failed for ${dealer.companyName}, falling back to HTML:`, pdfErr.message);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Closure_Agreement_${dealer.companyName.replace(/\s+/g, '_')}.html"`);
      res.send(html);
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/billing/agreement-templates
exports.getAgreementTemplates = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findFirst({
      where: { key: 'agreement_templates' }
    });

    res.json({
      success: true,
      data: {
        appointment: mergeAppointmentTemplate(settings?.appointment || {}),
        closure: mergeClosureTemplate(settings?.closure || {})
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/billing/agreement-templates
exports.updateAgreementTemplates = async (req, res, next) => {
  try {
    const { appointment, closure } = req.body;

    let settings = await prisma.setting.findFirst({
      where: { key: 'agreement_templates' }
    });

    const updatedAppointment = appointment ? mergeAppointmentTemplate(appointment) : (settings?.appointment || mergeAppointmentTemplate({}));
    const updatedClosure = closure ? mergeClosureTemplate(closure) : (settings?.closure || mergeClosureTemplate({}));

    if (settings) {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          key: 'agreement_templates',
          appointment: updatedAppointment,
          closure: updatedClosure
        }
      });
    } else {
      settings = await prisma.setting.create({
        data: {
          key: 'agreement_templates',
          appointment: updatedAppointment,
          closure: updatedClosure
        }
      });
    }

    res.json({
      success: true,
      message: 'Agreement templates updated successfully',
      data: {
        appointment: settings.appointment,
        closure: settings.closure
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/billing/agreement-templates/reset
exports.resetAgreementTemplates = async (req, res, next) => {
  try {
    const { type } = req.body; // 'appointment' | 'closure' | 'all'

    let settings = await prisma.setting.findFirst({
      where: { key: 'agreement_templates' }
    });

    const defaultAppointment = mergeAppointmentTemplate({});
    const defaultClosure = mergeClosureTemplate({});

    const newAppointment = (type === 'appointment' || type === 'all' || !type)
      ? defaultAppointment
      : (settings?.appointment || defaultAppointment);

    const newClosure = (type === 'closure' || type === 'all' || !type)
      ? defaultClosure
      : (settings?.closure || defaultClosure);

    if (settings) {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          key: 'agreement_templates',
          appointment: newAppointment,
          closure: newClosure
        }
      });
    } else {
      settings = await prisma.setting.create({
        data: {
          key: 'agreement_templates',
          appointment: newAppointment,
          closure: newClosure
        }
      });
    }

    res.json({
      success: true,
      message: `Agreement template ${type ? `(${type})` : ''} reset to official defaults`,
      data: {
        appointment: settings.appointment,
        closure: settings.closure
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/billing/agreement-templates/preview
exports.previewAgreementPdf = async (req, res, next) => {
  try {
    const { type, templateConfig, dealerId, format = 'html' } = req.body;

    let dealer = null;
    if (dealerId) {
      dealer = await prisma.dealer.findUnique({
        where: { id: dealerId },
        include: { user: true }
      });
    }

    if (!dealer) {
      dealer = {
        companyName: 'M/S. CHENNAI SPICE DISTRIBUTORS',
        user: { name: 'S. Rajasekaran', email: 'rajasekaran@chennaispice.com' },
        phone: '+91 98401 23456',
        gstNumber: '33ABCDE1234F1Z5',
        udyamNo: 'UDYAM-TN-02-0098765',
        address: 'No. 42, Trunk Road, Poonamallee',
        city: 'Chennai',
        state: 'Tamil Nadu',
        dealerType: 'DISTRIBUTOR',
        dealerCategory: 'GROWTH',
        zones: ['Chennai West', 'Tiruvallur District'],
        initialDeposit: 50000,
        agreementNumber: 'MFD/DAA/2026/001',
        agreeSeq: 1,
        closureAgreementNumber: 'MFD/DCA/2026/001',
        closureAgreeSeq: 1,
        closureReason: 'Relocation & Business Restructuring',
        closureNotes: 'Zero outstanding ledger balance. All promotional tabletop stands accounted for.',
        closureSettlementStatus: 'SETTLED & RECONCILED'
      };
    }

    const company = await getCompanyDetails();
    let html = '';
    if (type === 'closure') {
      html = buildClosureAgreementHtml(company, dealer, templateConfig);
    } else {
      html = buildAgreementHtml(company, dealer, templateConfig);
    }

    if (format === 'pdf') {
      const pdfBuffer = await generateInvoicePdf(html);
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${type || 'agreement'}_preview.pdf"`);
      return res.send(pdfBuffer);
    }

    res.json({
      success: true,
      html
    });
  } catch (error) {
    next(error);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod, referenceNumber, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { dealer: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const paymentRecord = {
      invoiceId,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'NEFT',
      referenceNumber: referenceNumber || 'N/A',
      notes
    };

    // Trigger Payment Receipt Notification
    centralNotificationService.notifyPaymentReceived(paymentRecord, invoice, invoice.dealer).catch(err => {
      console.error('[NOTIF ERROR] Payment receipt alert failed:', err.message);
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully and notification sent',
      data: paymentRecord
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      invoiceNo,
      createdAt,
      dueDate,
      notes,
      status,
      shippingCharges,
      totalDiscount,
      isGstEnabled,
      items
    } = req.body;

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'DEALER' && existing.dealerId !== req.user.dealer?.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this invoice' });
    }

    // Uniqueness check for invoiceNo if changing
    if (invoiceNo && invoiceNo.trim() !== existing.invoiceNo) {
      const duplicate = await prisma.invoice.findFirst({
        where: {
          invoiceNo: invoiceNo.trim(),
          id: { not: id }
        }
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Invoice number '${invoiceNo}' is already assigned to another invoice.` });
      }
    }

    const updateData = {};
    if (invoiceNo !== undefined && invoiceNo.trim()) updateData.invoiceNo = invoiceNo.trim();
    if (createdAt) updateData.createdAt = new Date(createdAt);
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (shippingCharges !== undefined) updateData.shippingCharges = parseFloat(shippingCharges) || 0;
    if (totalDiscount !== undefined) updateData.totalDiscount = parseFloat(totalDiscount) || 0;
    if (isGstEnabled !== undefined) updateData.isGstEnabled = !!isGstEnabled;

    if (items && Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
      let totalGst = 0;

      const formattedItems = [];
      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        const qty = parseInt(item.quantity) || 1;
        const mrp = parseFloat(item.unitPrice || product?.mrp || product?.price || 0);
        const marginPct = parseFloat(item.marginPct !== undefined ? item.marginPct : 10);
        const sellingPrice = parseFloat(item.sellingPrice || (mrp * (1 - marginPct / 100)));
        const gstPercent = parseFloat(product?.gstPercent || 5);
        const lineTotal = sellingPrice * qty;
        const lineGst = (updateData.isGstEnabled !== false && existing.isGstEnabled !== false) ? (lineTotal * gstPercent / 100) : 0;

        subtotal += lineTotal;
        totalGst += lineGst;

        formattedItems.push({
          productId: item.productId,
          quantity: qty,
          unitPrice: mrp,
          marginPct,
          sellingPrice,
          gstPercent,
          gstAmount: lineGst,
          lineTotal
        });
      }

      const activeGstEnabled = updateData.isGstEnabled !== undefined ? updateData.isGstEnabled : existing.isGstEnabled;
      const finalGst = activeGstEnabled ? totalGst : 0;

      updateData.subtotal = subtotal;
      updateData.totalGst = finalGst;
      updateData.cgst = activeGstEnabled ? (finalGst / 2) : 0;
      updateData.sgst = activeGstEnabled ? (finalGst / 2) : 0;
      const ship = updateData.shippingCharges !== undefined ? updateData.shippingCharges : parseFloat(existing.shippingCharges || 0);
      const disc = updateData.totalDiscount !== undefined ? updateData.totalDiscount : parseFloat(existing.totalDiscount || 0);
      updateData.totalAmount = Math.max(0, subtotal + finalGst + ship - disc);

      await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoiceItem.createMany({
          data: formattedItems.map(i => ({ ...i, invoiceId: id }))
        });
        await tx.invoice.update({
          where: { id },
          data: updateData
        });
      });
    } else {
      const subtotal = existing.subtotal || 0;
      const activeGstEnabled = updateData.isGstEnabled !== undefined ? updateData.isGstEnabled : existing.isGstEnabled;
      const gst = activeGstEnabled ? (existing.totalGst || 0) : 0;
      const ship = updateData.shippingCharges !== undefined ? updateData.shippingCharges : parseFloat(existing.shippingCharges || 0);
      const disc = updateData.totalDiscount !== undefined ? updateData.totalDiscount : parseFloat(existing.totalDiscount || 0);
      
      updateData.totalGst = gst;
      updateData.cgst = activeGstEnabled ? (gst / 2) : 0;
      updateData.sgst = activeGstEnabled ? (gst / 2) : 0;
      updateData.totalAmount = Math.max(0, subtotal + gst + ship - disc);

      await prisma.invoice.update({
        where: { id },
        data: updateData
      });
    }

    const updated = await prisma.invoice.findUnique({
      where: { id },
      include: { store: true, dealer: true, items: { include: { product: true } } }
    });

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};




