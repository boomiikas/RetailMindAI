import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Filter,
  DollarSign,
  Package
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';

const RISK_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'stockout', label: 'Stockout Risk' },
  { id: 'overstock', label: 'Overstock Risk' },
  { id: 'expiry', label: 'Expiry Risk' },
  { id: 'supplier', label: 'Supplier Disruption' },
  { id: 'promotion', label: 'Promotion-Induced Stockout' },
];

const RiskCentre = () => {
  const navigate = useNavigate();
  const { selectedStore, setSelectedStore, stores } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getRisks({ store: selectedStore, category: selectedCategory }).then((data) => {
      if (isMounted) {
        setRisks(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [selectedStore, selectedCategory]);

  // Aggregate statistics
  const criticalCount = risks.filter(r => r.severity === 'critical').length;
  const highCount = risks.filter(r => r.severity === 'high').length;
  const mediumCount = risks.filter(r => r.severity === 'medium').length;
  const lowCount = risks.filter(r => r.severity === 'low').length;

  const distributionChartData = [
    { name: 'Critical Risk', count: criticalCount, color: '#DC2626' },
    { name: 'High Risk', count: highCount, color: '#F97316' },
    { name: 'Medium Risk', count: mediumCount, color: '#F59E0B' },
    { name: 'Low / Monitored', count: lowCount, color: '#16A34A' },
  ];

  const categoryBreakdownData = [
    { name: 'Stockout', count: risks.filter(r => r.category.toLowerCase().includes('stockout') && !r.category.toLowerCase().includes('promotion')).length },
    { name: 'Overstock', count: risks.filter(r => r.category.toLowerCase().includes('overstock')).length },
    { name: 'Promotion Stockout', count: risks.filter(r => r.category.toLowerCase().includes('promotion')).length },
    { name: 'Supplier Delay', count: risks.filter(r => r.category.toLowerCase().includes('supplier')).length },
    { name: 'Expiry Risk', count: risks.filter(r => r.category.toLowerCase().includes('expiry')).length },
  ];

  const columns = [
    {
      header: 'Score',
      key: 'score',
      width: '80px',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: row.score > 85 ? '#FEE2E2' : row.score > 70 ? '#FEF3C7' : '#DCFCE7',
              color: row.score > 85 ? '#DC2626' : row.score > 70 ? '#D97706' : '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              border: `2px solid ${row.score > 85 ? '#DC2626' : row.score > 70 ? '#F59E0B' : '#16A34A'}`,
            }}
          >
            {row.score}
          </div>
        </div>
      ),
    },
    {
      header: 'Product & Store',
      key: 'product',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.product}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
            <span>{row.store}</span>
            <span>•</span>
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Severity',
      key: 'severity',
      width: '110px',
      render: (row) => <RiskBadge severity={row.severity} />,
    },
    {
      header: 'Financial Impact',
      key: 'financialImpact',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
          {row.financialImpact}
        </span>
      ),
    },
    {
      header: 'Root Cause & Reason',
      key: 'reason',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          {row.reason}
        </span>
      ),
    },
    {
      header: 'Recommended Next Action',
      key: 'recommendedAction',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            {row.recommendedAction}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.4rem' }}
            onClick={() => navigate('/decisions')}
            title="Open Decision"
          >
            <ArrowRight size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="risk-centre-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Risk Centre</h2>
          <p className="page-subtitle">
            Autonomous multi-category vulnerability detection, severity scoring, and financial risk mitigation.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="filter-control">
            <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Store:</span>
            <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-control">
            <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Category:</span>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {RISK_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Risk Severity Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '5px solid #DC2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#DC2626' }}>CRITICAL SEVERITY</span>
            <AlertOctagon size={18} color="#DC2626" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DC2626' }}>{criticalCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Immediate stockout (&lt;12 hrs) or major loss
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '5px solid #F97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#F97316' }}>HIGH SEVERITY</span>
            <AlertTriangle size={18} color="#F97316" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F97316' }}>{highCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Stockout in 1–3 days without intervention
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '5px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#F59E0B' }}>MEDIUM SEVERITY</span>
            <Clock size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F59E0B' }}>{mediumCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Overstock & slow-moving expiry risk
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '5px solid #16A34A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#16A34A' }}>LOW / MITIGATED</span>
            <ShieldAlert size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16A34A' }}>{lowCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Controlled risk under automated routing
          </span>
        </div>
      </div>

      {/* Row: Charts (Risk Distribution Donut & Category Breakdown Bar) */}
      <div className="grid-2">
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">Risk Severity Breakdown</div>
              <div className="section-card-subtitle">Severity level distribution across filtered nodes</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="count"
                  paddingAngle={4}
                >
                  {distributionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            {distributionChartData.map((item) => (
              <span key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: item.color }} />
                <span>{item.name}: <strong>{item.count}</strong></span>
              </span>
            ))}
          </div>
        </div>

        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">Risk Incidents by Category</div>
              <div className="section-card-subtitle">Active retail bottlenecks grouped by primary category</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdownData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#64748B" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '0.8rem' }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Risk Registry Table */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <div className="section-card-title">Product & Store Risk Registry</div>
            <div className="section-card-subtitle">
              Calculated composite risk score (0–100) and expected financial loss exposure
            </div>
          </div>
          <span className="badge badge-primary">
            <Sparkles size={12} /> Real-time Evaluator
          </span>
        </div>

        <DataTable columns={columns} data={risks} />
      </div>
    </div>
  );
};

export default RiskCentre;
