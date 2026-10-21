import React from 'react';

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'amber',
  onClick,
}) => {
  const colorMap = {
    amber: 'from-amber-500/10 to-transparent text-amber-600 border-amber-200 bg-amber-50',
    blue: 'from-blue-500/10 to-transparent text-blue-600 border-blue-200 bg-blue-50',
    emerald: 'from-emerald-500/10 to-transparent text-emerald-600 border-emerald-200 bg-emerald-50',
    purple: 'from-purple-500/10 to-transparent text-purple-600 border-purple-200 bg-purple-50',
    rose: 'from-rose-500/10 to-transparent text-rose-600 border-rose-200 bg-rose-50',
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-xs transition-all duration-300 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className={`absolute top-0 right-0 -mr-8 -mt-8 w-28 h-28 rounded-full bg-gradient-to-br ${currentTheme} blur-2xl opacity-40 pointer-events-none`}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
              {value}
            </span>
            {trend && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`p-3 rounded-xl border ${currentTheme}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
