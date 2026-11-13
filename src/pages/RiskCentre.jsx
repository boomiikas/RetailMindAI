import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  LineChart,
  Line
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
  Package,
  ShieldCheck,
  Sliders,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Boxes,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';
import Modal from '../components/common/Modal';

const RiskCentre = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'all';
    setActiveTab(['stockout', 'overstock', 'supplier', 'promotions', 'critical'].includes(tab) ? tab : 'all');
  }, [searchParams]);

  const { selectedStore, setSelectedStore, stores } = useApp();
  const [risks, setRisks] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Promotion Guardian Modals State
  const [adjustDiscountModal, setAdjustDiscountModal] = useState(null);
  const [newDiscountVal, setNewDiscountVal] = useState(10);
  const [increaseStockModal, setIncreaseStockModal] = useState(null);
  const [extraStockQty, setExtraStockQty] = useState(150);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

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

    Promise.all([
      RetailPulseApi.getRisks({ store: selectedStore, category: categoryParam }),
      RetailPulseApi.getPromotions(selectedStore)
    ]).then(([riskData, promoData]) => {
      if (isMounted) {
        setRisks(riskData || []);
        if (promoData && promoData.length > 0) {
          setPromotions(promoData);
          setSelectedPromo(promoData[0]);
        }
        setLoading(false);
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
    { name: 'Promotion Risk', count: promotions.filter(p => p.safetyStatus !== 'Safe').length },
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

  // Promotion Guardian Handlers
  const handleAdjustDiscount = () => {
    if (adjustDiscountModal) {
      setPromotions(prev =>
        prev.map(p =>
          p.id === adjustDiscountModal.id
            ? {
                ...p,
                currentDiscount: newDiscountVal,
                expectedDemand: Math.round(p.currentStock * 0.9),
                safetyStatus: newDiscountVal <= 12 ? 'Safe' : 'Moderate Risk',
                safetyScore: newDiscountVal <= 12 ? 94 : 70,
                recommendation: `Discount calibrated to ${newDiscountVal}%. Demand is synchronized with store stock.`
              }
            : p
        )
      );
      if (selectedPromo?.id === adjustDiscountModal.id) {
        setSelectedPromo(prev => ({
          ...prev,
          currentDiscount: newDiscountVal,
          safetyStatus: newDiscountVal <= 12 ? 'Safe' : 'Moderate Risk'
        }));
      }
      setAdjustDiscountModal(null);
    }
  };

  const handleIncreaseStock = () => {
    if (increaseStockModal) {
      setPromotions(prev =>
        prev.map(p =>
          p.id === increaseStockModal.id
            ? {
                ...p,
                currentStock: p.currentStock + Number(extraStockQty),
                safetyStatus: 'Safe',
                safetyScore: 96,
                recommendation: `Allocated +${extraStockQty} units from central DC. Operational stockout risk eliminated.`
              }
            : p
        )
      );
      if (selectedPromo?.id === increaseStockModal.id) {
        setSelectedPromo(prev => ({
          ...prev,
          currentStock: prev.currentStock + Number(extraStockQty),
          safetyStatus: 'Safe'
        }));
      }
      setIncreaseStockModal(null);
    }
  };

  const togglePromotionPause = (id) => {
    setPromotions(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              safetyStatus: p.safetyStatus === 'Paused' ? 'Safe' : 'Paused',
              recommendation: p.safetyStatus === 'Paused' ? 'Promotion resumed.' : 'Campaign paused to safeguard shelf stock.'
            }
          : p
      )
    );
  };

  // Table Columns for Risks
  const riskColumns = [
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
      header: 'Financial Loss Exposure',
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
      header: 'Prescribed Action',
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
            title="Open Decision Centre"
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
          <h2 className="page-title">Risk & Alerts</h2>
          <p className="page-subtitle">
            Autonomous multi-category vulnerability radar, financial loss scoring & Promotion Guardian protection.
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
          className={`tab-btn ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => handleTabChange('promotions')}
        >
          <Tag size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Promotion Guardian
          <span className="badge badge-warning" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
            {promotions.filter(p => p.safetyStatus !== 'Safe').length} Guarded
          </span>
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
            <ShieldCheck size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16A34A' }}>{lowCount}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Controlled risk under automated routing
          </span>
        </div>
      </div>

      {/* TAB 5: PROMOTION GUARDIAN VIEW (Consolidated from PromotionGuardian.jsx) */}
      {activeTab === 'promotions' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Banner */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <ShieldAlert size={26} color="#B45309" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Promotion Guardian Safety Controller
                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>BACKROOM INVENTORY GUARD</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#78350F', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                Marketing promotions that are disconnected from backroom inventory lead to shelf stockouts, wasted marketing spend, and dissatisfied shoppers. Promotion Guardian analyzes price elasticity and safeguards minimum stock buffers before promotions go live.
              </p>
            </div>
          </div>

          {/* Deep-Dive on Selected Promotion */}
          {selectedPromo && (
            <div className="section-card">
              <div className="section-card-header">
                <div>
                  <div className="section-card-title">
                    <Tag size={18} color="var(--color-primary)" />
                    Guarded Campaign: {selectedPromo.name} ({selectedPromo.store})
                  </div>
                  <div className="section-card-subtitle">
                    SKU: {selectedPromo.product} • Active Discount: {selectedPromo.currentDiscount}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span
                    className={`badge ${
                      selectedPromo.safetyStatus === 'Safe'
                        ? 'badge-success'
                        : selectedPromo.safetyStatus === 'Paused'
                        ? 'badge-neutral'
                        : 'badge-danger'
                    }`}
                  >
                    {selectedPromo.safetyStatus} (Score: {selectedPromo.safetyScore}/100)
                  </span>
                </div>
              </div>

              {/* Action Modals Triggers */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setAdjustDiscountModal(selectedPromo);
                    setNewDiscountVal(selectedPromo.currentDiscount);
                  }}
                >
                  <Sliders size={14} /> Calibrate Discount Rate
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIncreaseStockModal(selectedPromo);
                    setExtraStockQty(150);
                  }}
                >
                  <Boxes size={14} /> Allocate DC Buffer Stock
                </button>

                <button
                  className={`btn btn-sm ${selectedPromo.safetyStatus === 'Paused' ? 'btn-success' : 'btn-outline-danger'}`}
                  onClick={() => togglePromotionPause(selectedPromo.id)}
                >
                  {selectedPromo.safetyStatus === 'Paused' ? (
                    <>
                      <PlayCircle size={14} /> Resume Promotion
                    </>
                  ) : (
                    <>
                      <PauseCircle size={14} /> Pause Campaign
                    </>
                  )}
                </button>
              </div>

              {/* Recommendation Note */}
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem', fontSize: '0.8rem', color: '#334155' }}>
                <strong>Guardian Recommendation:</strong> {selectedPromo.recommendation}
              </div>

              {/* Timeline Chart */}
              {selectedPromo.chartData && (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedPromo.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', fontSize: '0.8rem' }} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '6px' }} />
                      <Line type="monotone" dataKey="expectedDemand" name="Expected Promotional Demand" stroke="#DC2626" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="currentStock" name="Available Store Stock" stroke="#16A34A" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Promotions Registry Table */}
          <div className="section-card">
            <div className="section-card-header">
              <div>
                <div className="section-card-title">Network Promotion Inventory Safety Registry</div>
                <div className="section-card-subtitle">
                  Evaluated discount campaigns and real-time backroom buffer validation
                </div>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign & Store</th>
                    <th>Product / SKU</th>
                    <th>Discount</th>
                    <th>Stock vs Demand</th>
                    <th>Safety Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>{p.store}</div>
                      </td>
                      <td>{p.product}</td>
                      <td>
                        <span className="badge badge-primary">{p.currentDiscount}% OFF</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{p.currentStock}</span> available /{' '}
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>{p.expectedDemand}</span> demand
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.safetyStatus === 'Safe'
                              ? 'badge-success'
                              : p.safetyStatus === 'Paused'
                              ? 'badge-neutral'
                              : 'badge-danger'
                          }`}
                        >
                          {p.safetyStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedPromo(p)}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD RISK RADAR VIEW (All, Stockout, Overstock, Supplier, Critical) */
        <>
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
                  Calculated composite risk score (0–100) and expected financial loss exposure
                </div>
              </div>
              <span className="badge badge-primary">
                <Sparkles size={12} /> Deterministic Radar Service
              </span>
            </div>

            <DataTable columns={riskColumns} data={displayRisks} />
          </div>
        </>
      )}

      {/* Adjust Discount Modal */}
      <Modal
        isOpen={!!adjustDiscountModal}
        onClose={() => setAdjustDiscountModal(null)}
        title={`Calibrate Discount: ${adjustDiscountModal?.name}`}
        footer={
          <button className="btn btn-primary" onClick={handleAdjustDiscount}>
            Apply Calibrated Discount
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Reducing discount softens demand velocity to ensure store backroom stock remains above safety threshold until next scheduled DC replenishment.
          </p>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600 }}>Discount Percentage:</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{newDiscountVal}% OFF</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={newDiscountVal}
              onChange={(e) => setNewDiscountVal(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>

      {/* Increase Stock Modal */}
      <Modal
        isOpen={!!increaseStockModal}
        onClose={() => setIncreaseStockModal(null)}
        title={`Allocate DC Stock: ${increaseStockModal?.name}`}
        footer={
          <button className="btn btn-primary" onClick={handleIncreaseStock}>
            Confirm Allocation (+{extraStockQty} units)
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Dispatch additional safety units from Erode Central DC to support campaign velocity.
          </p>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Dispatch Quantity (Units):
            </label>
            <input
              type="number"
              value={extraStockQty}
              onChange={(e) => setExtraStockQty(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RiskCentre;
