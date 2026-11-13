import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Line,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RetailPulseApi } from '../services/api';

const DemandForecastTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.65rem 0.8rem', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.14)', fontSize: '0.8rem' }}>
      <strong>{point.date}</strong>
      {point.historical != null && <div>Historical sales: {point.historical} units</div>}
      {point.p10 != null && <div>Lower estimate: {point.p10} units</div>}
      {point.p50 != null && <div>Expected demand: {point.p50} units</div>}
      {point.p90 != null && <div>Higher estimate: {point.p90} units</div>}
    </div>
  );
};

const DemandIntelligence = () => {
  const { selectedStore, stores } = useApp();
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getDemandIntelligence({
      store: selectedStore,
      product: selectedProduct,
      horizon: 14,
    }).then((res) => {
      if (isMounted) {
        setChartData(res.forecastChart || []);
      }
    });

    return () => { isMounted = false; };
  }, [selectedStore, selectedProduct]);

  const chartValues = chartData.flatMap((point) => [
    point.historical,
    point.p10,
    point.p50 ?? point.predicted,
    point.p90,
  ]).filter((value) => Number.isFinite(value));
  const chartMin = chartValues.length ? Math.min(...chartValues) : 0;
  const chartMax = chartValues.length ? Math.max(...chartValues) : 1;
  const chartPadding = Math.max(2, (chartMax - chartMin) * 0.15);
  const chartYDomain = [Math.max(0, Math.floor(chartMin - chartPadding)), Math.ceil(chartMax + chartPadding)];
  const productTitle = ({
    all: 'All Products',
    'Cooking Oil': 'Cooking Oil',
    Milk: 'Fresh Milk 500ml',
    Biscuits: 'Digestive Biscuits',
    Rice: 'Basmati Rice 5kg',
    Drink: 'Soft Drink 750ml',
  })[selectedProduct] || selectedProduct;
  const selectedStoreInfo = stores.find((store) => store.id === selectedStore);
  const storeTitle = selectedStore === 'all' ? 'All Stores' : (selectedStoreInfo?.city || selectedStoreInfo?.name || 'Selected Store');

  return (
    <div className="demand-intelligence-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Demand Intelligence</h2>
          <p className="page-subtitle">
            View historical sales and demand forecasts for selected stores and products.
          </p>
        </div>

      </div>

      {/* Main Forecast Chart */}
          <div className="section-card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-card-header">
              <div>
                <div className="section-card-title">
                  <TrendingUp size={18} color="var(--color-primary)" />
                  Sales &amp; Demand Forecast · {productTitle} · {storeTitle}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div className="filter-control">
                  <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>SKU:</span>
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} aria-label="Forecast SKU">
                    <option value="all">All Products</option>
                    <option value="Cooking Oil">Cooking Oil</option>
                    <option value="Milk">Fresh Milk 500ml</option>
                    <option value="Biscuits">Digestive Biscuits</option>
                    <option value="Rice">Basmati Rice 5kg</option>
                    <option value="Drink">Soft Drink 750ml</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: 'calc(100vh - 330px)', minHeight: 380, maxHeight: 720 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastRangeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#147D75" stopOpacity={0.24}/>
                      <stop offset="100%" stopColor="#147D75" stopOpacity={0.08}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} domain={chartYDomain} width={52} />
                  <Tooltip content={<DemandForecastTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="p10"
                    stackId="forecast-range"
                    name="Lower estimate"
                    stroke="transparent"
                    fill="transparent"
                    fillOpacity={0}
                    legendType="none"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecastRange"
                    stackId="forecast-range"
                    name="Likely demand range"
                    stroke="none"
                    fill="url(#forecastRangeFill)"
                    fillOpacity={1}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    name="Historical sales"
                    stroke="#64748B"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: '#64748B' }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="p50"
                    name="Expected demand"
                    stroke="#147D75"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#147D75' }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
    </div>
  );
};

export default DemandIntelligence;
