import React, { useState, useEffect } from 'react';
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
  Area
} from 'recharts';
import {
  TrendingUp,
  CloudSun,
  PartyPopper,
  Tag,
  Info,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';

const DemandIntelligence = () => {
  const { selectedStore, setSelectedStore, stores } = useApp();
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [forecastHorizon, setForecastHorizon] = useState(14);
  const [demandData, setDemandData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getDemandIntelligence({
      store: selectedStore,
      product: selectedProduct,
      horizon: forecastHorizon,
    }).then((res) => {
      if (isMounted) {
        setDemandData(res.forecastItems);
        setChartData(res.forecastChart);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [selectedStore, selectedProduct, forecastHorizon]);

  const columns = [
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
      header: 'Predicted Demand',
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
        const isUp = row.demandChange.startsWith('+');
        const isDown = row.demandChange.startsWith('-');
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

  return (
    <div className="demand-intelligence-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Demand Intelligence</h2>
          <p className="page-subtitle">
            Autonomous multi-signal demand forecasting across Tamil Nadu stores and SKUs.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Store Filter */}
          <div className="filter-control">
            <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Store:</span>
            <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
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

          {/* Horizon Toggle */}
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

      {/* Signal Influence Indicator Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="section-card" style={{ padding: '1rem', borderLeft: '4px solid #0284C7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <CloudSun size={18} color="#0284C7" />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Weather Influence</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284C7' }}>+34% Spike</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Northeast monsoon rains in Western corridor
          </span>
        </div>

        <div className="section-card" style={{ padding: '1rem', borderLeft: '4px solid #D97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <PartyPopper size={18} color="#D97706" />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Festival & Event Impact</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D97706' }}>+28% Regional Surge</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Diwali sweets & groceries stocking peak
          </span>
        </div>

        <div className="section-card" style={{ padding: '1rem', borderLeft: '4px solid #7C3AED' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Tag size={18} color="#7C3AED" />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Promotion Impact</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7C3AED' }}>+45% Elasticity</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Active weekend FMCG discount campaigns
          </span>
        </div>

        <div className="section-card" style={{ padding: '1rem', borderLeft: '4px solid #16A34A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Sparkles size={18} color="#16A34A" />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Forecast Confidence</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16A34A' }}>96.8% Accuracy</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Ensemble: Prophet + LightGBM + Multi-Signal
          </span>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="section-card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-card-header">
          <div>
            <div className="section-card-title">
              <TrendingUp size={18} color="var(--color-primary)" />
              Historical Sales vs Predicted Demand Curve
            </div>
            <div className="section-card-subtitle">
              Comparing verified POS cashier sales against AI neural demand trajectory ({forecastHorizon} days horizon)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-primary">Confidence Interval ±3.5%</span>
          </div>
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
                name="Predicted Forward Demand"
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

      {/* Demand Explanation Panel */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#EFF6FF',
          borderColor: '#BFDBFE',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ marginTop: '2px' }}>
          <Info size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E40AF', marginBottom: '0.35rem' }}>
            Autonomous Demand Explanation Engine
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#1E3A8A', lineHeight: 1.5, margin: 0 }}>
            "Demand is expected to increase because of upcoming festivals, seasonal trends and historical purchasing patterns. Specifically, Coimbatore and Tiruppur exhibit higher cooking essentials demand (+38%), while monsoon rains in the Western Ghats corridor are accelerating seasonal umbrella & hot beverage consumption."
          </p>
        </div>
      </div>

      {/* Demand Classification Table */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <div className="section-card-title">SKU Demand Trend Classification & Risk Mapping</div>
            <div className="section-card-subtitle">
              Live stock versus AI forecast delta across selected stores
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-danger">Increasing Demand (High Depletion)</span>
            <span className="badge badge-neutral">Decreasing (Overstock Risk)</span>
            <span className="badge badge-success">Stable</span>
          </div>
        </div>

        <DataTable columns={columns} data={demandData} />
      </div>
    </div>
  );
};

export default DemandIntelligence;
