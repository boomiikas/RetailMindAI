import React, { useState, useEffect } from 'react';
import {
  GitFork,
  ArrowRight,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';

const SCENARIOS = [
  { id: 'promotion', name: 'Launch New Promotion', desc: 'Simulate margin vs volume tradeoff' },
  { id: 'discount', name: 'Increase Product Discount', desc: 'Price elasticity ripple' },
  { id: 'transfer', name: 'Transfer Stock Between Stores', desc: 'Evaluate cross-dock freight & balance' },
  { id: 'allocation', name: 'Increase Product Allocation', desc: 'Simulate festive capital commitment' },
  { id: 'delay', name: 'Supplier Delivery Delay', desc: 'Stress test buffer depletion timeline' },
  { id: 'spike', name: 'Sudden Demand Surge (Monsoon/Festival)', desc: 'Weather or viral consumption spike' },
];

const DecisionRippleSimulator = () => {
  const { stores } = useApp();

  // Configurable Simulator Inputs
  const [scenarioType, setScenarioType] = useState('promotion');
  const [selectedProduct, setSelectedProduct] = useState('1L Sunflower Cooking Oil');
  const [selectedStore, setSelectedStore] = useState('Coimbatore');
  const [currentPrice, setCurrentPrice] = useState(165);
  const [discountPct, setDiscountPct] = useState(25);
  const [currentInventory, setCurrentInventory] = useState(180);
  const [leadTimeDays, setLeadTimeDays] = useState(4);

  // Simulation output state
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedOption, setSelectedOption] = useState('opt-b'); // Default select Option B

  // Run initial simulation on mount and whenever parameters are executed
  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = RetailPulseApi.simulateScenario({
        scenarioType,
        store: selectedStore,
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
    runSimulation();
  }, [scenarioType, selectedProduct, selectedStore]);

  return (
    <div className="decision-ripple-simulator-page">
      {/* Top Banner / Concept Header */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          marginBottom: '1.5rem',
          border: '1px solid #334155',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Sparkles size={13} /> SIGNATURE CAPABILITY: DECISION RIPPLE ENGINE
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            "What happens if I make this decision?"
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94A3B8', maxWidth: '780px', lineHeight: 1.5 }}>
            Don't commit capital blindly. Simulate the full multi-tier chain reaction across demand elasticity, backroom inventory depletion, emergency carrier freights, net margin dilution, and customer churn.
          </p>
        </div>
      </div>

      {/* Scenario Selector Ribbon */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
          Choose A Decision Scenario:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
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
                boxShadow: scenarioType === sc.id ? 'var(--shadow-sm)' : 'none',
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
      </div>

      {/* Interactive Controls & Live Input Sliders */}
      <div className="section-card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-card-header">
          <div className="section-card-title">
            <Sliders size={18} color="var(--color-primary)" />
            Configurable Scenario Parameters
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={runSimulation}
            disabled={isSimulating}
          >
            <Zap size={14} /> Simulate Business Impact
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
          {/* Product Selector */}
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
                else if (e.target.value.includes('Umbrella')) { setCurrentPrice(320); setCurrentInventory(40); }
              }}
            >
              <option value="1L Sunflower Cooking Oil">1L Sunflower Cooking Oil (₹165)</option>
              <option value="Fresh Farm Milk 500ml">Fresh Farm Milk 500ml (₹32)</option>
              <option value="Sparkling Citrus Drink 750ml">Sparkling Citrus Drink 750ml (₹50)</option>
              <option value="Monsoon Windproof Umbrella">Monsoon Windproof Umbrella (₹320)</option>
              <option value="Premium Digestive Biscuits">Premium Digestive Biscuits (₹45)</option>
            </select>
          </div>

          {/* Store Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Target Store:
            </label>
            <select
              style={{ width: '100%' }}
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              {stores.filter(s => s.id !== 'all').map(s => (
                <option key={s.id} value={s.name}>{s.name} Supermarket</option>
              ))}
            </select>
          </div>

          {/* Discount Percentage Slider */}
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

          {/* Current Inventory Input */}
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

          {/* Supplier Lead Time */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Supplier Lead Time:
              </label>
              <span style={{ fontWeight: 800 }}>{leadTimeDays} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {simulationResult && (
        <>
          {/* Decision Ripple Flowchart Diagram */}
          <div className="section-card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-card-header">
              <div>
                <div className="section-card-title">
                  <GitFork size={18} color="var(--color-primary)" />
                  Visual Decision Ripple Pipeline (Causal Consequence Path)
                </div>
                <div className="section-card-subtitle">
                  Autonomous propagation from initial retail action to ultimate profit and shopper retention
                </div>
              </div>
            </div>

            <div className="ripple-pipeline">
              {simulationResult.rippleSteps.map((step, idx) => {
                const isPos = step.status === 'positive';
                const isNeg = step.status === 'negative';
                const isWarn = step.status === 'warning';

                return (
                  <React.Fragment key={idx}>
                    <div
                      className="ripple-node-step"
                      style={{
                        borderTop: `4px solid ${isPos ? '#16A34A' : isNeg ? '#DC2626' : isWarn ? '#F59E0B' : 'var(--color-primary)'}`,
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                        {step.stage}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isNeg ? '#DC2626' : isPos ? '#15803D' : '#1E293B', marginBottom: '0.2rem' }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: 1.3, marginBottom: '0.4rem' }}>
                        {step.description}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          backgroundColor: isPos ? '#DCFCE7' : isNeg ? '#FEE2E2' : '#F1F5F9',
                          color: isPos ? '#15803D' : isNeg ? '#B91C1C' : '#334155',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                        }}
                      >
                        {step.metric}
                      </div>
                    </div>

                    {idx < simulationResult.rippleSteps.length - 1 && (
                      <div className="ripple-arrow">→</div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Before Decision vs After Decision Comparison */}
          <div className="section-card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-card-header">
              <div className="section-card-title">Business State Comparison (Before vs After Decision)</div>
              <span className="badge badge-primary">Dynamic Frontend Model Real-Time Calculation</span>
            </div>

            <div className="comparison-grid">
              {/* Before Column */}
              <div className="comparison-column">
                <div className="comparison-column-header" style={{ color: 'var(--color-text-secondary)' }}>
                  BEFORE DECISION (Current Status Quo)
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Baseline Demand:</span>
                  <span style={{ fontWeight: 700 }}>{simulationResult.before.demand} units</span>
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Available Stock:</span>
                  <span style={{ fontWeight: 700 }}>{simulationResult.before.stock} units</span>
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Expected Gross Revenue:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{simulationResult.before.revenue.toLocaleString()}</span>
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Gross Profit Margin:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{simulationResult.before.margin}</span>
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Net Profit Contribution:</span>
                  <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>₹{simulationResult.before.profit.toLocaleString()}</span>
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Stockout Risk Exposure:</span>
                  <span style={{ fontWeight: 700, color: '#D97706' }}>{simulationResult.before.stockoutRisk}</span>
                </div>
              </div>

              {/* After Column */}
              <div className="comparison-column">
                <div className="comparison-column-header" style={{ color: 'var(--color-primary)' }}>
                  AFTER DECISION (Simulated Outcome)
                </div>

                <div className="comparison-metric-item" style={{ borderLeft: '3px solid var(--color-primary)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Predicted Surged Demand:</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{simulationResult.after.demand} units</span>
                </div>

                <div className="comparison-metric-item" style={{ borderLeft: '3px solid var(--color-primary)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Inventory Required:</span>
                  <span style={{ fontWeight: 700 }}>{simulationResult.after.requiredInventory} units</span>
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Simulated Gross Revenue:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-dark-navy)' }}>
                    ₹{simulationResult.after.revenue.toLocaleString()}
                  </span>
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>New Realized Margin:</span>
                  <span style={{ fontWeight: 700 }}>{simulationResult.after.margin}</span>
                </div>

                <div className="comparison-metric-item">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Expedited Freight Overhead:</span>
                  <span style={{ fontWeight: 700, color: simulationResult.after.logisticsCost > 0 ? '#DC2626' : '#16A34A' }}>
                    ₹{simulationResult.after.logisticsCost}
                  </span>
                </div>

                <div className="comparison-metric-item" style={{ borderLeft: `3px solid ${parseInt(simulationResult.after.stockoutRisk) > 40 ? '#DC2626' : '#16A34A'}` }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Post-Decision Stockout Risk:</span>
                  <span style={{ fontWeight: 800, color: parseInt(simulationResult.after.stockoutRisk) > 40 ? '#DC2626' : '#16A34A' }}>
                    {simulationResult.after.stockoutRisk}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Three Decision Options Comparison & Recommended Action */}
          <div className="section-card">
            <div className="section-card-header">
              <div>
                <div className="section-card-title">
                  <Sparkles size={18} color="var(--color-purple)" />
                  Comparing 3 Strategic Options & Autonomous AI Verdict
                </div>
                <div className="section-card-subtitle">
                  AI synthesized recommendation based on profit maximization and customer satisfaction
                </div>
              </div>
            </div>

            <div className="scenario-options-grid" style={{ marginBottom: '1.25rem' }}>
              {simulationResult.options.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`scenario-option-card ${selectedOption === opt.id ? 'selected' : ''} ${opt.isRecommended ? 'recommended' : ''}`}
                >
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-dark-navy)', marginBottom: '0.4rem' }}>
                      {opt.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                      {opt.description}
                    </p>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                      <span>Revenue:</span>
                      <strong>{opt.projectedRevenue}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                      <span>Profit:</span>
                      <strong style={{ color: 'var(--color-success-text)' }}>{opt.projectedProfit}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span>Stockout Risk:</span>
                      <strong style={{ color: parseInt(opt.stockoutRisk) > 30 ? '#DC2626' : '#16A34A' }}>{opt.stockoutRisk}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: opt.isRecommended ? '#15803D' : 'var(--color-text-secondary)' }}>
                    {opt.summary}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendation Summary Box */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <CheckCircle2 size={24} color="var(--color-success)" />
              <div>
                <div style={{ fontWeight: 800, color: '#15803D', fontSize: '0.9rem' }}>
                  AI Recommendation & Execution Rationale
                </div>
                <p style={{ fontSize: '0.8rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                  {simulationResult.recommendationSummary}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DecisionRippleSimulator;
