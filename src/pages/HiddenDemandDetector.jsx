import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  Search,
  EyeOff,
  Eye,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  HelpCircle,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import DataTable from '../components/common/DataTable';

const HiddenDemandDetector = () => {
  const { selectedStore, setSelectedStore, stores } = useApp();
  const [hiddenData, setHiddenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getHiddenDemand(selectedStore).then((data) => {
      if (isMounted) {
        setHiddenData(data);
        setSelectedItem(data[0]);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [selectedStore]);

  const columns = [
    {
      header: 'Product & Store',
      key: 'product',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.product}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{row.store}</span>
        </div>
      ),
    },
    {
      header: 'Recorded Sales',
      key: 'recordedSales',
      align: 'right',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {row.recordedSales} units
        </span>
      ),
    },
    {
      header: 'Est. Unmet Demand',
      key: 'estimatedUnmetDemand',
      align: 'right',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#DC2626' }}>
          +{row.estimatedUnmetDemand} units
        </span>
      ),
    },
    {
      header: 'Est. True Market Demand',
      key: 'estimatedTrueDemand',
      align: 'right',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-primary)' }}>
          {row.estimatedTrueDemand} units
        </span>
      ),
    },
    {
      header: 'Stockout Duration',
      key: 'stockoutDurationHours',
      align: 'center',
      render: (row) => (
        <span className="badge badge-danger">
          <Clock size={11} /> {row.stockoutDurationHours} Hours
        </span>
      ),
    },
    {
      header: 'Walkout Loss %',
      key: 'substitutionLossPct',
      align: 'center',
      render: (row) => (
        <span style={{ fontWeight: 700, color: '#B91C1C' }}>
          {row.substitutionLossPct}
        </span>
      ),
    },
    {
      header: 'Inspect',
      key: 'action',
      render: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedItem(row)}
        >
          View Signal
        </button>
      ),
    },
  ];

  return (
    <div className="hidden-demand-detector-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Hidden Demand Detector (Stockout Reconstruction)</h2>
          <p className="page-subtitle">
            Uncovers lost customer demand blinded by historical stockouts and reconstructs true consumer intent.
          </p>
        </div>

        <div className="filter-control">
          <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Store:</span>
          <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Model Transparency Banner */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#FAF5FF',
          border: '1px solid #D8B4FE',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <Sparkles size={24} color="#7C3AED" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            AI Stockout Reconstruction Model
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>MODEL ESTIMATES</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#581C87', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
            Standard ERP analytics only record cash register transactions. When shelves run empty, recorded sales drop to 0, falsely training naive forecasting models that demand has disappeared. RetailPulse AI reconstructs true demand by synthesizing footfall, weather surges, peer SKU cross-elasticities, and search queries.
          </p>
        </div>
      </div>

      {/* Deep-Dive Case Study on Selected Item */}
      {selectedItem && (
        <div className="section-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-card-header">
            <div>
              <div className="section-card-title">
                <Search size={18} color="var(--color-primary)" />
                Case Study: {selectedItem.product} ({selectedItem.store})
              </div>
              <div className="section-card-subtitle">
                Model reconstructed timeline: Recorded Cashier Sales vs Unmet Consumer Intent
              </div>
            </div>
            <span className="badge badge-primary">Hidden Demand Score: {selectedItem.hiddenDemandScore}/100</span>
          </div>

          {/* Metric Comparison Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#F1F5F9', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Recorded POS Sales</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {selectedItem.recordedSales} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>units</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Verified checkout tickets</span>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600 }}>Estimated Lost Demand</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626' }}>
                +{selectedItem.estimatedUnmetDemand} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>units</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#DC2626' }}>Unmet demand during stockout hours</span>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600 }}>True Model-Estimated Demand</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1D4ED8' }}>
                {selectedItem.estimatedTrueDemand} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>units</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#1E40AF' }}>Combined actual purchasing power</span>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>Stockout Duration</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706' }}>
                {selectedItem.stockoutDurationHours} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>hours</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#B45309' }}>Zero shelf availability window</span>
            </div>
          </div>

          {/* Chart: Recorded Sales vs Estimated True Demand */}
          <div style={{ width: '100%', height: 280, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectedItem.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '0.8rem' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '6px' }} />
                <Bar dataKey="recordedSales" name="Recorded POS Sales (Actual)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="estimatedDemand" name="Estimated True Demand (Model)" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Explanation Box & Customer Substitution Patterns */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-dark-navy)', marginBottom: '0.35rem' }}>
                Reconstructed Incident Explanation:
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                "{selectedItem.explanation}"
              </p>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-dark-navy)', marginBottom: '0.35rem' }}>
                Shopper Substitution Patterns:
              </h4>
              <ul style={{ paddingLeft: '1.15rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {selectedItem.substitutionPatterns.map((sub, idx) => (
                  <li key={idx}>
                    <strong>{sub.item}:</strong> {sub.rate}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Demand Data Table */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <div className="section-card-title">Network-Wide Hidden Demand Registry</div>
            <div className="section-card-subtitle">
              SKUs where recorded sales significantly deviate from unfulfilled customer demand
            </div>
          </div>
          <span className="badge badge-purple">
            <Sparkles size={12} /> AI Reconstructed
          </span>
        </div>

        <DataTable columns={columns} data={hiddenData} />
      </div>
    </div>
  );
};

export default HiddenDemandDetector;
