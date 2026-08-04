// src/modules/vendors/vendors.controller.js
const prisma = require('../../config/database');

// Create a new Vendor
exports.createVendor = async (req, res, next) => {
  try {
    const {
      legalName,
      tradeName,
      companyType,
      primaryContactPerson,
      phone,
      email,
      officeAddress,
      gstin,
      pan,
      bankDetails,
      supplyCategory,
      status,
      notes
    } = req.body;

    if (!legalName || !primaryContactPerson || !phone || !email || !officeAddress || !supplyCategory) {
      return res.status(400).json({
        success: false,
        message: 'Legal Name, Primary Contact Person, Phone, Email, Office Address, and Supply Category are required fields.'
      });
    }

    const vendor = await prisma.vendor.create({
      data: {
        legalName,
        tradeName: tradeName || legalName,
        companyType: companyType || 'Proprietorship',
        primaryContactPerson,
        phone,
        email,
        officeAddress,
        gstin: gstin ? gstin.toUpperCase() : '',
        pan: pan ? pan.toUpperCase() : '',
        bankDetails: bankDetails || {},
        supplyCategory,
        status: status || 'ACTIVE',
        notes: notes || ''
      }
    });

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully',
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// Get all Vendors (with search, category filter, company type filter, and pagination)
exports.getVendors = async (req, res, next) => {
  try {
    const { search, supplyCategory, companyType, status, page, limit } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 25;
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (supplyCategory) {
      where.supplyCategory = supplyCategory;
    }

    if (companyType) {
      where.companyType = companyType;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { primaryContactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } }
      ];
    }

    const { data: vendors, total } = await prisma.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    res.json({
      success: true,
      data: vendors,
      total: total || vendors.length,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    next(error);
  }
};

// Get single Vendor by ID
exports.getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// Update Vendor details
exports.updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.gstin) updateData.gstin = updateData.gstin.toUpperCase();
    if (updateData.pan) updateData.pan = updateData.pan.toUpperCase();

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: updatedVendor
    });
  } catch (error) {
    next(error);
  }
};

// Delete Vendor
exports.deleteVendor = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.vendor.delete({ where: { id } });

    res.json({ success: true, message: 'Vendor record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// Generate Vendor Agreement / MOU
exports.generateAgreement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const agreementNumber = vendor.agreementDetails?.agreementNumber || `MOU-MF-2026-${Date.now().toString().slice(-6)}`;
    const generatedAt = vendor.agreementDetails?.generatedAt || new Date();

    const agreementDetails = {
      ...vendor.agreementDetails,
      agreementNumber,
      generatedAt
    };

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        agreementStatus: vendor.agreementStatus === 'NOT_GENERATED' ? 'GENERATED' : vendor.agreementStatus,
        agreementDetails
      }
    });

    res.json({
      success: true,
      message: 'Vendor Agreement / MOU generated successfully.',
      data: updatedVendor
    });
  } catch (error) {
    next(error);
  }
};

// Sign Vendor Agreement / MOU (Digital or Physical)
exports.signAgreement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { signingMethod, signerName, signerTitle, signatureData } = req.body;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const agreementNumber = vendor.agreementDetails?.agreementNumber || `MOU-MF-2026-${Date.now().toString().slice(-6)}`;
    const method = signingMethod === 'PHYSICAL' ? 'PHYSICAL' : 'DIGITAL';
    const status = method === 'DIGITAL' ? 'SIGNED_DIGITALLY' : 'SIGNED_PHYSICALLY';

    const agreementDetails = {
      ...vendor.agreementDetails,
      agreementNumber,
      generatedAt: vendor.agreementDetails?.generatedAt || new Date(),
      signedAt: new Date(),
      signerName: signerName || vendor.primaryContactPerson,
      signerTitle: signerTitle || 'Authorized Signatory',
      signatureData: signatureData || '',
      signingMethod: method
    };

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        agreementStatus: status,
        agreementDetails,
        status: 'ACTIVE' // Auto activate vendor upon agreement signing
      }
    });

    res.json({
      success: true,
      message: `Vendor Agreement successfully signed (${method}).`,
      data: updatedVendor
    });
  } catch (error) {
    next(error);
  }
};

// Update Agreement Terms & Custom Content
exports.updateAgreementTerms = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customPreamble, customTerms } = req.body;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const agreementNumber = vendor.agreementDetails?.agreementNumber || `MOU-MF-2026-${Date.now().toString().slice(-6)}`;

    const agreementDetails = {
      ...vendor.agreementDetails,
      agreementNumber,
      generatedAt: vendor.agreementDetails?.generatedAt || new Date(),
      customPreamble: customPreamble !== undefined ? customPreamble : vendor.agreementDetails?.customPreamble,
      customTerms: Array.isArray(customTerms) ? customTerms : vendor.agreementDetails?.customTerms || []
    };

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        agreementStatus: vendor.agreementStatus === 'NOT_GENERATED' ? 'GENERATED' : vendor.agreementStatus,
        agreementDetails
      }
    });

    res.json({
      success: true,
      message: 'Agreement custom clauses & terms updated successfully.',
      data: updatedVendor
    });
  } catch (error) {
    next(error);
  }
};
