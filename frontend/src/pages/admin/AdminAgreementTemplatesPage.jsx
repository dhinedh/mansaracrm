// src/pages/admin/AdminAgreementTemplatesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  FileSignature,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  HelpCircle,
  Building2,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_APPOINTMENT = {
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

const DEFAULT_CLOSURE = {
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

const PLACEHOLDERS = [
  { token: '{{DEALER_COMPANY_NAME}}', desc: 'Registered Company / Firm Name of Dealer' },
  { token: '{{DEALER_CONTACT_NAME}}', desc: 'Proprietor or Authorized Signatory Person' },
  { token: '{{DEALER_ADDRESS}}', desc: 'Full Address of Dealer Premise' },
  { token: '{{AGREEMENT_NO}}', desc: 'e.g. MFD/DAA/2026/001' },
  { token: '{{CLOSURE_AGREEMENT_NO}}', desc: 'e.g. MFD/DCA/2026/001' },
  { token: '{{TERRITORY}}', desc: 'Assigned Zones / Territory' },
  { token: '{{SECURITY_DEPOSIT}}', desc: 'Deposit in ₹ (e.g. 50,000)' },
  { token: '{{DAY_ORDINAL}}', desc: 'Day with suffix (e.g. 29th)' },
  { token: '{{MONTH}}', desc: 'Current Month (e.g. OCTOBER)' },
  { token: '{{YEAR}}', desc: 'Current Year (e.g. 2026)' },
  { token: '{{CLOSURE_REASON}}', desc: 'Reason stated for dealership closure' },
  { token: '{{SETTLEMENT_STATUS}}', desc: 'Settlement status of closure' },
  { token: '{{COMPANY_NAME}}', desc: 'Mansara Foods Pvt. Ltd.' }
];

export default function AdminAgreementTemplatesPage() {
  const [activeTab, setActiveTab] = useState('appointment'); // 'appointment' | 'closure'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [copiedToken, setCopiedToken] = useState('');

  // Templates state
  const [appointment, setAppointment] = useState(DEFAULT_APPOINTMENT);
  const [closure, setClosure] = useState(DEFAULT_CLOSURE);

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await axios.get('/billing/agreement-templates');
      if (res.data.success && res.data.data) {
        if (res.data.data.appointment) setAppointment(res.data.data.appointment);
        if (res.data.data.closure) setClosure(res.data.data.closure);
      }
    } catch (err) {
      console.error('Failed to load agreement templates:', err);
      setMessage({ text: 'Failed to load templates. Using defaults.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const payload = {
        appointment,
        closure
      };
      const res = await axios.put('/billing/agreement-templates', payload);
      if (res.data.success) {
        setMessage({ text: 'Agreement templates saved and published successfully!', type: 'success' });
      }
    } catch (err) {
      console.error('Failed to save agreement templates:', err);
      setMessage({ text: 'Failed to save changes. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (type) => {
    const typeLabel = type === 'appointment' ? 'Dealer Appointment Agreement' : 'Dealer Closure Agreement';
    if (!window.confirm(`Are you sure you want to reset "${typeLabel}" back to official system defaults? Any unsaved edits will be lost.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/billing/agreement-templates/reset', { type });
      if (res.data.success && res.data.data) {
        if (type === 'appointment') {
          setAppointment(res.data.data.appointment);
        } else if (type === 'closure') {
          setClosure(res.data.data.closure);
        }
        setMessage({ text: `"${typeLabel}" reset to official defaults!`, type: 'success' });
      }
    } catch (err) {
      console.error('Failed to reset template:', err);
      setMessage({ text: 'Failed to reset template.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = activeTab === 'appointment' ? appointment : closure;
  const setTemplate = (updater) => {
    if (activeTab === 'appointment') {
      setAppointment(updater);
    } else {
      setClosure(updater);
    }
  };

  // Helper clause mutators
  const handleClauseChange = (idx, field, val) => {
    setTemplate(prev => {
      const newClauses = [...(prev.clauses || [])];
      newClauses[idx] = { ...newClauses[idx], [field]: val };
      return { ...prev, clauses: newClauses };
    });
  };

  const handleAddClause = () => {
    setTemplate(prev => {
      const clauses = prev.clauses || [];
      const newNum = clauses.length + 1;
      return {
        ...prev,
        clauses: [
          ...clauses,
          { num: newNum, title: `Additional Term ${newNum}`, text: 'Specify terms, obligations, or covenants here...' }
        ]
      };
    });
  };

  const handleDeleteClause = (idx) => {
    if (!window.confirm('Delete this clause?')) return;
    setTemplate(prev => {
      const clauses = (prev.clauses || []).filter((_, i) => i !== idx);
      // Re-number
      const renumbered = clauses.map((c, i) => ({ ...c, num: i + 1 }));
      return { ...prev, clauses: renumbered };
    });
  };

  const handleMoveClause = (idx, direction) => {
    setTemplate(prev => {
      const clauses = [...(prev.clauses || [])];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= clauses.length) return prev;
      const temp = clauses[idx];
      clauses[idx] = clauses[targetIdx];
      clauses[targetIdx] = temp;
      // Re-number
      const renumbered = clauses.map((c, i) => ({ ...c, num: i + 1 }));
      return { ...prev, clauses: renumbered };
    });
  };

  // Helper recitals mutators
  const handleRecitalChange = (idx, val) => {
    setTemplate(prev => {
      const recitals = [...(prev.recitals || [])];
      recitals[idx] = val;
      return { ...prev, recitals };
    });
  };

  const handleAddRecital = () => {
    setTemplate(prev => ({
      ...prev,
      recitals: [...(prev.recitals || []), 'AND WHEREAS the parties agree to mutual covenants as specified herein.']
    }));
  };

  const handleDeleteRecital = (idx) => {
    setTemplate(prev => ({
      ...prev,
      recitals: (prev.recitals || []).filter((_, i) => i !== idx)
    }));
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  // Live preview generator
  const handleOpenPreview = async () => {
    setShowPreviewModal(true);
    setPreviewLoading(true);
    try {
      const res = await axios.post('/billing/agreement-templates/preview', {
        type: activeTab,
        templateConfig: currentTemplate,
        format: 'html'
      });
      if (res.data.success && res.data.html) {
        setPreviewHtml(res.data.html);
      }
    } catch (err) {
      console.error('Preview failed:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadTestPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await axios.post(
        '/billing/agreement-templates/preview',
        {
          type: activeTab,
          templateConfig: currentTemplate,
          format: 'pdf'
        },
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab === 'appointment' ? 'Dealer_Appointment' : 'Dealer_Closure'}_Agreement_Sample.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download test PDF error:', err);
      alert('Failed to generate test PDF. Check console.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <FileSignature className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agreement Templates Editor</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Completely customize terms, recitals, numbered clauses, and signatory roles for official Mansara dealer agreements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/dealers"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm inline-flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            View Dealers
          </Link>
          <button
            type="button"
            onClick={handleOpenPreview}
            className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition shadow-sm inline-flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Live Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition shadow-sm inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex flex-col sm:flex-row gap-3 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('appointment')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 ${
            activeTab === 'appointment'
              ? 'bg-white text-rose-600 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileText className="w-4 h-4 text-rose-500" />
          <span>Dealer Appointment Agreement</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono font-medium">MFD/DAA/...</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('closure')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 ${
            activeTab === 'closure'
              ? 'bg-white text-rose-600 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Dealer Relationship Closure Agreement</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono font-medium">MFD/DCA/...</span>
        </button>
      </div>

      {/* Placeholders Toolbar (Collapsible / Scroller) */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            Dynamic Tokens (Click any token to copy & paste into clauses)
          </div>
          {copiedToken && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> Copied {copiedToken}!
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDERS.map(p => (
            <button
              key={p.token}
              type="button"
              onClick={() => handleCopyToken(p.token)}
              title={p.desc}
              className="text-xs font-mono bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>{p.token}</span>
              <Copy className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Agreement Form */}
      <div className="space-y-6">
        {/* Section 1: Title & Preamble */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Document Title &amp; Execution Preamble
            </h2>
            <button
              type="button"
              onClick={() => handleReset(activeTab)}
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset This Agreement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agreement Heading Title</label>
              <input
                type="text"
                value={currentTemplate.title || ''}
                onChange={e => setTemplate(p => ({ ...p, title: e.target.value }))}
                className="w-full text-sm font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                placeholder="e.g. Dealer Appointment Agreement"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Deed Classification</label>
              <input
                type="text"
                value={currentTemplate.subtitle || ''}
                onChange={e => setTemplate(p => ({ ...p, subtitle: e.target.value }))}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                placeholder="e.g. Authorized Dealership Agreement & Guidelines Deed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Preamble</label>
            <input
              type="text"
              value={currentTemplate.preamble || ''}
              onChange={e => setTemplate(p => ({ ...p, preamble: e.target.value }))}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              placeholder="This Dealer Appointment Agreement is executed at Chennai on this {{DAY_ORDINAL}} day of {{MONTH}}, {{YEAR}}."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Description (Party 1)</label>
              <textarea
                rows={3}
                value={currentTemplate.companyDescription || ''}
                onChange={e => setTemplate(p => ({ ...p, companyDescription: e.target.value }))}
                className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dealer Description (Party 2)</label>
              <textarea
                rows={3}
                value={currentTemplate.dealerDescription || ''}
                onChange={e => setTemplate(p => ({ ...p, dealerDescription: e.target.value }))}
                className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Recitals (Whereas Clauses) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Recitals &amp; Background (Whereas Clauses)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Defines background rationale before terms take effect.</p>
            </div>
            <button
              type="button"
              onClick={handleAddRecital}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Recital
            </button>
          </div>

          <div className="space-y-3">
            {(currentTemplate.recitals || []).map((recital, idx) => (
              <div key={idx} className="flex items-start gap-2 group">
                <span className="mt-2 text-xs font-bold font-mono text-slate-400 w-6 text-right">{idx + 1}.</span>
                <textarea
                  rows={2}
                  value={recital}
                  onChange={e => handleRecitalChange(idx, e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteRecital(idx)}
                  className="mt-1 p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Remove this recital"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Witnesseth / Summary Box */}
        {activeTab === 'appointment' ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Witnesseth Statement
            </h2>
            <p className="text-xs text-slate-500">Statement declaring the appointment and mutual acceptance (separated by paragraphs).</p>
            <textarea
              rows={3}
              value={currentTemplate.witnesseth || ''}
              onChange={e => setTemplate(p => ({ ...p, witnesseth: e.target.value }))}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition leading-relaxed font-sans"
            />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Closure Summary Highlight Box
            </h2>
            <p className="text-xs text-slate-500">Highlighted deed box summarizing termination date, closure reason, and settlement status.</p>
            <textarea
              rows={2}
              value={currentTemplate.summaryBox || ''}
              onChange={e => setTemplate(p => ({ ...p, summaryBox: e.target.value }))}
              className="w-full text-xs px-3 py-2 border border-amber-200 bg-amber-50/30 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition leading-relaxed font-sans"
            />
          </div>
        )}

        {/* Section 4: Numbered Clauses & Terms (The Core!) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Terms &amp; Conditions (Numbered Clauses)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each clause will appear as a numbered legal clause with bold heading and detailed text.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddClause}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Clause
            </button>
          </div>

          <div className="space-y-4">
            {(currentTemplate.clauses || []).map((clause, idx) => (
              <div
                key={idx}
                className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 flex items-center justify-center bg-rose-100 text-rose-700 text-xs font-bold rounded-lg font-mono">
                      {clause.num || idx + 1}
                    </span>
                    <input
                      type="text"
                      value={clause.title || ''}
                      onChange={e => handleClauseChange(idx, 'title', e.target.value)}
                      placeholder="Clause Title (e.g. Purchase Commitment)"
                      className="flex-1 text-xs font-bold text-slate-800 px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveClause(idx, 'up')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-200/50 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (currentTemplate.clauses || []).length - 1}
                      onClick={() => handleMoveClause(idx, 'down')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-200/50 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClause(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete Clause"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={clause.text || ''}
                    onChange={e => handleClauseChange(idx, 'text', e.target.value)}
                    placeholder="Clause legal provisions, terms, timeline or obligations..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition leading-relaxed font-sans"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Signatories & Footer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Signatory Titles &amp; Footer Strip
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 bg-slate-50/60 border border-slate-200/60 rounded-xl">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Dealer Signatory Block</span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Party Line</label>
                <input
                  type="text"
                  value={currentTemplate.signatoryDealerParty || ''}
                  onChange={e => setTemplate(p => ({ ...p, signatoryDealerParty: e.target.value }))}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  placeholder="For M/s. {{DEALER_COMPANY_NAME}}"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Signatory Title</label>
                <input
                  type="text"
                  value={currentTemplate.signatoryDealerTitle || ''}
                  onChange={e => setTemplate(p => ({ ...p, signatoryDealerTitle: e.target.value }))}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  placeholder="Authorized Signatory (Dealer)"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50/60 border border-slate-200/60 rounded-xl">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Company Signatory Block</span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company Line</label>
                <input
                  type="text"
                  value={currentTemplate.signatoryCompanyParty || ''}
                  onChange={e => setTemplate(p => ({ ...p, signatoryCompanyParty: e.target.value }))}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  placeholder="For Mansara Foods Pvt. Ltd."
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Signatory Person &amp; Title</label>
                <input
                  type="text"
                  value={currentTemplate.signatoryCompanyTitle || ''}
                  onChange={e => setTemplate(p => ({ ...p, signatoryCompanyTitle: e.target.value }))}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  placeholder="H. Deepika — Authorized Signatory"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Footer Legal Strip Note</label>
            <input
              type="text"
              value={currentTemplate.footerText || ''}
              onChange={e => setTemplate(p => ({ ...p, footerText: e.target.value }))}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              placeholder="Mansara Foods Private Limited • Confidential Dealer Legal Deed"
            />
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleReset(activeTab)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Reset to Defaults
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition inline-flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition shadow-sm inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Agreement Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileSignature className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Agreement Preview ({activeTab === 'appointment' ? 'Appointment Agreement' : 'Closure Agreement'})
                  </h3>
                  <p className="text-xs text-slate-500">Rendered with sample dealer details &amp; Mansara logo watermark</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTestPdf}
                  disabled={downloadingPdf}
                  className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingPdf ? 'Generating PDF...' : 'Download Sample PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="text-xs font-semibold px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Content - Iframe */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex justify-center">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-xs font-medium">Compiling agreement preview...</span>
                </div>
              ) : (
                <div className="bg-white shadow-xl rounded-sm border border-slate-300 w-full max-w-[840px] min-h-[900px] overflow-hidden">
                  <iframe
                    title="Agreement Live Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full min-h-[850px] border-0"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
