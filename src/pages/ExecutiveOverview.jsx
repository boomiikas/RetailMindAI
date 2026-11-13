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
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import KPICard from '../components/common/KPICard';
import RiskBadge from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/RiskBadge';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';

const ExecutiveOverview = () => {
  const navigate = useNavigate();
  const { selectedStore, stores, recommendations, approveRecommendation } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    RetailPulseApi.getExecutiveOverview(selectedStore).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Unable to load executive overview:', error);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [selectedStore]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)' }}>
          <Sparkles className="pulse-dot" />
          <span style={{ fontWeight: 600 }}>{selectedStore === 'all' ? 'Loading network overview...' : 'Loading selected location...'}</span>
        </div>
      </div>
    );
  }

  const { kpis, demandTrend, inventoryHealth, storeRisks } = data;
  const isNetworkView = selectedStore === 'all';
  const selectedStoreLabel = stores.find((store) => store.id === selectedStore)?.city || kpis.selectedStoreLabel || 'Selected store';
  const visibleRecommendations = isNetworkView
    ? recommendations
    : recommendations.filter((rec) => rec.store_id === selectedStore || String(rec.store || '').includes(selectedStore));

  return (
    <div className="overview-page">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Executive Control Tower</h2>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="kpi-grid">
        <KPICard
          title="Total Stores"
          value={kpis.totalStores}
          trend={isNetworkView ? `${kpis.totalStores} Hubs Active` : 'Selected location'}
          trendDirection={isNetworkView ? 'positive' : 'neutral'}
          subtitle={isNetworkView ? 'Tamil Nadu Network' : selectedStoreLabel}
          icon={Store}
          iconColor="var(--color-primary)"
          iconBg="var(--color-primary-light)"
        />
        <KPICard
          title="Products Monitored"
          value={kpis.productsMonitored.toLocaleString('en-IN')}
          subtitle={isNetworkView ? 'SKUs across the network' : 'SKUs at this location'}
          icon={Package}
          iconColor="#0D9488"
          iconBg="#CCFBF1"
        />
        <KPICard
          title="Stockout Risks"
          value={kpis.stockoutRisks}
          trend={kpis.criticalRisks > 0 ? `${kpis.criticalRisks} critical` : undefined}
          trendDirection="negative"
          subtitle={kpis.stockoutRisks > 0 ? 'Location stockout risks' : 'No stockout risks'}
          icon={AlertOctagon}
          iconColor="#DC2626"
          iconBg="#FEE2E2"
        />
        <KPICard
          title="Overstock Risks"
          value={kpis.overstockRisks}
          trend={kpis.overstockRisks > 0 ? `${kpis.overstockRisks} at risk` : undefined}
          trendDirection="warning"
          subtitle={kpis.overstockRisks > 0 ? 'Review local surplus' : 'No overstock risks'}
          icon={Boxes}
          iconColor="#F59E0B"
          iconBg="#FEF3C7"
        />
        <KPICard
          title="AI Recommendations"
          value={kpis.aiRecommendations}
          subtitle="Automated & Supervised"
          icon={Cpu}
          iconColor="#7C3AED"
          iconBg="#F3E8FF"
          badgeText={kpis.recommendationConfidence}
        />
        <KPICard
          title="Margin at Risk"
          value={kpis.estimatedProfitAtRisk}
          subtitle={isNetworkView ? 'From active network alerts' : `From alerts at ${selectedStoreLabel}`}
          icon={IndianRupee}
          iconColor="#16A34A"
          iconBg="#DCFCE7"
        />
      </div>

      {/* Row: Charts (Demand Trend Line & Inventory Health Donut) */}
      <div className="grid-3-1">
        {/* Demand Trend Line Chart */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">
                <TrendingUp size={18} color="var(--color-primary)" />
                {isNetworkView ? 'Network Milk Demand Trajectory' : `${selectedStoreLabel} Milk Demand Trajectory`}
              </div>
              <div className="section-card-subtitle">
                Aavin Toned Fresh Milk · Historical sales and 7-day demand forecast (units)
              </div>
            </div>
            <span className="badge badge-primary">Model Confidence: 96.2%</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} domain={[0, 'dataMax + 10']} />
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
                  name="AI Predicted Demand (P50)"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="optimalStock"
                  name="High Forecast (P90)"
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
              <div className="section-card-title">Inventory Health</div>
              <div className="section-card-subtitle">{kpis.productsMonitored.toLocaleString('en-IN')} active SKUs {isNetworkView ? 'across the network' : `at ${selectedStoreLabel}`}</div>
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
              <div className="section-card-title">{isNetworkView ? 'Store-Wise Stockout & Overstock Distribution' : `${selectedStoreLabel} Stockout & Overstock Risks`}</div>
              <div className="section-card-subtitle">{isNetworkView ? 'Active product count at risk by store node' : 'Active product counts at this location'}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/inventory')}>
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

        {/* Recent AI Recommendations Snippet with 1-Click Approvals */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">
                <Sparkles size={18} color="var(--color-purple)" />
                Recent AI Recommendations
              </div>
              <div className="section-card-subtitle">High-conviction decisions awaiting approval</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/decisions')}>
              Review All Queue
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visibleRecommendations.slice(0, 3).map((rec) => (
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
            {visibleRecommendations.length === 0 && (
              <div style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                No recommendations for {isNetworkView ? 'the current network' : selectedStoreLabel}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveOverview;
