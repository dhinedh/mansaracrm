// backend/src/utils/defaultAgreementTemplates.js

const DEFAULT_APPOINTMENT_AGREEMENT = {
  title: 'Dealer Appointment Agreement',
  subtitle: 'Authorized Dealership Agreement & Operational Guidelines Deed',
  preamble: 'This Dealer Appointment Agreement is executed at Chennai on this {{DAY_ORDINAL}} day of {{MONTH}}, {{YEAR}}.',
  companyDescription: 'MANSARA FOODS PRIVATE LIMITED, having its Registered Office at NOOMBAL, Chennai, Tamil Nadu, hereinafter referred to as the "Company", which expression shall, unless repugnant to the context, include its successors, administrators and assigns.',
  dealerDescription: 'M/s. {{DEALER_COMPANY_NAME}}, a Proprietorship / Partnership / LLP / Private Limited Company having its place of business at {{DEALER_ADDRESS}}, hereinafter referred to as the "Dealer", which expression shall, unless repugnant to the context, include its proprietors, partners, legal heirs, successors and permitted assigns.',
  recitals: [
    'WHEREAS the Company is engaged in the manufacture and marketing of food products under the brand name MANSARA.',
    'AND WHEREAS the Dealer has approached the Company for appointments as an authorized Dealer for the products marketed by the Company.',
    'AND WHEREAS the Company, after evaluating the Dealer\'s credentials and infrastructure, has agreed to appoint the Dealer subject to the terms and conditions attached herewith.'
  ],
  witnesseth: 'The Company hereby appoints the Dealer as an Authorized Growth Dealer for the territory specified herein and the Dealer hereby accepts such appointment.\n\nThe Dealer shall be authorized to market and sell MANSARA products within the approved territory subject to compliance with the Company\'s policies, pricing structure, operational guidelines and the Terms & Conditions annexed to this Agreement.',
  clauses: [
    { num: 1, title: 'Purchase Commitment', text: 'The Dealer shall maintain minimum monthly purchase commitment as agreed with the Company.' },
    { num: 2, title: 'Non-Compete', text: 'The Dealer shall not deal in any competing or similar food products without prior written consent of the Company.' },
    { num: 3, title: 'Payment Terms', text: 'All payments shall be made within 15 days from the date of invoice. Interest at 2% per month shall be levied on delayed payments.' },
    { num: 4, title: 'Storage & Hygiene Standards', text: 'The Dealer shall store products as per the Company\'s guidelines and maintain hygiene standards prescribed under FSSAI regulations.' },
    { num: 5, title: 'Trademarks & Packaging', text: 'The Dealer shall not alter, tamper with, or reproduce any labels, trademarks, or packaging of MANSARA products.' },
    { num: 6, title: 'Term & Termination', text: 'Either party may terminate this Agreement by giving 30 days\' written notice. The Company reserves the right to terminate immediately in case of breach.' },
    { num: 7, title: 'Jurisdiction & Governing Law', text: 'This Agreement shall be governed by and construed in accordance with the laws of India, and disputes shall be subject to the jurisdiction of courts in Chennai, Tamil Nadu.' },
    { num: 8, title: 'Security Deposit', text: 'The initial security deposit of ₹{{SECURITY_DEPOSIT}} paid by the Dealer shall be refundable upon termination, subject to no outstanding dues.' }
  ],
  signatoryDealerParty: 'For M/s. {{DEALER_COMPANY_NAME}}',
  signatoryDealerTitle: 'Authorized Signatory (Dealer)',
  signatoryCompanyParty: 'For Mansara Foods Pvt. Ltd.',
  signatoryCompanyTitle: 'H. Deepika — Authorized Signatory',
  footerText: 'Mansara Foods Private Limited • Confidential Dealer Legal Deed'
};

const DEFAULT_CLOSURE_AGREEMENT = {
  title: 'DEALER RELATIONSHIP CLOSURE & NO-DUES CLEARANCE AGREEMENT',
  subtitle: 'Formal Dealership Termination, Mutual Release & Account Settlement Deed',
  preamble: 'This Dealer Relationship Closure Agreement is executed at Chennai on this {{DAY_ORDINAL}} day of {{MONTH}}, {{YEAR}}.',
  companyDescription: 'MANSARA FOODS PRIVATE LIMITED, having its Registered Office at NOOMBAL, Chennai, Tamil Nadu, hereinafter referred to as the "Company" (which expression shall include its successors, administrators and assigns).',
  dealerDescription: 'M/s. {{DEALER_COMPANY_NAME}}, having its principal place of business at {{DEALER_ADDRESS}}, represented by its Proprietor / Authorized Signatory {{DEALER_CONTACT_NAME}}, hereinafter referred to as the "Exiting Dealer" (which expression shall include its successors, legal heirs, and permitted assigns).',
  recitals: [
    '1. The Company and Dealer entered into a Dealer Appointment Agreement for authorized distribution and marketing of MANSARA brand products across assigned territories.',
    '2. Both parties have mutually resolved to conclude and formally terminate the dealership relationship with effect from {{CLOSURE_DATE}} due to: {{CLOSURE_REASON}}.',
    '3. The parties have undertaken a complete reconciliation of accounts, trade balances, inventory returns, and security deposits.'
  ],
  summaryBox: 'Dealership relationship stands officially closed with effect from {{CLOSURE_DATE}}. Reason: {{CLOSURE_REASON}}. Account settlement status: {{SETTLEMENT_STATUS}}.',
  clauses: [
    { num: 1, title: 'Termination of Dealership Rights', text: 'With effect from the date of this Agreement, all rights, authorizations, licenses, and privileges granted to the Dealer to stock, market, distribute, or sell MANSARA products stand permanently terminated and revoked.' },
    { num: 2, title: 'Brand Assets & Intellectual Property', text: 'The Dealer shall immediately cease the use of the trade name "MANSARA", brand logos, signs, marketing materials, and digital assets. All promotional collateral and company-supplied display assets have been returned or cleared.' },
    { num: 3, title: 'Account Reconciliation & Final Settlement', text: 'Both parties confirm that all trade invoices, billings, credit limits, and purchase ledgers have been audited and fully settled. Neither party has any outstanding dues or pending monetary liability against the other.' },
    { num: 4, title: 'Security Deposit Settlement', text: 'The initial security deposit amount of ₹{{SECURITY_DEPOSIT}} has been fully reconciled and settled as per the agreed terms (Status: {{SETTLEMENT_STATUS}}), leaving no further financial claims.' },
    { num: 5, title: 'Mutual Release & No-Dues Clearance', text: 'The Company and the Dealer hereby mutually, irrevocably, and unconditionally release, acquit, and forever discharge each other, their proprietors, directors, agents, and representatives from all claims, demands, disputes, liabilities, actions, or proceedings arising out of or connected with the dealership agreement.' },
    { num: 6, title: 'Confidentiality', text: 'The Exiting Dealer covenants to maintain strict confidentiality regarding all proprietary formulas, recipes, wholesale pricing structures, dealer networks, and commercial terms learned during the course of the dealership tenure.' },
    { num: 7, title: 'Governing Law & Jurisdiction', text: 'This Agreement shall be governed by the laws of India, and any disputes arising herefrom shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu.' }
  ],
  signatoryDealerParty: 'For M/s. {{DEALER_COMPANY_NAME}}',
  signatoryDealerTitle: 'Authorized Signatory (Exiting Dealer)',
  signatoryCompanyParty: 'For Mansara Foods Pvt. Ltd.',
  signatoryCompanyTitle: 'H. Deepika — Authorized Signatory',
  footerText: 'Mansara Foods Private Limited • Dealership Termination & Mutual Settlement Deed'
};

function interpolateTokens(text = '', tokens = {}) {
  if (typeof text !== 'string') return '';
  return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    return tokens[key] !== undefined && tokens[key] !== null ? tokens[key] : match;
  });
}

function mergeAppointmentTemplate(custom = {}) {
  return {
    ...DEFAULT_APPOINTMENT_AGREEMENT,
    ...custom,
    clauses: Array.isArray(custom.clauses) && custom.clauses.length > 0
      ? custom.clauses
      : DEFAULT_APPOINTMENT_AGREEMENT.clauses,
    recitals: Array.isArray(custom.recitals) && custom.recitals.length > 0
      ? custom.recitals
      : DEFAULT_APPOINTMENT_AGREEMENT.recitals
  };
}

function mergeClosureTemplate(custom = {}) {
  return {
    ...DEFAULT_CLOSURE_AGREEMENT,
    ...custom,
    clauses: Array.isArray(custom.clauses) && custom.clauses.length > 0
      ? custom.clauses
      : DEFAULT_CLOSURE_AGREEMENT.clauses,
    recitals: Array.isArray(custom.recitals) && custom.recitals.length > 0
      ? custom.recitals
      : DEFAULT_CLOSURE_AGREEMENT.recitals
  };
}

module.exports = {
  DEFAULT_APPOINTMENT_AGREEMENT,
  DEFAULT_CLOSURE_AGREEMENT,
  interpolateTokens,
  mergeAppointmentTemplate,
  mergeClosureTemplate
};
