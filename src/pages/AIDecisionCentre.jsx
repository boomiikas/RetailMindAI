import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Percent,
  TrendingUp,
  Filter,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import RiskBadge from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/RiskBadge';
import Modal from '../components/common/Modal';

const AIDecisionCentre = () => {
  const {
    recommendations,
    approveRecommendation,
    rejectRecommendation,
    selectedStore,
    setSelectedStore,
    stores,
  } = useApp();

  const [activeTab, setActiveTab] = useState('All');
  const [expandedCards, setExpandedCards] = useState({});
  const [rejectingRec, setRejectingRec] = useState(null);
  const [rejectReason, setRejectReason] = useState('Supplier pricing discount negotiated directly');
  const [alternativesRec, setAlternativesRec] = useState(null);

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenReject = (rec) => {
    setRejectingRec(rec);
  };

  const handleConfirmReject = () => {
    if (rejectingRec) {
      rejectRecommendation(rejectingRec.id, rejectReason);
      setRejectingRec(null);
    }
  };

  // Filter recommendations
  let filtered = recommendations;
  if (selectedStore !== 'all') {
    filtered = filtered.filter(r => r.store.toLowerCase() === selectedStore.toLowerCase());
  }

  if (activeTab === 'Pending') {
    filtered = filtered.filter(r => r.status === 'Pending');
  } else if (activeTab === 'Approved') {
    filtered = filtered.filter(r => r.status === 'Approved');
  } else if (activeTab === 'Rejected') {
    filtered = filtered.filter(r => r.status === 'Rejected');
  } else if (activeTab === 'High Priority') {
    filtered = filtered.filter(r => r.priority === 'High' || r.priority === 'Critical');
  }

  return (
    <div className="ai-decision-centre-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">AI Decision Centre</h2>
          <p className="page-subtitle">
            Autonomous decision intelligence engine with full transparent reasoning and human-in-the-loop governance.
          </p>
        </div>

        {/* Global Store Filter */}
        <div className="filter-control">
          <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Store Scope:</span>
          <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="tabs-nav">
        {['All', 'Pending', 'Approved', 'Rejected', 'High Priority'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === 'Pending' && (
              <span
                style={{
                  marginLeft: '0.4rem',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFF',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                }}
              >
                {recommendations.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <CheckCircle2 size={36} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No recommendations matching this filter</h3>
          <p style={{ fontSize: '0.85rem' }}>All autonomous decisions in this category have been processed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.map((rec) => {
            const isExpanded = !!expandedCards[rec.id];

            return (
              <div key={rec.id} className="rec-card">
                {/* Header */}
                <div className="rec-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {rec.id}
                    </span>
                    <span className="badge badge-primary">{rec.store}</span>
                    <RiskBadge severity={rec.priority} />
                    <StatusBadge status={rec.status} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
                      <Sparkles size={14} /> {rec.confidence}% Confidence
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="rec-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        Target SKU
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-dark-navy)' }}>
                        {rec.sku}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          backgroundColor: '#EFF6FF',
                          padding: '0.4rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        <span style={{ fontSize: '0.7rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                          Recommended Action
                        </span>
                        <span style={{ fontWeight: 800, color: '#1D4ED8', fontSize: '0.95rem' }}>
                          {rec.action}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="rec-meta-grid">
                    <div className="rec-meta-item">
                      <span className="rec-meta-label">Allocation / Qty</span>
                      <span className="rec-meta-val">{rec.quantity}</span>
                    </div>
                    <div className="rec-meta-item">
                      <span className="rec-meta-label">Estimated Cost</span>
                      <span className="rec-meta-val" style={{ color: 'var(--color-text-primary)' }}>{rec.estimatedCost}</span>
                    </div>
                    <div className="rec-meta-item" style={{ gridColumn: 'span 2' }}>
                      <span className="rec-meta-label">Expected Business Impact</span>
                      <span className="rec-meta-val" style={{ color: 'var(--color-success-text)' }}>{rec.impact}</span>
                    </div>
                  </div>

                  {/* Expandable Explanation Section */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '1.25rem',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        animation: 'modal-appear 0.2s ease-out',
                      }}
                    >
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-dark-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Sparkles size={15} color="var(--color-primary)" /> WHY THIS ACTION? (AI Decision Reasoning)
                        </h4>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {rec.reasoning.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-dark-navy)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <TrendingUp size={15} color="var(--color-success)" /> EXPECTED OUTCOME:
                        </h4>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {rec.impactPoints.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason Display if Rejected */}
                  {rec.status === 'Rejected' && rec.rejectionReason && (
                    <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#B91C1C' }}>
                      <strong>Rejection Note:</strong> {rec.rejectionReason}
                    </div>
                  )}

                  {/* Functional Actions Row */}
                  <div className="rec-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleExpand(rec.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={14} /> Collapse Decision Explanation
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} /> View Decision Explanation
                        </>
                      )}
                    </button>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {rec.alternatives && rec.alternatives.length > 0 && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setAlternativesRec(rec)}
                        >
                          View Alternatives ({rec.alternatives.length})
                        </button>
                      )}

                      {rec.status === 'Pending' ? (
                        <>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleOpenReject(rec)}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => approveRecommendation(rec.id)}
                          >
                            <CheckCircle2 size={14} /> Approve Action
                          </button>
                        </>
                      ) : rec.status === 'Approved' ? (
                        <span className="badge badge-success" style={{ padding: '0.4rem 0.75rem' }}>
                          <CheckCircle2 size={14} /> Action Scheduled & Dispatched
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ padding: '0.4rem 0.75rem' }}>
                          <XCircle size={14} /> Action Overridden
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={!!rejectingRec}
        onClose={() => setRejectingRec(null)}
        title={`Reject AI Recommendation: ${rejectingRec?.id}`}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setRejectingRec(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmReject}>
              Confirm Rejection
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Please specify the operational or commercial rationale for overriding this AI recommendation. This feedback will be ingested into the reinforcement learning model.
          </p>

          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Override Category & Reason:
            </label>
            <select
              style={{ width: '100%', marginBottom: '0.75rem' }}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            >
              <option value="Supplier pricing discount negotiated directly">
                Supplier pricing discount negotiated directly
              </option>
              <option value="Local warehouse buffer already covers buffer">
                Local warehouse buffer already covers buffer
              </option>
              <option value="High localized holding cost at target store">
                High localized holding cost at target store
              </option>
              <option value="Packaging damage inspection pending">
                Packaging damage inspection pending
              </option>
              <option value="Scheduled promotion cancelled by regional director">
                Scheduled promotion cancelled by regional director
              </option>
            </select>

            <textarea
              rows={3}
              style={{ width: '100%' }}
              placeholder="Additional comments (optional)..."
            />
          </div>
        </div>
      </Modal>

      {/* Alternatives Comparison Modal */}
      <Modal
        isOpen={!!alternativesRec}
        onClose={() => setAlternativesRec(null)}
        title={`Decision Alternatives: ${alternativesRec?.sku}`}
        maxWidth="680px"
        footer={
          <button className="btn btn-secondary" onClick={() => setAlternativesRec(null)}>
            Close
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            The AI evaluated {alternativesRec?.alternatives?.length || 0} competing operational pathways before ranking the selected action:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alternativesRec?.alternatives?.map((alt, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  border: alt.score.includes('Selected') ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: alt.score.includes('Selected') ? '#EFF6FF' : 'var(--color-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {alt.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                    Cost: <strong>{alt.cost}</strong> • Lead Time: <strong>{alt.leadTime}</strong>
                  </div>
                </div>

                <div>
                  <span
                    className={`badge ${alt.score.includes('Selected') ? 'badge-primary' : 'badge-neutral'}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    AI Score: {alt.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIDecisionCentre;
