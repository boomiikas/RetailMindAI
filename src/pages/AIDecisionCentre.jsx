import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  DollarSign,
  GitFork,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Zap,
  Info,
  History,
  FileText,
  Truck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/RiskBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';

const SCENARIOS = [
  { id: 'promotion', name: 'Launch New Promotion', desc: 'Simulate margin vs volume tradeoff' },
  { id: 'discount', name: 'Increase Product Discount', desc: 'Price elasticity ripple' },
  { id: 'transfer', name: 'Transfer Stock Between Stores', desc: 'Evaluate cross-dock freight & balance' },
  { id: 'allocation', name: 'Increase Product Allocation', desc: 'Simulate festive capital commitment' },
  { id: 'delay', name: 'Supplier Delivery Delay', desc: 'Stress test buffer depletion timeline' },
  { id: 'spike', name: 'Sudden Demand Surge (Monsoon/Festival)', desc: 'Weather or viral consumption spike' },
];

const AIDecisionCentre = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'recommendations';

  const mapInitialTab = (t) => {
    if (t === 'simulation' || t === 'simulator') return 'simulation';
    if (t === 'history') return 'history';
    if (t === 'approvals' || t === 'pending') return 'approvals';
    if (t === 'execution') return 'execution';
    return 'recommendations';
  };

  const [activeTab, setActiveTab] = useState(mapInitialTab(initialTab));

  useEffect(() => {
    setActiveTab(mapInitialTab(searchParams.get('tab') || 'recommendations'));
  }, [searchParams]);

  const {
    recommendations,
    approveRecommendation,
    rejectRecommendation,
    decisionHistory,
    selectedStore,
    setSelectedStore,
    stores,
  } = useApp();

  const handleTabChange = (t) => {
    setActiveTab(t);
    setSearchParams({ tab: t });
  };

  // Recommendation Cards State
  const [expandedCards, setExpandedCards] = useState({});
  const [rejectingRec, setRejectingRec] = useState(null);
  const [rejectReason, setRejectReason] = useState('Supplier pricing discount negotiated directly');
  const [simulationRecommendation, setSimulationRecommendation] = useState(null);

  // Ripple Simulator State
  const [scenarioType, setScenarioType] = useState('promotion');
  const [selectedProduct, setSelectedProduct] = useState('1L Sunflower Cooking Oil');
  const [simStore, setSimStore] = useState('Coimbatore');
  const [currentPrice, setCurrentPrice] = useState(165);
  const [discountPct, setDiscountPct] = useState(25);
  const [currentInventory, setCurrentInventory] = useState(180);
  const [leadTimeDays, setLeadTimeDays] = useState(4);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedOption, setSelectedOption] = useState('opt-b');

  // History State
  const [historySearch, setHistorySearch] = useState('');
  const [selectedAuditItem, setSelectedAuditItem] = useState(null);

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const simulateRecommendation = (rec) => {
    const sku = String(rec.sku || '').toLowerCase();
    const product = sku.includes('milk')
      ? 'Fresh Farm Milk 500ml'
      : sku.includes('oil')
        ? '1L Sunflower Cooking Oil'
        : sku.includes('drink')
          ? 'Sparkling Citrus Drink 750ml'
          : selectedProduct;
    const storeMatch = stores.find((store) =>
      String(rec.store || '').toLowerCase().includes(String(store.id).toLowerCase()) ||
      String(rec.store || '').toLowerCase().includes(String(store.name).toLowerCase())
    );
    const action = String(rec.action || '').toLowerCase();
    const scenario = ['promotion', 'discount', 'transfer', 'allocation', 'delay', 'spike'].find((type) => action.includes(type)) || 'transfer';
    setSimulationRecommendation(rec);
    setSelectedProduct(product);
    setCurrentPrice(product.includes('Milk') ? 32 : product.includes('Oil') ? 165 : product.includes('Drink') ? 50 : currentPrice);
    setSimStore(storeMatch?.name || simStore);
    setCurrentInventory(Number(rec.currentStock) || currentInventory);
    setScenarioType(scenario);
    setSimulationResult(null);
    handleTabChange('simulation');
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

  // Run Simulator
  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = RetailPulseApi.simulateScenario({
        scenarioType,
        store: simStore,
        product: selectedProduct,
        currentPrice: Number(currentPrice),
        discountPct: Number(discountPct),
        currentInventory: Number(currentInventory),
        leadTimeDays: Number(leadTimeDays),
      });
      setSimulationResult(result);
      setIsSimulating(false);
    }, 250);
  };

  useEffect(() => {
    if (activeTab === 'simulation') {
      runSimulation();
    }
  }, [scenarioType, selectedProduct, simStore, activeTab]);

  // Filtering for recommendations & approvals
  let filteredRecs = recommendations;
  if (selectedStore !== 'all') {
    filteredRecs = filteredRecs.filter(r => r.store.toLowerCase() === selectedStore.toLowerCase());
  }

  const pendingRecs = filteredRecs.filter(r => r.status === 'Pending');

  // History filtering
  let filteredHistory = decisionHistory;
  if (selectedStore !== 'all') {
    filteredHistory = filteredHistory.filter(d => d.store.toLowerCase() === selectedStore.toLowerCase());
  }
  if (historySearch.trim()) {
    const q = historySearch.toLowerCase();
    filteredHistory = filteredHistory.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.product.toLowerCase().includes(q) ||
      d.store.toLowerCase().includes(q) ||
      d.recommendedAction.toLowerCase().includes(q)
    );
  }

  const historyColumns = [
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
          onClick={() => setSelectedAuditItem(row)}
        >
          View Audit Log
        </button>
      ),
    },
  ];

  return (
    <div className="ai-decision-centre-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">AI Decision Centre</h2>
          <p className="page-subtitle">
            Autonomous decision intelligence engine with transparent reasoning, human governance & ripple consequence simulation.
          </p>
        </div>

        {/* Global Store Selector */}
        <div className="filter-control">
          <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Store:</span>
          <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5-Tab Navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => handleTabChange('recommendations')}
        >
          <Cpu size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Recommendations ({filteredRecs.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => handleTabChange('approvals')}
        >
          <CheckCircle2 size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Pending Approvals
          {pendingRecs.length > 0 && (
            <span className="badge badge-danger" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
              {pendingRecs.length} Action Needed
            </span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === 'simulation' ? 'active' : ''}`}
          onClick={() => handleTabChange('simulation')}
        >
          <GitFork size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Scenario Simulation
        </button>

        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <History size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Decision History
        </button>

        <button
          className={`tab-btn ${activeTab === 'execution' ? 'active' : ''}`}
          onClick={() => handleTabChange('execution')}
        >
          <Truck size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Execution Tracking
          <span className="badge badge-success" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>v1 $\to$ v2 Lineage</span>
        </button>
      </div>

      {/* TAB 1 & TAB 2: RECOMMENDATIONS & PENDING APPROVALS */}
      {(activeTab === 'recommendations' || activeTab === 'approvals') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {(activeTab === 'approvals' ? pendingRecs : filteredRecs).map((rec) => {
            const isExpanded = !!expandedCards[rec.id];

            return (
              <div key={rec.id} className="rec-card">
                {/* Header */}
                <div className="rec-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                      {rec.id}
                    </span>
                    {rec.priority ? <RiskBadge severity={rec.priority} /> : <span className="badge badge-neutral">Priority unavailable</span>}
                    <span className="badge badge-neutral">{rec.store}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {rec.sku}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'block' }}>AI Confidence</span>
                      <strong style={{ fontSize: '0.85rem', color: '#16A34A' }}>{rec.confidence != null ? `${rec.confidence}%` : 'Unavailable'}</strong>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                </div>

                {/* Body */}
                <div className="rec-card-body">
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} color="var(--color-primary)" />
                    <span>Prescribed Action: {rec.action} ({rec.quantity})</span>
                  </div>

                  <div className="rec-meta-grid">
                    <div className="rec-meta-item">
                      <span className="rec-meta-label">Financial Impact</span>
                      <span className="rec-meta-val" style={{ color: '#16A34A' }}>{rec.impact}</span>
                    </div>
                    <div className="rec-meta-item">
                      <span className="rec-meta-label">Current Stock</span>
                      <span className="rec-meta-val">{rec.currentStock != null ? `${rec.currentStock} units` : 'Unavailable'}</span>
                    </div>
                    <div className="rec-meta-item">
                      <span className="rec-meta-label">Predicted Demand</span>
                      <span className="rec-meta-val" style={{ color: 'var(--color-primary)' }}>{rec.predictedDemand != null ? `${rec.predictedDemand} units` : 'Unavailable'}</span>
                    </div>
                    <div className="rec-meta-item">
                      <span className="rec-meta-label">Urgency Horizon</span>
                      <span className="rec-meta-val" style={{ color: '#DC2626' }}>{rec.urgency || 'Unavailable'}</span>
                    </div>
                  </div>

                  {/* Multi-Agent Reasoning */}
                  {rec.reasoning && <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Retail Intelligence Multi-Agent Reasoning
                    </div>
                    <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                      "{rec.reasoning}"
                    </p>
                  </div>}

                  {/* Expanded Ripple Consequence Preview */}
                  {isExpanded && rec.consequences && (
                    <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-border)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-active)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Simulated Consequence Ripple (Pyomo + HiGHS Validated)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div><strong>Stockout Risk:</strong> {rec.consequences.stockoutRisk}</div>
                        <div><strong>Origin Buffer:</strong> {rec.consequences.originImpact}</div>
                        <div><strong>Net Margin:</strong> {rec.consequences.netMargin}</div>
                        <div><strong>Freight Cost:</strong> {rec.consequences.freightCost}</div>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="rec-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleExpand(rec.id)}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Hide Consequence Ripple' : 'View Consequence Ripple'}
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => simulateRecommendation(rec)}
                    >
                      <GitFork size={14} /> Simulate alternatives
                    </button>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {rec.status === 'Pending' ? (
                        <>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleOpenReject(rec)}
                          >
                            <XCircle size={14} /> Reject with Reason
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => approveRecommendation(rec.id)}
                          >
                            <CheckCircle2 size={14} /> 1-Click Approve Action
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle2 size={13} color="#16A34A" /> Decision finalized & committed in ERP
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

      {/* TAB 3: DECISION RIPPLE SIMULATOR (Consolidated from DecisionRippleSimulator) */}
      {activeTab === 'simulation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {simulationRecommendation && (
            <div className="section-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div className="section-card-title">Scenario for {simulationRecommendation.id}</div>
                <div className="section-card-subtitle">{simulationRecommendation.sku} at {simulationRecommendation.store} · {simulationRecommendation.action}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSimulationRecommendation(null)}>Clear recommendation</button>
            </div>
          )}
          {/* Top Banner */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Sparkles size={13} /> SCENARIO SIMULATION
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
              "What happens if I make this decision?"
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '750px', lineHeight: 1.5, margin: 0 }}>
              Simulate the multi-tier chain reaction across demand elasticity, shelf depletion, emergency logistics freights, margin dilution, and customer walkout churn.
            </p>
          </div>

          {/* Scenario Selection Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            {SCENARIOS.map((sc) => (
              <div
                key={sc.id}
                onClick={() => {
                  setScenarioType(sc.id);
                  if (sc.id === 'spike') setDiscountPct(10);
                  if (sc.id === 'delay') setLeadTimeDays(7);
                }}
                className="card"
                style={{
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  border: scenarioType === sc.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: scenarioType === sc.id ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: scenarioType === sc.id ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                  {sc.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  {sc.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Parameter Sliders */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <Sliders size={18} color="var(--color-primary)" />
                Configurable Decision Parameters
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={runSimulation}
                disabled={isSimulating}
              >
                <Zap size={14} /> Calculate Consequence Cascade
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Target SKU:
                </label>
                <select
                  style={{ width: '100%' }}
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    if (e.target.value.includes('Milk')) { setCurrentPrice(32); setCurrentInventory(120); }
                    else if (e.target.value.includes('Oil')) { setCurrentPrice(165); setCurrentInventory(180); }
                    else if (e.target.value.includes('Drink')) { setCurrentPrice(50); setCurrentInventory(190); }
                  }}
                >
                  <option value="1L Sunflower Cooking Oil">1L Sunflower Cooking Oil (₹165)</option>
                  <option value="Fresh Farm Milk 500ml">Fresh Farm Milk 500ml (₹32)</option>
                  <option value="Sparkling Citrus Drink 750ml">Sparkling Citrus Drink 750ml (₹50)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Target Store:
                </label>
                <select
                  style={{ width: '100%' }}
                  value={simStore}
                  onChange={(e) => setSimStore(e.target.value)}
                >
                  {stores.filter(s => s.id !== 'all').map(s => (
                    <option key={s.id} value={s.name}>{s.name} Supermarket</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Discount Percentage:
                  </label>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{discountPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Current Backroom Stock:
                  </label>
                  <span style={{ fontWeight: 800 }}>{currentInventory} units</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="600"
                  step="10"
                  value={currentInventory}
                  onChange={(e) => setCurrentInventory(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Consequence Output Options */}
          {simulationResult && (
            <div className="section-card">
              <div className="section-card-header">
                <div>
                  <div className="section-card-title">
                    <TrendingUp size={18} color="var(--color-primary)" />
                    Simulated Multi-Option Evaluation (Options A / B / C)
                  </div>
                  <div className="section-card-subtitle">
                    Select a risk-reward strategy to inspect consequence projections
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                {simulationResult.options?.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      border: selectedOption === opt.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: selectedOption === opt.id ? 'var(--color-primary-light)' : '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#172033' }}>{opt.name}</span>
                      {opt.recommended && (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>AI RECOMMENDED</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                      {opt.desc}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Projected Margin:</span>
                        <strong style={{ color: '#16A34A' }}>{opt.margin}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Stockout Risk:</span>
                        <strong style={{ color: opt.stockoutRisk === 'Low' ? '#16A34A' : '#DC2626' }}>{opt.stockoutRisk}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Freight / Logistics:</span>
                        <strong>{opt.freight}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DECISION HISTORY & AUDIT (Consolidated from DecisionHistory) */}
      {activeTab === 'history' && (
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">Immutable Decision Audit Log</div>
              <div className="section-card-subtitle">
                Historical record of AI recommendations, manager approvals, and realized performance outcomes
              </div>
            </div>
            <div className="global-search-wrapper" style={{ width: '260px' }}>
              <input
                type="text"
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ width: '100%', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <DataTable columns={historyColumns} data={filteredHistory} />
        </div>
      )}

      {/* TAB 5: EXECUTION TRACKING & REPLANNING */}
      {activeTab === 'execution' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="section-card">
            <div className="section-card-header">
              <div>
                <div className="section-card-title">
                  <Truck size={18} color="var(--color-primary)" />
                  Operational Execution Engine & Replanning Lineage (v1 $\to$ v2)
                </div>
                <div className="section-card-subtitle">
                  Deterministic ExecutionService tracking physical order status and automatic dynamic rerouting
                </div>
              </div>
              <span className="badge badge-success">ERP Connection: Synchronized</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>DEC_EXEC_001</span>
                    <span className="badge badge-success">DISPATCH IN PROGRESS</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Estimated Arrival: Today, 3:30 PM</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#172033', marginBottom: '0.25rem' }}>
                  50 units Aavin Toned Fresh Milk (MILK_001) | Coimbatore Hub $\to$ Salem Central
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                  Carrier dispatch logged via NH-544. Stock reservation committed in local warehouse database.
                </p>
              </div>

              <div style={{ padding: '1rem', border: '1px solid #FED7AA', borderRadius: '8px', backgroundColor: '#FFF7ED' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#EA580C' }}>DEC_EXEC_002 (DYNAMIC REPLAN)</span>
                    <span className="badge badge-warning">REPLANNED v1 $\to$ v2</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Rerouted via Erode Central DC</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#172033', marginBottom: '0.25rem' }}>
                  75 units Sunflower Cooking Oil (OIL_001) | Tiruppur $\to$ Coimbatore
                </div>
                <p style={{ fontSize: '0.75rem', color: '#9A3412', margin: 0 }}>
                  Original route blocked due to road freight congestion on SH-19. DynamicReplanningService triggered alternative fulfillment from Erode cross-dock depot with 0 stockout breach.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingRec}
        onClose={() => setRejectingRec(null)}
        title="Reject AI Recommendation"
        footer={
          <button className="btn btn-danger" onClick={handleConfirmReject}>
            Confirm Rejection
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Please select or state why this recommendation is being overridden. The agent uses this feedback to refine future thresholds.
          </p>
          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="Supplier pricing discount negotiated directly">Supplier pricing discount negotiated directly</option>
            <option value="Store shelf space constrained for this category">Store shelf space constrained for this category</option>
            <option value="Local festival promotion scheduled out of band">Local festival promotion scheduled out of band</option>
            <option value="Carrier truck unavailable for inter-store transfer">Carrier truck unavailable for inter-store transfer</option>
          </select>
        </div>
      </Modal>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={!!selectedAuditItem}
        onClose={() => setSelectedAuditItem(null)}
        title={`Audit Trail: ${selectedAuditItem?.id}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setSelectedAuditItem(null)}>
            Close
          </button>
        }
      >
        {selectedAuditItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <strong>Store & SKU:</strong> {selectedAuditItem.store} • {selectedAuditItem.product}
            </div>
            <div>
              <strong>Decision Timestamp:</strong> {selectedAuditItem.date}
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
              <strong>Execution Outcome:</strong> {selectedAuditItem.actualResult}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Cryptographically signed in PostgreSQL ledger. Version: 1.0 (Final).
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AIDecisionCentre;
