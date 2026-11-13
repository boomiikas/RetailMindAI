import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
  Layers,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/common/DataTable';
import { StatusBadge } from '../components/common/RiskBadge';
import Modal from '../components/common/Modal';

const DecisionHistory = () => {
  const { decisionHistory, selectedStore, setSelectedStore, stores } = useApp();
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDecision, setSelectedDecision] = useState(null);

  // Filter history by store and local search term
  let filtered = decisionHistory;
  if (selectedStore !== 'all') {
    filtered = filtered.filter(d => d.store.toLowerCase() === selectedStore.toLowerCase());
  }
  if (searchFilter.trim()) {
    const q = searchFilter.toLowerCase();
    filtered = filtered.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.product.toLowerCase().includes(q) ||
      d.store.toLowerCase().includes(q) ||
      d.recommendedAction.toLowerCase().includes(q)
    );
  }

  const columns = [
    {
      header: 'Decision ID',
      key: 'id',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>
          {row.id}
        </span>
      ),
    },
    {
      header: 'Date',
      key: 'date',
      render: (row) => <span style={{ color: 'var(--color-text-secondary)' }}>{row.date}</span>,
    },
    {
      header: 'Store',
      key: 'store',
      render: (row) => <strong>{row.store}</strong>,
    },
    {
      header: 'Product / SKU',
      key: 'product',
      render: (row) => <span>{row.product}</span>,
    },
    {
      header: 'Recommended Action',
      key: 'recommendedAction',
      render: (row) => (
        <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
          {row.recommendedAction}
        </span>
      ),
    },
    {
      header: 'Approved Action',
      key: 'approvedAction',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {row.approvedAction}
        </span>
      ),
    },
    {
      header: 'Actual Outcome / Result',
      key: 'actualResult',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          {row.actualResult}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Audit Audit',
      key: 'inspect',
      render: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedDecision(row)}
        >
          Drill Down
        </button>
      ),
    },
  ];

  return (
    <div className="decision-history-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Decision History & Audit Trail</h2>
          <p className="page-subtitle">
            Immutable log of all AI autonomous and manager-approved decisions, tracking real-world results and accountability.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="global-search-wrapper" style={{ width: 240 }}>
            <Search className="search-icon" />
            <input
              type="text"
              className="global-search-input"
              placeholder="Filter decisions..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
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
      </div>

      {/* Decision Audit Log Table */}
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <History size={18} color="var(--color-primary)" />
            Searchable Decision Log ({filtered.length} entries)
          </div>
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> Real-Time Telemetry Verified
          </span>
        </div>

        <DataTable columns={columns} data={filtered} />
      </div>

      {/* Decision Deep-Dive Audit Modal */}
      <Modal
        isOpen={!!selectedDecision}
        onClose={() => setSelectedDecision(null)}
        title={`Decision Audit Record: ${selectedDecision?.id}`}
        maxWidth="720px"
        footer={
          <button className="btn btn-secondary" onClick={() => setSelectedDecision(null)}>
            Close Audit File
          </button>
        }
      >
        {selectedDecision && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Summary */}
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Target Product & Store
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-dark-navy)' }}>
                  {selectedDecision.product}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {selectedDecision.store} Supermarket • Executed on {selectedDecision.date}
                </span>
              </div>
              <div>
                <StatusBadge status={selectedDecision.status} />
              </div>
            </div>

            {/* Drilldown Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  1. Original Problem Detected
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  {selectedDecision.details.problem}
                </p>
              </div>

              <div style={{ padding: '0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  2. Forward Forecast
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                  {selectedDecision.details.forecast}
                </p>
              </div>
            </div>

            {/* Signals Considered */}
            <div style={{ padding: '0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                3. Input Signals Evaluated by AI
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedDecision.details.signalsConsidered.map((sig, i) => (
                  <span key={i} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                    • {sig}
                  </span>
                ))}
              </div>
            </div>

            {/* Chosen Action & Decision Rationale */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary-active)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <Sparkles size={16} /> 4. Chosen Action & Decision Rationale
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {selectedDecision.details.rationale}
              </p>
            </div>

            {/* Actual Business Outcome */}
            <div style={{ padding: '1rem', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803D', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <CheckCircle2 size={16} /> 5. Actual Measured Outcome & Impact
              </div>
              <p style={{ fontSize: '0.8rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                {selectedDecision.details.outcomeMetrics}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DecisionHistory;
