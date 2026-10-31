import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const KPICard = ({
  title,
  value,
  trend,
  trendDirection = 'positive',
  subtitle,
  icon: Icon,
  iconColor = 'var(--color-primary)',
  iconBg = 'var(--color-primary-light)',
  badgeText,
}) => {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <div className="kpi-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="kpi-value-row">
        <span className="kpi-value">{value}</span>
        {trend && (
          <span className={`kpi-trend ${trendDirection}`}>
            {trendDirection === 'positive' && <ArrowUpRight size={14} />}
            {trendDirection === 'negative' && <ArrowDownRight size={14} />}
            {trendDirection === 'neutral' && <Minus size={14} />}
            {trend}
          </span>
        )}
      </div>

      {(subtitle || badgeText) && (
        <div className="kpi-footer">
          {subtitle && <span>{subtitle}</span>}
          {badgeText && (
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
