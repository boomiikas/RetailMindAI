import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  Store,
  Package,
  AlertOctagon,
  Boxes,
  Cpu,
  IndianRupee,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import KPICard from '../components/common/KPICard';
import RiskBadge from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/RiskBadge';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';

const ExecutiveOverview = () => {
  const navigate = useNavigate();
  const { selectedStore, recommendations, approveRecommendation } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getExecutiveOverview(selectedStore).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [selectedStore]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)' }}>
          <Sparkles className="pulse-dot" />
          <span style={{ fontWeight: 600 }}>Synthesizing network decision intelligence...</span>
        </div>
      </div>
    );
  }

  const { kpis, alerts, demandTrend, inventoryHealth, storeRisks } = data;

  return (
    <div className="overview-page">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Good morning, Retail Manager</h2>
          <p className="page-subtitle">Here is your retail network's decision intelligence overview.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-success" style={{ padding: '0.4rem 0.75rem' }}>
            <span className="pulse-dot" /> Autonomous Engine: Active (94.2% Accuracy)
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/decisions')}>
            <Cpu size={15} /> Review All Decisions
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <KPICard
          title="Total Stores"
          value={kpis.totalStores}
          trend="+2 New"
          trendDirection="positive"
          subtitle="All Regional Hubs"
          icon={Store}
          iconColor="#2563EB"
          iconBg="#EFF6FF"
        />
        <KPICard
          title="Products Monitored"
          value="1,250"
          subtitle="SKU Velocity Tracks"
          icon={Package}
          iconColor="#0D9488"
          iconBg="#CCFBF1"
        />
        <KPICard
          title="Stockout Risks"
          value={kpis.stockoutRisks}
          trend="+3 vs yesterday"
          trendDirection="negative"
          subtitle="Requires attention"
          icon={AlertOctagon}
          iconColor="#DC2626"
          iconBg="#FEE2E2"
        />
        <KPICard
          title="Overstock Risks"
          value={kpis.overstockRisks}
          trend="-5 vs last week"
          trendDirection="positive"
          subtitle="Excess working capital"
          icon={Boxes}
          iconColor="#F59E0B"
          iconBg="#FEF3C7"
        />
        <KPICard
          title="AI Recommendations"
          value={kpis.aiRecommendations}
          subtitle="42 Optimizations ready"
          icon={Cpu}
          iconColor="#7C3AED"
          iconBg="#F3E8FF"
          badgeText="94% Confidence"
        />
        <KPICard
          title="Profit at Risk"
          value={kpis.estimatedProfitAtRisk}
          trend="8.4% of total margin"
          trendDirection="negative"
          subtitle="Recoverable by AI"
          icon={IndianRupee}
          iconColor="#B91C1C"
          iconBg="#FEE2E2"
        />
      </div>

      {/* Situations Requiring Attention (Alerts) */}
      <div className="section-card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-card-header">
          <div>
            <div className="section-card-title">
              <AlertTriangle size={18} color="var(--color-danger)" />
              Business situations requiring attention
            </div>
            <div className="section-card-subtitle">
              Prioritized high-consequence operational bottlenecks identified across Tamil Nadu supermarket stores
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/risks')}>
            View Risk Centre <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-card-item ${alert.severity}`}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <RiskBadge severity={alert.severity} label={alert.store} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{alert.time}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                  {alert.title}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                  {alert.description}
                </p>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    backgroundColor: 'rgba(37, 99, 235, 0.06)',
                    padding: '0.35rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Sparkles size={13} />
                  <span>Action: {alert.actionRequired}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row: Charts (Demand Trend Line & Inventory Health Donut) */}
      <div className="grid-3-1">
        {/* Demand Trend Line Chart */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">
                <TrendingUp size={18} color="var(--color-primary)" />
                Network Demand Forecast vs Historical Actuals
              </div>
              <div className="section-card-subtitle">
                Combined 14-day trailing actuals and 7-day forward predictive AI trajectory (Units)
              </div>
            </div>
            <span className="badge badge-primary">Model Confidence: 96.2%</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} domain={[1200, 2200]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    color: '#FFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.8rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="historical"
                  name="Historical Sales"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="AI Predicted Demand"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="optimalStock"
                  name="Optimal Stock Threshold"
                  stroke="#16A34A"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Health Donut Chart */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">Network Inventory Health</div>
              <div className="section-card-subtitle">1,250 Monitored SKUs Distribution</div>
            </div>
          </div>

          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryHealth}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {inventoryHealth.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
            {inventoryHealth.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{item.name}:</span>
                <span style={{ fontWeight: 700 }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Store Risk Bar Chart & Recent AI Recommendations */}
      <div className="grid-2">
        {/* Store-wise Risk Bar Chart */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">Store-Wise Stockout & Overstock Distribution</div>
              <div className="section-card-subtitle">Active product count at risk by store location</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/network')}>
              Network Map <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeRisks} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="store" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '0.8rem' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '6px' }} />
                <Bar dataKey="stockout" name="Stockout Risk Count" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overstock" name="Overstock Risk Count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent AI Recommendations Snippet */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">
                <Sparkles size={18} color="var(--color-purple)" />
                Recent AI Recommendations
              </div>
              <div className="section-card-subtitle">Decisions awaiting executive review</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/decisions')}>
              Open Decision Centre
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                style={{
                  padding: '0.85rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{rec.sku}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{rec.store}</span>
                    <RiskBadge severity={rec.priority} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Action: <strong>{rec.action}</strong> ({rec.quantity}) • Impact: {rec.impact}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {rec.status === 'Pending' ? (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => approveRecommendation(rec.id)}
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                  ) : (
                    <StatusBadge status={rec.status} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveOverview;
