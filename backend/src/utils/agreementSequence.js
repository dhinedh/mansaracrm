// src/utils/agreementSequence.js
const prisma = require('../config/database');

/**
 * Get or assign sequential Dealer Appointment Agreement number (MFD/DAA/YYYY/XXX).
 * Format: MFD/DAA/2026/001, MFD/DAA/2026/002, ...
 */
async function getOrAssignDealerAgreementNumber(dealerId, customYear = null) {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId }
  });

  if (!dealer) {
    throw new Error('Dealer not found');
  }

  // If already assigned in format MFD/DAA/..., reuse it
  if (dealer.agreementNumber && dealer.agreementNumber.startsWith('MFD/DAA/')) {
    return {
      agreementNumber: dealer.agreementNumber,
      agreeSeq: dealer.agreeSeq || parseInt(dealer.agreementNumber.split('/').pop(), 10) || 1,
      dealer
    };
  }

  const year = customYear || (dealer.approvedAt ? new Date(dealer.approvedAt).getFullYear() : (dealer.createdAt ? new Date(dealer.createdAt).getFullYear() : new Date().getFullYear()));
  const seqId = `dealer_daa_${year}`;

  const seq = await prisma.invoiceSequence.upsert({
    where: { id: seqId },
    update: { lastNumber: { increment: 1 } },
    create: { id: seqId, lastNumber: 1, prefix: `MFD/DAA/${year}` }
  });

  const agreeSeq = seq.lastNumber;
  const agreementNumber = `MFD/DAA/${year}/${String(agreeSeq).padStart(3, '0')}`;

  const updatedDealer = await prisma.dealer.update({
    where: { id: dealerId },
    data: {
      agreementNumber,
      agreeSeq
    }
  });

  return {
    agreementNumber,
    agreeSeq,
    dealer: updatedDealer
  };
}

/**
 * Get or assign sequential Dealer Relationship Closure Agreement number (MFD/DCA/YYYY/XXX).
 * Format: MFD/DCA/2026/001, MFD/DCA/2026/002, ...
 */
async function getOrAssignDealerClosureAgreementNumber(dealerId, customYear = null) {
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId }
  });

  if (!dealer) {
    throw new Error('Dealer not found');
  }

  // If already assigned in format MFD/DCA/..., reuse it
  if (dealer.closureAgreementNumber && dealer.closureAgreementNumber.startsWith('MFD/DCA/')) {
    return {
      closureAgreementNumber: dealer.closureAgreementNumber,
      closureAgreeSeq: dealer.closureAgreeSeq || parseInt(dealer.closureAgreementNumber.split('/').pop(), 10) || 1,
      dealer
    };
  }

  const year = customYear || (dealer.closedAt ? new Date(dealer.closedAt).getFullYear() : new Date().getFullYear());
  const seqId = `dealer_dca_${year}`;

  const seq = await prisma.invoiceSequence.upsert({
    where: { id: seqId },
    update: { lastNumber: { increment: 1 } },
    create: { id: seqId, lastNumber: 1, prefix: `MFD/DCA/${year}` }
  });

  const closureAgreeSeq = seq.lastNumber;
  const closureAgreementNumber = `MFD/DCA/${year}/${String(closureAgreeSeq).padStart(3, '0')}`;

  const updatedDealer = await prisma.dealer.update({
    where: { id: dealerId },
    data: {
      closureAgreementNumber,
      closureAgreeSeq
    }
  });

  return {
    closureAgreementNumber,
    closureAgreeSeq,
    dealer: updatedDealer
  };
}

module.exports = {
  getOrAssignDealerAgreementNumber,
  getOrAssignDealerClosureAgreementNumber
};
