import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  CloudSun,
  PartyPopper,
  Tag,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Search,
  Eye,
  Clock,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';

const DemandIntelligence = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'forecasting';
  const [activeTab, setActiveTab] = useState(
    initialTab === 'hidden-demand' ? 'hidden' : initialTab === 'drivers' ? 'drivers' : initialTab === 'sku' ? 'sku' : 'forecasting'
  );

  useEffect(() => {
    const tab = searchParams.get('tab') || 'forecasting';
    setActiveTab(tab === 'hidden-demand' ? 'hidden' : ['drivers', 'hidden', 'sku'].includes(tab) ? tab : 'forecasting');
  }, [searchParams]);

  const { selectedStore, setSelectedStore, stores } = useApp();
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [forecastHorizon, setForecastHorizon] = useState(14);
  const [demandData, setDemandData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hidden Demand State
  const [hiddenData, setHiddenData] = useState([]);
  const [selectedHiddenItem, setSelectedHiddenItem] = useState(null);

  // Sync tab change to URL param for deep linking
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getDemandIntelligence({
      store: selectedStore,
      product: selectedProduct,
      horizon: forecastHorizon,
    }).then((res) => {
      if (isMounted) {
        setDemandData(res.forecastItems || []);
        setChartData(res.forecastChart || []);
        setLoading(false);
      }
    });

    RetailPulseApi.getHiddenDemand(selectedStore).then((data) => {
      if (isMounted && data) {
        setHiddenData(data);
        setSelectedHiddenItem(data[0] || null);
      }
    });

    return () => { isMounted = false; };
  }, [selectedStore, selectedProduct, forecastHorizon]);

  // SKU Demand Table Columns
  const skuColumns = [
    {
      header: 'Store',
      key: 'store',
      render: (row) => <strong>{row.store}</strong>,
    },
    {
      header: 'Product / SKU',
      key: 'product',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600 }}>{row.product}</span>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
            Weather: {row.weatherImpact} • Event: {row.festivalImpact}
          </div>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      key: 'currentStock',
      align: 'right',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {row.currentStock} units
        </span>
      ),
    },
    {
      header: 'Predicted Demand (P50)',
      key: 'predictedDemand',
      align: 'right',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>
          {row.predictedDemand} units
        </span>
      ),
    },
    {
      header: 'Demand Change',
      key: 'demandChange',
      align: 'center',
      render: (row) => {
        const isUp = row.demandChange?.startsWith('+');
        const isDown = row.demandChange?.startsWith('-');
        return (
          <span
            className={`badge ${isUp ? 'badge-danger' : isDown ? 'badge-neutral' : 'badge-success'}`}
          >
            {isUp && <ArrowUpRight size={12} />}
            {isDown && <ArrowDownRight size={12} />}
            {!isUp && !isDown && <Minus size={12} />}
            {row.demandChange}
          </span>
        );
      },
    },
    {
      header: 'Risk Horizon',
      key: 'risk',
      render: (row) => <RiskBadge severity={row.riskLevel} label={row.risk} />,
    },
  ];

  // Hidden Demand Table Columns
  const hiddenColumns = [
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
      header: 'Inspect Signal',
      key: 'action',
      render: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedHiddenItem(row)}
        >
          View Signal
        </button>
      ),
    },
  ];

  return (
    <div className="demand-intelligence-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Demand Intelligence</h2>
          <p className="page-subtitle">
            Autonomous multi-signal demand forecasting, causal attribution & stockout reconstruction across Tamil Nadu.
          </p>
        </div>

        {/* Global Filter Controls */}
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
            <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>SKU:</span>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
              <option value="all">All Products</option>
              <option value="Cooking Oil">Cooking Oil</option>
              <option value="Milk">Fresh Milk 500ml</option>
              <option value="Biscuits">Digestive Biscuits</option>
              <option value="Umbrella">Monsoon Umbrella</option>
              <option value="Rice">Basmati Rice 5kg</option>
              <option value="Drink">Soft Drink 750ml</option>
            </select>
          </div>

          <div className="filter-control">
            <Calendar size={14} color="var(--color-primary)" />
            <select value={forecastHorizon} onChange={(e) => setForecastHorizon(Number(e.target.value))}>
              <option value={7}>7-Day Forecast</option>
              <option value={14}>14-Day Forecast</option>
              <option value={30}>30-Day Forecast</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'forecasting' ? 'active' : ''}`}
          onClick={() => handleTabChange('forecasting')}
        >
          <TrendingUp size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Demand Forecasting (P10/P50/P90)
        </button>

        <button
          className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => handleTabChange('drivers')}
        >
          <CloudSun size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Demand Drivers & Attribution
        </button>

        <button
          className={`tab-btn ${activeTab === 'hidden' ? 'active' : ''}`}
          onClick={() => handleTabChange('hidden')}
        >
          <Search size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Hidden Demand Reconstruction
          <span className="badge badge-purple" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>AI Recovery</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'sku' ? 'active' : ''}`}
          onClick={() => handleTabChange('sku')}
        >
          <Layers size={15} style={{ display: 'inline', marginRight: '6px' }} />
          SKU Demand Analysis
        </button>
      </div>

      {/* TAB 1: DEMAND FORECASTING */}
      {activeTab === 'forecasting' && (
        <>
          {/* Signal Influence Indicator Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="section-card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                <CloudSun size={18} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Weather Signal</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>+34% Surge</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Northeast monsoon rains in Western corridor
              </span>
            </div>

            <div className="section-card" style={{ padding: '1rem', borderLeft: '4px solid #D97706' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                <PartyPopper size={18} color="#D97706" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Festival Impact</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D97706' }}>+28% Regional Peak</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Diwali sweets & essentials stocking peak
              </span>
            </div>

            <div className="section-card" style={{ padding: '1rem', borderLeft: '4px solid #7C3AED' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                <Tag size={18} color="#7C3AED" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Promotion Elasticity</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7C3AED' }}>+45% Elastic Lift</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Active FMCG discount campaigns
              </span>
            </div>

            <div className="section-card" style={{ padding: '1rem', borderLeft: '4px solid #16A34A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                <Sparkles size={18} color="#16A34A" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Model Precision</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16A34A' }}>96.8% Accuracy</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Dual Engine: SDOWF Baseline + HistGradientBoosting
              </span>
            </div>
          </div>

          {/* Main Forecast Chart */}
          <div className="section-card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-card-header">
              <div>
                <div className="section-card-title">
                  <TrendingUp size={18} color="var(--color-primary)" />
                  Historical Sales vs Quantile Forecast Curve (P10 / P50 / P90)
                </div>
                <div className="section-card-subtitle">
                  Comparing verified POS cashier sales against predictive demand trajectory ({forecastHorizon} days forward)
                </div>
              </div>
              <span className="badge badge-primary">Confidence Interval ±3.5%</span>
            </div>

            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} domain={[1300, 2200]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.8rem',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="historical"
                    name="Historical Verified POS Sales"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHistorical)"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    name="Predicted Forward Demand (P50 Median)"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorPredicted)"
                  />
                  <Line
                    type="monotone"
                    dataKey="optimalStock"
                    name="Safety Stock Buffer"
                    stroke="#16A34A"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </>
      )}

      {/* TAB 2: DEMAND DRIVERS & ATTRIBUTION */}
      {activeTab === 'drivers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="section-card">
            <div className="section-card-header">
              <div>
                <div className="section-card-title">
                  <Sliders size={18} color="var(--color-primary)" />
                  Multi-Signal Causal Factor Attribution (SHAP Decomposition)
                </div>
                <div className="section-card-subtitle">
                  Relative weight of exogenous factors shaping SKU consumption curves across Tamil Nadu
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', padding: '0.5rem 0' }}>
              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Historical Day-of-Week Seasonality</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>38% Influence</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '38%', height: '100%', backgroundColor: 'var(--color-primary)' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                  Strong Saturday-Sunday replenishment lift across peri-urban supermarket locations.
                </p>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Tamil Nadu Regional Festivals</span>
                  <span style={{ fontWeight: 700, color: '#D97706' }}>28% Influence</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '28%', height: '100%', backgroundColor: '#D97706' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                  Diwali & Pongal confectionary, ghee, and staple grains procurement wave.
                </p>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Monsoon Weather Signals</span>
                  <span style={{ fontWeight: 700, color: '#0284C7' }}>22% Influence</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '22%', height: '100%', backgroundColor: '#0284C7' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                  Precipitation alerts triggering urgent demand in protective gear and shelf-stable foods.
                </p>
              </div>

              <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Promotional Elasticity</span>
                  <span style={{ fontWeight: 700, color: '#7C3AED' }}>12% Influence</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '12%', height: '100%', backgroundColor: '#7C3AED' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                  Cross-category price discounts actively stimulating basket size additions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HIDDEN DEMAND RECONSTRUCTION (Consolidated from HiddenDemandDetector) */}
      {activeTab === 'hidden' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Concept Banner */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#FAF5FF',
              border: '1px solid #D8B4FE',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <Sparkles size={24} color="#7C3AED" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                AI Stockout Reconstruction Model
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>TRUE MARKET DEMAND RECOVERY</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#581C87', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                Standard POS cash registers only record completed sales. When shelves empty out, recorded sales collapse to 0, deceiving naive models into thinking demand vanished. RetailMind AI reconstructs true unmet demand from footfall surges, weather shifts, and peer SKU cross-elasticities.
              </p>
            </div>
          </div>

          {/* Deep-Dive Case Study on Selected Item */}
          {selectedHiddenItem && (
            <div className="section-card">
              <div className="section-card-header">
                <div>
                  <div className="section-card-title">
                    <Search size={18} color="var(--color-primary)" />
                    Deep-Dive Reconstructed Incident: {selectedHiddenItem.product} ({selectedHiddenItem.store})
                  </div>
                  <div className="section-card-subtitle">
                    Recorded POS Register Volume vs True Model-Estimated Consumer Demand
                  </div>
                </div>
                <span className="badge badge-primary">Hidden Demand Score: {selectedHiddenItem.hiddenDemandScore}/100</span>
              </div>

              {/* Counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#F1F5F9', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Recorded POS Sales</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    {selectedHiddenItem.recordedSales} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>units</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Verified checkout tickets</span>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600 }}>Estimated Lost Demand</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626' }}>
                    +{selectedHiddenItem.estimatedUnmetDemand} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>units</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#DC2626' }}>Unfulfilled during stockout</span>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-active)', fontWeight: 600 }}>True Market Demand</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {selectedHiddenItem.estimatedTrueDemand} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>units</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Reconstructed customer intent</span>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>Stockout Duration</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706' }}>
                    {selectedHiddenItem.stockoutDurationHours} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>hours</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#B45309' }}>Shelf empty window</span>
                </div>
              </div>

              {/* Chart */}
              <div style={{ width: '100%', height: 260, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedHiddenItem.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '0.8rem' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '6px' }} />
                    <Bar dataKey="recordedSales" name="Recorded POS Sales (Actual)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="estimatedDemand" name="Estimated True Demand (AI Reconstructed)" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Explanations & Substitution */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                    Reconstructed Incident Explanation:
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    "{selectedHiddenItem.explanation}"
                  </p>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                    Shopper Substitution Patterns:
                  </h4>
                  <ul style={{ paddingLeft: '1.15rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {selectedHiddenItem.substitutionPatterns?.map((sub, idx) => (
                      <li key={idx}>
                        <strong>{sub.item}:</strong> {sub.rate}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Hidden Demand Table */}
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

            <DataTable columns={hiddenColumns} data={hiddenData} />
          </div>
        </div>
      )}

      {/* TAB 4: SKU DEMAND ANALYSIS TABLE */}
      {activeTab === 'sku' && (
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <div className="section-card-title">SKU Demand Trend Classification & Risk Mapping</div>
              <div className="section-card-subtitle">
                Live stock versus AI forecast delta across selected Tamil Nadu store locations
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-danger">Increasing Demand (High Depletion)</span>
              <span className="badge badge-neutral">Decreasing (Overstock Risk)</span>
              <span className="badge badge-success">Stable</span>
            </div>
          </div>

          <DataTable columns={skuColumns} data={demandData} />
        </div>
      )}
    </div>
  );
};

export default DemandIntelligence;
