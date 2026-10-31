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
  LineChart,
  Line
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  Tag,
  ArrowRight,
  Sparkles,
  Boxes
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import Modal from '../components/common/Modal';

const PromotionGuardian = () => {
  const { selectedStore, setSelectedStore, stores } = useApp();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [adjustDiscountModal, setAdjustDiscountModal] = useState(null);
  const [newDiscountVal, setNewDiscountVal] = useState(10);
  const [increaseStockModal, setIncreaseStockModal] = useState(null);
  const [extraStockQty, setExtraStockQty] = useState(150);

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getPromotions(selectedStore).then((data) => {
      if (isMounted) {
        setPromotions(data);
        setSelectedPromo(data[0]);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [selectedStore]);

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
                recommendation: `Discount calibrated to ${newDiscountVal}%. Demand is now synchronized with backroom stock.`,
              }
            : p
        )
      );
      if (selectedPromo?.id === adjustDiscountModal.id) {
        setSelectedPromo(prev => ({
          ...prev,
          currentDiscount: newDiscountVal,
          safetyStatus: newDiscountVal <= 12 ? 'Safe' : 'Moderate Risk',
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
                recommendation: `Allocated +${extraStockQty} units from central DC. Operational stockout risk eliminated.`,
              }
            : p
        )
      );
      if (selectedPromo?.id === increaseStockModal.id) {
        setSelectedPromo(prev => ({
          ...prev,
          currentStock: prev.currentStock + Number(extraStockQty),
          safetyStatus: 'Safe',
        }));
      }
      setIncreaseStockModal(null);
    }
  };

  const togglePausePromotion = (promoId) => {
    setPromotions(prev =>
      prev.map(p =>
        p.id === promoId
          ? {
              ...p,
              safetyStatus: p.safetyStatus === 'Paused' ? 'Under Review' : 'Paused',
              recommendation: p.safetyStatus === 'Paused' ? 'Resumed promotion.' : 'Promotion temporarily paused by manager.',
            }
          : p
      )
    );
  };

  return (
    <div className="promotion-guardian-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Promotion Intelligence Guardian</h2>
          <p className="page-subtitle">
            Autonomous guardrails preventing margin erosion and promotion-induced stockouts before marketing campaigns go live.
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

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Campaigns Audited</span>
            <Tag size={16} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{promotions.length} Active / Upcoming</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>100% Pre-launch inventory verified</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #DC2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>High Risk Flags</span>
            <ShieldAlert size={16} color="#DC2626" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#DC2626' }}>
            {promotions.filter(p => p.safetyStatus.includes('Risk')).length} Campaigns
          </div>
          <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>Would cause zero-stockout in &lt; 24h</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16A34A' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Guarded Revenue</span>
            <TrendingUp size={16} color="#16A34A" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16A34A' }}>₹3.8 Lakhs</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Protected from discount dilution</span>
        </div>
      </div>

      {/* Two Column Layout: Promotion Cards List on Left, Active Promotion Inspector on Right */}
      <div className="grid-2">
        {/* Left Column: Promotions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-dark-navy)' }}>
            Campaign Risk Evaluation List:
          </div>

          {promotions.map((promo) => {
            const isCritical = promo.safetyStatus.includes('Critical');
            const isSelected = selectedPromo?.id === promo.id;

            return (
              <div
                key={promo.id}
                onClick={() => setSelectedPromo(promo)}
                className="card"
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? '#F8FAFC' : 'var(--color-surface)',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {promo.id} • {promo.store}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {promo.name}
                    </h3>
                  </div>
                  <RiskBadge severity={isCritical ? 'critical' : promo.safetyStatus.includes('Safe') ? 'safe' : 'medium'} label={promo.safetyStatus} />
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  Target: <strong>{promo.product}</strong> ({promo.currentDiscount}% Off)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', backgroundColor: 'var(--color-surface-subtle)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Current Stock:</span>
                    <strong>{promo.currentStock} units</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Forecast Demand:</span>
                    <strong style={{ color: promo.expectedDemand > promo.currentStock ? '#DC2626' : 'var(--color-text-primary)' }}>
                      {promo.expectedDemand} units
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Net Margin:</span>
                    <strong>{promo.expectedMargin}</strong>
                  </div>
                </div>

                {/* AI Recommendation Box */}
                <div style={{ fontSize: '0.75rem', color: isCritical ? '#B91C1C' : '#15803D', backgroundColor: isCritical ? '#FEF2F2' : '#DCFCE7', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
                  <strong>AI Guardian Verdict:</strong> {promo.recommendation}
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdjustDiscountModal(promo);
                      setNewDiscountVal(promo.currentDiscount);
                    }}
                  >
                    <Sliders size={13} /> Adjust Discount
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIncreaseStockModal(promo);
                    }}
                  >
                    <Boxes size={13} /> Increase Allocation
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: promo.safetyStatus === 'Paused' ? 'var(--color-success)' : 'var(--color-danger)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePausePromotion(promo.id);
                    }}
                  >
                    {promo.safetyStatus === 'Paused' ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                    {promo.safetyStatus === 'Paused' ? 'Resume' : 'Pause Promo'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Campaign Deep Dive & Projection Chart */}
        {selectedPromo && (
          <div className="section-card">
            <div className="section-card-header">
              <div>
                <div className="section-card-title">
                  <ShieldCheck size={18} color="var(--color-primary)" />
                  Operational Safety Impact Chart
                </div>
                <div className="section-card-subtitle">
                  {selectedPromo.name} ({selectedPromo.store}) - Daily stock exhaustion trajectory
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedPromo.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '0.8rem' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '6px' }} />
                  <Bar dataKey="projectedSales" name="Projected Daily Sales (Units)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stockRemaining" name="Stock Remaining (End of Day)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Operational Deep Dive Analysis */}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-dark-navy)' }}>
                Guardian Risk Audit Breakdown:
              </h4>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div><strong>Supplier Re-Order Buffer:</strong> {selectedPromo.supplierCapacity}</div>
                <div><strong>Margin Sensitivity:</strong> At {selectedPromo.currentDiscount}% discount, net gross margin compresses to {selectedPromo.expectedMargin}.</div>
                <div><strong>Deficit Imbalance:</strong> Projected demand exceeds shelf inventory by {Math.max(0, selectedPromo.expectedDemand - selectedPromo.currentStock)} units.</div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    alert(`Promotion "${selectedPromo.name}" verified and committed to POS schedule!`);
                  }}
                >
                  <CheckCircle2 size={16} /> Approve & Commit Promotion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Discount Modal */}
      <Modal
        isOpen={!!adjustDiscountModal}
        onClose={() => setAdjustDiscountModal(null)}
        title={`Adjust Promotional Discount: ${adjustDiscountModal?.name}`}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setAdjustDiscountModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdjustDiscount}>Apply Calibrated Discount</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Calibrate the discount ceiling to align demand velocity with physical warehouse availability:
          </p>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>Adjusted Discount:</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{newDiscountVal}%</strong>
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
          <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#1E40AF' }}>
            Recommended by AI: <strong>10% Discount</strong> caps total weekend demand at ~180 units, completely eliminating stockout risks while preserving healthy margins.
          </div>
        </div>
      </Modal>

      {/* Increase Stock Allocation Modal */}
      <Modal
        isOpen={!!increaseStockModal}
        onClose={() => setIncreaseStockModal(null)}
        title={`Increase Stock Allocation: ${increaseStockModal?.product}`}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setIncreaseStockModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleIncreaseStock}>Transfer Stock</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Dispatch additional backroom inventory from regional central warehouse prior to promotion launch:
          </p>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Additional Quantity (Units):
            </label>
            <input
              type="number"
              style={{ width: '100%' }}
              value={extraStockQty}
              onChange={(e) => setExtraStockQty(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Available surplus in Erode Central DC: <strong>480 units</strong>. Express transit: ~3.5 hours.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PromotionGuardian;
