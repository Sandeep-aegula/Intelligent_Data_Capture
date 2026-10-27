import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function KPICard({ title, value, suffix = '', icon: Icon, trend, trendLabel, color = 'primary' }) {
  const colorMap = {
    primary: {
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    success: {
      iconBg: 'bg-success-50',
      iconColor: 'text-success-600',
    },
    warning: {
      iconBg: 'bg-warning-50',
      iconColor: 'text-warning-600',
    },
    danger: {
      iconBg: 'bg-danger-50',
      iconColor: 'text-danger-600',
    },
    info: {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  };

  const colors = colorMap[color] || colorMap.primary;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-slate-400';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">
            {value}
            {suffix && <span className="text-base font-medium text-slate-500 ml-0.5">{suffix}</span>}
          </p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${colors.iconBg} ${colors.iconColor} flex items-center justify-center`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trendLabel && (
        <div className="mt-3 flex items-center gap-1">
          <TrendIcon size={14} className={trendColor} />
          <span className={`text-xs font-medium ${trendColor}`}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
