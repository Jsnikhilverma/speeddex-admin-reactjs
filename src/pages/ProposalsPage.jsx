import React, { useState, useEffect } from 'react';
import { proposalApi } from '../api/proposalApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CreateProposalModal } from '../components/proposals/CreateProposalModal';
import { CreateRevisionModal } from '../components/proposals/CreateRevisionModal';
import { EditProposalModal } from '../components/proposals/EditProposalModal';
import { AcceptProposalModal } from '../components/proposals/AcceptProposalModal';
import { ProposalDetailModal } from '../components/proposals/ProposalDetailModal';
import {
  FileSpreadsheet,
  Plus,
  Search,
  RefreshCw,
  Award,
  GitBranch,
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Layers,
  Printer,
  Pencil,
} from 'lucide-react';
import { PrintableProposalModal } from '../components/proposals/PrintableProposalModal';
import { PageHeaderGuide } from '../components/common/PageHeaderGuide';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  SENT: { label: 'Sent to Client', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  VIEWED: { label: 'Client Viewed', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  REVISION_REQUESTED: { label: 'Revision Req', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  ACCEPTED: { label: 'Awarded (Won)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  REJECTED: { label: 'Declined', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  EXPIRED: { label: 'Expired', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export const ProposalsPage = ({ onNavigateTab, tabParams }) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [proposals, setProposals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProposalForDetail, setSelectedProposalForDetail] = useState(null);
  const [selectedProposalForRevision, setSelectedProposalForRevision] = useState(null);
  const [selectedProposalForEdit, setSelectedProposalForEdit] = useState(null);
  const [selectedProposalForAccept, setSelectedProposalForAccept] = useState(null);
  const [selectedProposalForPrint, setSelectedProposalForPrint] = useState(null);

  useEffect(() => {
    loadProposals();
  }, [pagination.page, statusFilter]);

  // Sync with Sidebar sub-links and Quick Actions
  useEffect(() => {
    if (tabParams?.filter !== undefined) {
      setStatusFilter(tabParams.filter);
    }
    if (tabParams?.search !== undefined) {
      setSearch(tabParams.search);
      setPagination((p) => ({ ...p, page: 1 }));
    }
    if (tabParams?.autoOpenCreate) {
      setIsCreateOpen(true);
    }
  }, [tabParams]);

  const loadProposals = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await proposalApi.getProposals(params);
      const propList = Array.isArray(res?.data)
        ? res.data
        : res?.data?.proposals || res?.proposals || [];
      setProposals(propList);

      const pag = res?.meta?.pagination || res?.data?.pagination || res?.pagination;
      if (pag) {
        setPagination({
          page: pag.page || 1,
          limit: pag.limit || 10,
          total: pag.total ?? propList.length,
          pages: pag.totalPages || pag.pages || 1,
        });
      } else {
        setPagination((prev) => ({ ...prev, total: propList.length }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to load proposals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    loadProposals();
  };

  const formatInr = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Aggregated KPI Stats
  const totalValueAwarded = proposals
    .filter((p) => p.status === 'ACCEPTED')
    .reduce((acc, p) => acc + (p.acceptanceDetails?.finalContractValue || p.grandTotal || 0), 0);

  const activeRevisionsCount = proposals.filter(
    (p) => p.status === 'REVISION_REQUESTED' || p.currentVersion > 1
  ).length;

  return (
    <div className="space-y-6">
      {/* Contextual User Experience Guide */}


      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
              Proposals & Estimation (BOQ)
            </h1>
            {/* <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Commercial Desk
            </span> */}
          </div>
          {/* <p className="text-xs text-slate-400 mt-1">
            Bill of Quantities (BOQ), rate revisions, client negotiation feedback & single-award contract executions
          </p> */}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProposals}
            title="Refresh"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Generate Proposal (BOQ)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Quotes</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white font-['Outfit']">{pagination.total || proposals.length}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Active proposal dossiers</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Awarded Contracts</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-['Outfit']">
            {proposals.filter((p) => p.status === 'ACCEPTED').length}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Single-award locked contracts</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Awarded Value</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white font-['Outfit'] truncate">
            {formatInr(totalValueAwarded)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Cumulative contract sum</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Revisions</span>
            <GitBranch className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 font-['Outfit']">
            {activeRevisionsCount}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">In multi-version negotiations</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposal #, client, title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Proposal Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Proposal #</th>
                <th className="py-3.5 px-4">Lead & Client</th>
                <th className="py-3.5 px-4">Title / Scope</th>
                {/* <th className="py-3.5 px-4">Version</th> */}
                <th className="py-3.5 px-4">Grand Total (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading proposals & BOQ cost sheets...</span>
                  </td>
                </tr>
              ) : proposals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-400">No proposals found</p>
                    <p className="text-xs text-slate-600 mt-1">Generate a new BOQ quote for an existing lead</p>
                  </td>
                </tr>
              ) : (
                proposals.map((prop) => {
                  const statusConf = STATUS_CONFIG[prop.status] || {
                    label: prop.status,
                    color: 'bg-slate-800 text-slate-400',
                  };

                  return (
                    <tr
                      key={prop._id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Proposal # */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedProposalForDetail(prop._id)}
                          className="font-mono text-xs font-bold text-amber-400 hover:underline text-left block"
                        >
                          {prop.proposalNumber}
                        </button>
                        <span className="text-[10px] text-slate-500">
                          {new Date(prop.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      {/* Lead & Client */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {prop.lead?.clientName || prop.leadId?.clientName || 'Client'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {prop.lead?.leadNumber || prop.leadId?.leadNumber} • {prop.lead?.city || prop.leadId?.city || 'Indore'}
                          </span>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-200 truncate font-medium">{prop.title}</p>
                        {(prop.scopeOfWork || prop.versions?.[prop.versions?.length - 1]?.scopeOfWork) && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {prop.scopeOfWork || prop.versions?.[prop.versions?.length - 1]?.scopeOfWork}
                          </p>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-white text-xs">
                          {formatInr(
                            prop.grandTotal ||
                            prop.acceptedAmount ||
                            prop.versions?.[prop.versions?.length - 1]?.grandTotal ||
                            0
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border tracking-wide uppercase ${statusConf.color}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Validity */}
                      <td className="py-3 px-4">
                        <span className="text-slate-400 text-[11px]">
                          {(() => {
                            const dateVal =
                              prop.validUntil ||
                              prop.versions?.[prop.versions?.length - 1]?.validUntil;
                            return dateVal
                              ? new Date(dateVal).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })
                              : '30 Days';
                          })()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProposalForDetail(prop._id)}
                            title="View Full BOQ & Versions"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedProposalForPrint(prop)}
                            title="Print Formal Proposal Quotation for Client"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {prop.status !== 'ACCEPTED' && (
                            <>
                              <button
                                onClick={() => setSelectedProposalForEdit(prop)}
                                title="Edit Proposal (Update Rates / Items in place)"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setSelectedProposalForRevision(prop)}
                                title="Create New Revision (v+1)"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
                              >
                                <GitBranch className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setSelectedProposalForAccept(prop)}
                                title="Award & Accept Contract"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              >
                                <Award className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {proposals.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} proposals
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2 text-slate-300">
              {pagination.page} / {pagination.pages || 1}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.pages, p.page + 1) }))}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <CreateProposalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          loadProposals();
        }}
      />

      <ProposalDetailModal
        isOpen={!!selectedProposalForDetail}
        proposalId={selectedProposalForDetail}
        onClose={() => setSelectedProposalForDetail(null)}
        onUpdated={() => loadProposals()}
        onOpenRevisionModal={(p) => setSelectedProposalForRevision(p)}
        onOpenEditModal={(p) => setSelectedProposalForEdit(p)}
        onOpenAcceptModal={(p) => setSelectedProposalForAccept(p)}
      />

      <EditProposalModal
        isOpen={!!selectedProposalForEdit}
        proposal={selectedProposalForEdit}
        onClose={() => setSelectedProposalForEdit(null)}
        onUpdated={() => loadProposals()}
      />

      <CreateRevisionModal
        isOpen={!!selectedProposalForRevision}
        proposal={selectedProposalForRevision}
        onClose={() => setSelectedProposalForRevision(null)}
        onCreated={() => loadProposals()}
      />

      <AcceptProposalModal
        isOpen={!!selectedProposalForAccept}
        proposal={selectedProposalForAccept}
        onClose={() => setSelectedProposalForAccept(null)}
        onAccepted={() => loadProposals()}
      />

      <PrintableProposalModal
        isOpen={!!selectedProposalForPrint}
        proposal={selectedProposalForPrint}
        onClose={() => setSelectedProposalForPrint(null)}
      />
    </div>
  );
};
