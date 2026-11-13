import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Clock,
  ShieldCheck,
  Boxes,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';

const RiskCentre = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'all';
    setActiveTab(['stockout', 'overstock', 'supplier', 'critical'].includes(tab) ? tab : 'all');
  }, [searchParams]);

  const { selectedStore, setSelectedStore, stores } = useApp();
  const [risks, setRisks] = useState([]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    let isMounted = true;
    const categoryParam =
      activeTab === 'stockout'
        ? 'stockout'
        : activeTab === 'overstock'
        ? 'overstock'
        : activeTab === 'supplier'
        ? 'supplier'
        : activeTab === 'critical'
        ? 'all'
        : 'all';

    RetailPulseApi.getRisks({ store: selectedStore, category: categoryParam }).then((riskData) => {
      if (isMounted) {
        setRisks(riskData || []);
      }
    });

    return () => { isMounted = false; };
  }, [selectedStore, activeTab]);

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
    { name: 'Stockout', count: risks.filter(r => r.category?.toLowerCase().includes('stockout') && !r.category?.toLowerCase().includes('promotion')).length },
    { name: 'Overstock', count: risks.filter(r => r.category?.toLowerCase().includes('overstock')).length },
    { name: 'Supplier Delay', count: risks.filter(r => r.category?.toLowerCase().includes('supplier')).length },
    { name: 'Expiry Risk', count: risks.filter(r => r.category?.toLowerCase().includes('expiry')).length },
  ];

  // Filtered Risks for Active Tab
  let displayRisks = risks;
  if (activeTab === 'stockout') {
    displayRisks = risks.filter(r => r.category?.toLowerCase().includes('stockout'));
  } else if (activeTab === 'overstock') {
    displayRisks = risks.filter(r => r.category?.toLowerCase().includes('overstock'));
  } else if (activeTab === 'supplier') {
    displayRisks = risks.filter(r => r.category?.toLowerCase().includes('supplier'));
  } else if (activeTab === 'critical') {
    displayRisks = risks.filter(r => r.severity === 'critical');
  }

  // Table Columns for Risks
  const riskColumns = [
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
      header: 'Financial Loss Exposure',
      key: 'financialImpact',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
          {row.financialImpact == null ? 'Unavailable' : `₹${Math.round(row.financialImpact).toLocaleString('en-IN')}`}
        </span>
      ),
    },
    {
      header: 'Root Cause & Reason',
      key: 'reason',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          {row.reason || 'Unavailable'}
        </span>
      ),
    },
    {
      header: 'Affected Quantity',
      key: 'affectedQuantity',
      render: (row) => row.affectedQuantity == null ? 'Unavailable' : `${row.affectedQuantity} units`,
    },
    {
      header: 'Expected Occurrence',
      key: 'expectedOccurrence',
      render: (row) => row.expectedOccurrence ? String(row.expectedOccurrence).slice(0, 10) : 'Unavailable',
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => row.status || 'Unavailable',
    },
  ];

  return (
    <div className="risk-centre-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Risk & Alerts</h2>
          <p className="page-subtitle">
            Live inventory risk records for the selected store locations.
          </p>
        </div>

        {/* Store Selector */}
        <div className="filter-control">
          <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Store:</span>
          <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <ShieldAlert size={15} style={{ display: 'inline', marginRight: '6px' }} />
          All Risks ({risks.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'stockout' ? 'active' : ''}`}
          onClick={() => handleTabChange('stockout')}
        >
          <AlertOctagon size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Stockout Risks ({risks.filter(r => r.category?.toLowerCase().includes('stockout')).length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'overstock' ? 'active' : ''}`}
          onClick={() => handleTabChange('overstock')}
        >
          <Boxes size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Overstock Risks ({risks.filter(r => r.category?.toLowerCase().includes('overstock')).length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'supplier' ? 'active' : ''}`}
          onClick={() => handleTabChange('supplier')}
        >
          <Clock size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Supplier Disruptions
        </button>



        <button
          className={`tab-btn ${activeTab === 'critical' ? 'active' : ''}`}
          onClick={() => handleTabChange('critical')}
        >
          <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Critical Alerts ({criticalCount})
        </button>
      </div>

      {/* Severity Summary Cards (Visible across all tabs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '5px solid #DC2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#DC2626' }}>CRITICAL SEVERITY</span>
            <AlertOctagon size={18} color="#DC2626" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DC2626' }}>{criticalCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Critical risk records
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '5px solid #F97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#F97316' }}>HIGH SEVERITY</span>
            <AlertTriangle size={18} color="#F97316" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F97316' }}>{highCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            High risk records
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '5px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#F59E0B' }}>MEDIUM SEVERITY</span>
            <Clock size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F59E0B' }}>{mediumCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Medium risk records
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '5px solid #16A34A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#16A34A' }}>LOW / MITIGATED</span>
            <ShieldCheck size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16A34A' }}>{lowCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Low risk records
          </span>
        </div>
      </div>

      {/* Charts Row */}
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
                  Recorded severity, exposure, and occurrence details
                </div>
              </div>
            </div>

            <DataTable columns={riskColumns} data={displayRisks} />
          </div>

    </div>
  );
};

export default RiskCentre;
