import React, { useState } from 'react';
import { Coffee, Utensils, Briefcase, User, X, Check, AlertCircle } from 'lucide-react';

const BREAK_OPTIONS = [
  {
    type: 'LUNCH_BREAK',
    label: 'Lunch Break',
    icon: Utensils,
    isPaid: false,
    desc: 'Unpaid rest break for midday meal (30-45 mins)',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300',
  },
  {
    type: 'TEA_BREAK',
    label: 'Tea / Refreshment Break',
    icon: Coffee,
    isPaid: true,
    desc: 'Paid short refreshment break (up to 15 mins)',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300',
  },
  {
    type: 'OFFICIAL_WORK_BREAK',
    label: 'Official Site Travel',
    icon: Briefcase,
    isPaid: true,
    desc: 'Paid transit time for site inspection or client coordination',
    color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-300',
  },
  {
    type: 'PERSONAL_BREAK',
    label: 'Personal Break',
    icon: User,
    isPaid: false,
    desc: 'Unpaid personal pause during shift',
    color: 'from-slate-500/20 to-slate-600/20 border-slate-500/40 text-slate-300',
  },
];

export const StartBreakModal = ({ isOpen, onClose, onStartBreak }) => {
  const [selectedType, setSelectedType] = useState('LUNCH_BREAK');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onStartBreak({ breakType: selectedType, remarks });
      onClose();
    } catch (err) {
      // handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">Pause Work & Start Break</h2>
              <p className="text-xs text-slate-400">Select break classification per company policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2.5">
            {BREAK_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedType === opt.type;
              return (
                <div
                  key={opt.type}
                  onClick={() => setSelectedType(opt.type)}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? `bg-gradient-to-r ${opt.color} ring-1 ring-amber-500/50 shadow-lg`
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-slate-950/60' : 'bg-slate-900 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{opt.label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          opt.isPaid
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {opt.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Break Remarks / Notes (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Canteen lunch with site surveying team"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Starting Break...' : 'Confirm Break'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
