// src/modules/crm/crm.controller.js
const prisma = require('../../config/database');

// LEADS
exports.createLead = async (req, res, next) => {
  try {
    const { name, companyName, phone, email, notes } = req.body;
    const lead = await prisma.lead.create({
      data: { name, companyName, phone, email, notes, status: 'PENDING' }
    });
    res.status(201).json({ success: true, message: 'Lead logged successfully', data: lead });
  } catch (error) {
    next(error);
  }
};

exports.getLeads = async (req, res, next) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
};

exports.updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // CONVERTED or LOST

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { 
        status,
        notes: notes || lead.notes
      }
    });

    res.json({ success: true, message: 'Lead status updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// VISITS
exports.logVisit = async (req, res, next) => {
  try {
    const { leadId, dealerId, visitorName, purpose, outcome, date } = req.body;
    const visit = await prisma.visit.create({
      data: {
        leadId,
        dealerId,
        visitorName,
        purpose,
        outcome,
        date: date ? new Date(date) : new Date()
      }
    });
    res.status(201).json({ success: true, message: 'Visit logged successfully', data: visit });
  } catch (error) {
    next(error);
  }
};

exports.getVisits = async (req, res, next) => {
  try {
    const visits = await prisma.visit.findMany({
      orderBy: { date: 'desc' }
    });

    // Populate references manually
    const enriched = [];
    for (const v of visits) {
      let lead = null;
      let dealer = null;
      let store = null;
      if (v.leadId) {
        lead = await prisma.lead.findUnique({ where: { id: v.leadId } });
      }
      if (v.dealerId) {
        dealer = await prisma.dealer.findUnique({ where: { id: v.dealerId } });
      }
      if (v.storeId) {
        store = await prisma.store.findUnique({ where: { id: v.storeId } });
      }
      enriched.push({
        ...v,
        lead,
        dealer,
        store
      });
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

exports.checkInVisit = async (req, res, next) => {
  try {
    const { leadId, dealerId, storeId, visitorName, purpose, latitude, longitude } = req.body;

    if (!visitorName || !purpose) {
      return res.status(400).json({ success: false, message: 'Visitor name and purpose are required.' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Mandatory Check-In: GPS coordinates (latitude & longitude) are required.' });
    }

    const visit = await prisma.visit.create({
      data: {
        leadId,
        dealerId,
        storeId,
        visitorName,
        purpose,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        checkInTime: new Date(),
        verified: true,
        date: new Date(),
        outcome: 'Checked In - Visit Pending checkout'
      }
    });

    res.status(201).json({ success: true, message: 'Checked in successfully', data: visit });
  } catch (error) {
    next(error);
  }
};

exports.checkOutVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { outcome } = req.body;

    if (!outcome) {
      return res.status(400).json({ success: false, message: 'Outcome is required to checkout.' });
    }

    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    const updated = await prisma.visit.update({
      where: { id },
      data: {
        outcome,
        checkOutTime: new Date()
      }
    });

    res.json({ success: true, message: 'Checked out successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// SAMPLES
exports.createSample = async (req, res, next) => {
  try {
    const { leadId, dealerId, products, status } = req.body; // products: [{ productId, quantity }]
    const sample = await prisma.sample.create({
      data: {
        leadId,
        dealerId,
        products,
        status: status || 'PENDING'
      }
    });
    res.status(201).json({ success: true, message: 'Sample recorded successfully', data: sample });
  } catch (error) {
    next(error);
  }
};

exports.getSamples = async (req, res, next) => {
  try {
    const samples = await prisma.sample.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const enriched = [];
    for (const s of samples) {
      let lead = null;
      let dealer = null;
      if (s.leadId) {
        lead = await prisma.lead.findUnique({ where: { id: s.leadId } });
      }
      if (s.dealerId) {
        dealer = await prisma.dealer.findUnique({ where: { id: s.dealerId } });
      }

      const productsWithDetails = [];
      for (const p of s.products || []) {
        const prod = await prisma.product.findUnique({ where: { id: p.productId } });
        productsWithDetails.push({
          ...p,
          product: prod
        });
      }

      enriched.push({
        ...s,
        lead,
        dealer,
        products: productsWithDetails
      });
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

exports.updateSampleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // CONVERTED or REJECTED

    const sample = await prisma.sample.findUnique({ where: { id } });
    if (!sample) {
      return res.status(404).json({ success: false, message: 'Sample record not found' });
    }

    const updated = await prisma.sample.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, message: 'Sample status updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};
