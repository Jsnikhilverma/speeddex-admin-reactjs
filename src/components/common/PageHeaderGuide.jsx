import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const PageHeaderGuide = ({
  title,
  subtitle,
  badge,
  badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  workflowSteps = [],
  quickActions = [],
  storageKey,
}) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`guide_${storageKey}`);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (storageKey) {
      localStorage.setItem(`guide_${storageKey}`, String(next));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs p-4 sm:p-5 transition-all">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm font-['Outfit']">
                {title}
              </span>
              {badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={toggleOpen}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shrink-0"
          title={isOpen ? 'Collapse Guide' : 'Expand Guide'}
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">{isOpen ? 'Hide Guide' : 'How it works'}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200 space-y-4">
          {/* Workflow Steps */}
          {workflowSteps.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                Workflow Guide (Kaise kaam karta hai):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {workflowSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Bar */}
          {quickActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1 font-mono uppercase tracking-wider">
                Quick Actions:
              </span>
              {quickActions.map((qa, idx) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={idx}
                    onClick={qa.onClick}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      qa.primary
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-500'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{qa.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
