import React, { useState } from 'react';
import {
  Printer,
  X,
  FileSpreadsheet,
  Building2,
  Calendar,
  Layers,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Award,
  ShieldCheck,
} from 'lucide-react';

/**
 * Converts a number into Indian Currency Words (Lakhs, Crores)
 */
function numberToIndianWords(num) {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  const convertTwoDigits = (val) => {
    if (val < 20) return a[val];
    const tens = b[Math.floor(val / 10)];
    const units = a[val % 10];
    return tens + (units ? ' ' + units : '');
  };

  const convertThreeDigits = (val) => {
    let str = '';
    if (Math.floor(val / 100) > 0) {
      str += a[Math.floor(val / 100)] + ' Hundred';
      if (val % 100 > 0) str += ' and ';
    }
    if (val % 100 > 0) {
      str += convertTwoDigits(val % 100);
    }
    return str;
  };

  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remaining = n % 1000;

  if (crore > 0) str += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) str += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand > 0) str += convertThreeDigits(thousand) + ' Thousand ';
  if (remaining > 0) str += convertThreeDigits(remaining);

  return str.trim() + ' Rupees Only';
}

export const PrintableProposalModal = ({ isOpen, onClose, proposal }) => {
  const [selectedVersion, setSelectedVersion] = useState(proposal?.currentVersion || 1);

  if (!isOpen || !proposal) return null;

  // Determine active version data
  let activeVersionData = proposal;
  if (proposal.versions && proposal.versions.length > 0) {
    const matched = proposal.versions.find((v) => v.version === selectedVersion);
    if (matched) {
      activeVersionData = matched;
    } else {
      activeVersionData = proposal.versions[proposal.versions.length - 1];
    }
  }

  const versionsList = [];
  if (proposal.currentVersion) {
    for (let i = 1; i <= proposal.currentVersion; i++) {
      versionsList.push(i);
    }
  }

  const formatInr = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // Extract client and lead metadata
  const lead = proposal.lead || proposal.leadId || {};
  const clientName = lead.clientName || 'Valued Client';
  const clientPhone = lead.phone || '—';
  const clientEmail = lead.email || '—';
  const clientCompany = lead.company || '';
  const projectType = (lead.projectType || 'RESIDENTIAL').replace(/_/g, ' ');
  const city = lead.city || 'Indore';
  const siteAddress =
    typeof lead.siteAddress === 'string'
      ? lead.siteAddress
      : lead.siteAddress?.street || lead.siteAddress?.address || 'Site Plot, Indore';

  const salesperson = proposal.assignedSalesperson || proposal.createdBy || {};

  // Financial calculations
  const subtotal = Number(activeVersionData.subTotal || activeVersionData.subtotal || 0);
  const taxTotal = Number(activeVersionData.taxTotal || activeVersionData.taxAmount || 0);
  const grandTotal = Number(activeVersionData.grandTotal || subtotal + taxTotal);
  const grandTotalWords = numberToIndianWords(grandTotal);

  // Line items
  const lineItems = activeVersionData.lineItems || [];

  // Milestones
  const milestones =
    activeVersionData.paymentSchedule ||
    proposal.paymentSchedule ||
    activeVersionData.milestones ||
    [];

  // Terms and conditions
  let terms = activeVersionData.termsAndConditions || proposal.termsAndConditions || [];
  if (typeof terms === 'string') {
    terms = terms.split('\n').filter((t) => t.trim().length > 0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Top Control Bar (Hidden during print) */}
        <div className="print-hide px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Quotation Print & Export Preview</span>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {proposal.proposalNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                A4 printable client document with official letterhead & BOQ rate card
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Version Switcher if multiple */}
            {versionsList.length > 1 && (
              <div className="flex items-center gap-1 mr-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Version:</span>
                {versionsList.map((ver) => (
                  <button
                    key={ver}
                    onClick={() => setSelectedVersion(ver)}
                    className={`px-2 py-0.5 rounded font-mono font-bold text-xs transition-colors ${
                      selectedVersion === ver
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    v{ver}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-950/60">
          <div
            id="printable-proposal"
            className="w-full max-w-3xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-10 font-sans print:p-0 print:shadow-none print:rounded-none print:border-none print:m-0"
            style={{ minHeight: '1050px' }}
          >
            {/* 1. Official Company Header / Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center font-['Outfit'] text-base tracking-wider">
                      SD
                    </div>
                    <div>
                      <h1 className="text-xl font-extrabold tracking-tight text-slate-950 font-['Outfit'] uppercase leading-none">
                        SPEEDDEX INFRASTRUCTURE
                      </h1>
                      <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase block mt-0.5">
                        Civil Engineering & Turnkey Infrastructure Solutions
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2.5 leading-tight">
                    Corporate Office: Scheme No. 78, Vijay Nagar, Indore, Madhya Pradesh - 452010
                    <br />
                    GSTIN: <span className="font-mono font-semibold">23AABCS1234F1Z9</span> • CIN: U45200MP2026PTC012345
                  </p>
                </div>

                <div className="text-left sm:text-right text-[11px] text-slate-600 shrink-0">
                  <p className="font-semibold text-slate-800">Speeddex Sales & Estimations</p>
                  <p>Email: sales@speeddex.in</p>
                  <p>Web: www.speeddex.in</p>
                  <p>Contact: +91 98260 12345</p>
                </div>
              </div>

              {/* Document Banner */}
              <div className="mt-5 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
                  FORMAL BOQ & CONSTRUCTION PROPOSAL
                </span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span>
                    <strong>Quotation #:</strong> {proposal.proposalNumber} (v{selectedVersion})
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Date:</strong>{' '}
                    {new Date(activeVersionData.createdAt || proposal.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Client & Project Dossier Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Client & Project Owner
                </span>
                <p className="font-bold text-slate-950 text-sm">{clientName}</p>
                {clientCompany && <p className="text-slate-700 font-medium">{clientCompany}</p>}
                <p className="text-slate-600 mt-1">Mobile: {clientPhone}</p>
                {clientEmail && clientEmail !== '—' && (
                  <p className="text-slate-600">Email: {clientEmail}</p>
                )}
                <p className="text-slate-600 mt-1">
                  <strong>Site Location:</strong> {siteAddress}, {city}
                </p>
              </div>

              <div className="border-l border-slate-200 pl-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Proposal Specifications
                </span>
                <p>
                  <strong>Project Scope:</strong> {projectType}
                </p>
                {lead.estimatedAreaSqFt > 0 && (
                  <p>
                    <strong>Estimated Area:</strong> {lead.estimatedAreaSqFt} Sq. Ft.
                  </p>
                )}
                <p>
                  <strong>Prepared By:</strong> {salesperson.name || 'Speeddex Estimations Desk'}
                </p>
                <p>
                  <strong>Proposal Validity:</strong>{' '}
                  {activeVersionData.validUntil
                    ? new Date(activeVersionData.validUntil).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '30 Days from issue'}
                </p>
                <p>
                  <strong>Contract Status:</strong>{' '}
                  <span className="font-bold uppercase tracking-wide">
                    {proposal.status?.replace(/_/g, ' ') || 'ACTIVE'}
                  </span>
                </p>
              </div>
            </div>

            {/* 3. Scope of Work */}
            {activeVersionData.scopeOfWork && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                  1. Executive Scope of Work & Structural Specifications
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded border border-slate-200">
                  {activeVersionData.scopeOfWork}
                </p>
              </div>
            )}

            {/* 4. Itemized BOQ Table */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                2. Itemized Bill of Quantities (BOQ) & Rate Breakdown
              </h4>
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                    <th className="py-2 px-2.5 w-8 border-r border-slate-300 text-center">#</th>
                    <th className="py-2 px-3 border-r border-slate-300">Description & Specification</th>
                    <th className="py-2 px-2.5 w-16 text-right border-r border-slate-300">Qty</th>
                    <th className="py-2 px-2.5 w-16 border-r border-slate-300 text-center">Unit</th>
                    <th className="py-2 px-3 w-28 text-right border-r border-slate-300">Rate (₹)</th>
                    <th className="py-2 px-3 w-32 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="print:break-inside-avoid">
                      <td className="py-2 px-2.5 text-center text-slate-500 font-mono border-r border-slate-200">
                        {item.itemNumber || idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className="font-semibold text-slate-900 block">{item.description}</span>
                        {item.remarks && (
                          <span className="text-[10px] text-slate-500 italic block mt-0.5">
                            {item.remarks}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono border-r border-slate-200">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-2.5 text-center uppercase text-[10px] text-slate-600 border-r border-slate-200">
                        {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                        {formatInr(item.unitRate || item.unitPrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatInr(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation Totals */}
              <div className="flex justify-end mt-3">
                <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{formatInr(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Construction Tax):</span>
                    <span className="font-mono font-semibold">{formatInr(taxTotal)}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5 flex justify-between text-slate-950 font-bold text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-amber-600">{formatInr(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Amount in words */}
              <div className="mt-2 text-right">
                <p className="text-[11px] text-slate-600 italic">
                  <strong>Total in Words:</strong> {grandTotalWords}
                </p>
              </div>
            </div>

            {/* 5. Payment Milestones Schedule */}
            {milestones.length > 0 && (
              <div className="mb-6 print:break-inside-avoid">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                  3. Stage-Wise Milestone Payment Schedule
                </h4>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                      <th className="py-1.5 px-2.5 w-8 text-center border-r border-slate-300">#</th>
                      <th className="py-1.5 px-3 border-r border-slate-300">Milestone Stage / Trigger</th>
                      <th className="py-1.5 px-3 w-20 text-center border-r border-slate-300">Percentage</th>
                      <th className="py-1.5 px-3 w-32 text-right">Payable Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {milestones.map((m, idx) => {
                      const shareAmount = Math.round(((grandTotal * (Number(m.percentage) || 0)) / 100 + Number.EPSILON) * 100) / 100;
                      return (
                        <tr key={idx}>
                          <td className="py-1.5 px-2.5 text-center font-mono text-slate-500 border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200">
                            <span className="font-semibold text-slate-800">{m.milestoneName || m.milestone}</span>
                            {m.description && (
                              <span className="text-[10px] text-slate-500 block">{m.description}</span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 text-center font-mono font-bold text-slate-700 border-r border-slate-200">
                            {m.percentage}%
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatInr(shareAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Terms & Guarantees */}
            {terms.length > 0 && (
              <div className="mb-6 print:break-inside-avoid">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                  4. Commercial Terms & Construction Guarantees
                </h4>
                <ul className="list-decimal list-inside text-[11px] text-slate-700 space-y-1 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed">
                  {terms.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                  <li>
                    Speeddex provides a standard 10-Year Structural Guarantee on RCC frame integrity and anti-termite treatment certificate.
                  </li>
                </ul>
              </div>
            )}

            {/* 7. Signatures & Acceptance Block */}
            <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs print:break-inside-avoid">
              <div>
                <p className="font-bold text-slate-900">For Speeddex Infrastructure Pvt. Ltd.</p>
                <div className="h-16 flex items-end">
                  <div className="w-40 border-b border-slate-900"></div>
                </div>
                <p className="font-semibold text-slate-800 mt-1">
                  {salesperson.name || 'Authorized Technical Signatory'}
                </p>
                <p className="text-[11px] text-slate-500">Designation: Sales & Technical Estimations</p>
                <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-IN')}</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900">Client Acceptance & Confirmation</p>
                <div className="h-16 flex items-end justify-end">
                  <div className="w-40 border-b border-slate-900"></div>
                </div>
                <p className="font-semibold text-slate-800 mt-1">{clientName}</p>
                <p className="text-[11px] text-slate-500">Signature & Seal (Signatory)</p>
                <p className="text-[10px] text-slate-400">Date: ____ / ____ / 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
