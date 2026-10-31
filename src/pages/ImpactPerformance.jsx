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
  BarChart3,
  TrendingUp,
  Award,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { RetailPulseApi } from '../services/api';
import KPICard from '../components/common/KPICard';

const ImpactPerformance = () => {
  const [benchmarks, setBenchmarks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    RetailPulseApi.getImpactBenchmarks().then((data) => {
      if (isMounted) {
        setBenchmarks(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  if (loading || !benchmarks) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)' }}>
          <Sparkles className="pulse-dot" />
          <span style={{ fontWeight: 600 }}>Benchmarking operational performance delta...</span>
        </div>
      </div>
    );
  }

  const { kpis, monthlyTrend, totalSavingsToDate, totalRevenueProtected, decisionsExecutedCount, decisionSuccessRate } = benchmarks;

  return (
    <div className="impact-performance-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Impact & Performance Audit</h2>
          <p className="page-subtitle">
            Empirical benchmark comparing traditional retail heuristics against autonomous RetailPulse AI strategy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-primary">
            <CheckCircle2 size={13} /> {decisionsExecutedCount} Autonomous Decisions Audited
          </span>
          <span className="badge badge-success">
            Success Rate: {decisionSuccessRate}
          </span>
        </div>
      </div>

      {/* Top Value Headline Cards */}
      <div className="kpi-grid">
        <KPICard
          title="Revenue Protected"
          value={totalRevenueProtected}
          trend="+18.4% YoY"
          trendDirection="positive"
          subtitle="Prevented stockout walkouts"
          icon={ShieldCheck}
          iconColor="#16A34A"
          iconBg="#DCFCE7"
        />
        <KPICard
          title="Net Cost Savings"
          value={totalSavingsToDate}
          trend="-28% logistics waste"
          trendDirection="positive"
          subtitle="Holding cost & write-off savings"
          icon={DollarSign}
          iconColor="#2563EB"
          iconBg="#EFF6FF"
        />
        <KPICard
          title="Stockout Rate"
          value="3.6%"
          trend="-10.6% reduction"
          trendDirection="positive"
          subtitle="Baseline was 14.2%"
          icon={TrendingUp}
          iconColor="#7C3AED"
          iconBg="#F3E8FF"
        />
        <KPICard
          title="Decision Accuracy"
          value={decisionSuccessRate}
          trend="+36.2% lift"
          trendDirection="positive"
          subtitle="Over manual store ordering"
          icon={Award}
          iconColor="#0D9488"
          iconBg="#CCFBF1"
        />
      </div>

      {/* Strategy Comparison Table (Baseline vs AI) */}
      <div className="section-card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-card-header">
          <div>
            <div className="section-card-title">
              <Award size={18} color="var(--color-primary)" />
              Head-to-Head: Traditional Strategy vs RetailPulse AI
            </div>
            <div className="section-card-subtitle">
              Measured six-month operational delta across 5 supermarket hubs
            </div>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            Experimental Trial Data Labelled
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Operational Metric</th>
                <th style={{ textAlign: 'center' }}>Traditional Baseline Strategy</th>
                <th style={{ textAlign: 'center' }}>RetailPulse AI Strategy</th>
                <th style={{ textAlign: 'center' }}>Net Performance Delta</th>
                <th>Impact Verdict</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 700 }}>{kpi.metric}</td>
                  <td style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {kpi.baseline}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    {kpi.aiStrategy}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-success" style={{ fontWeight: 800 }}>
                      <ArrowUpRight size={13} /> {kpi.delta}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {kpi.metric.includes('Stockout') && 'Eliminated 74% of consumer shelf-outages'}
                      {kpi.metric.includes('Excess') && 'Freed locked working capital via inter-store transfers'}
                      {kpi.metric.includes('Service') && 'Class-leading on-shelf availability for loyalty members'}
                      {kpi.metric.includes('Margin') && 'Optimized promotional discount ceilings'}
                      {kpi.metric.includes('Holding') && 'Reduced spoilage and long-term storage lease overhead'}
                      {kpi.metric.includes('Accuracy') && 'Outperformed manual manager intuition by 36%'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Financial Trend Chart */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <div className="section-card-title">
              <BarChart3 size={18} color="var(--color-primary)" />
              Monthly Protected Revenue vs Traditional Baseline Losses (₹)
            </div>
            <div className="section-card-subtitle">
              Cumulative financial trajectory demonstrating sustainable margin preservation
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val) => `₹${Number(val).toLocaleString()}`}
                contentStyle={{ backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '0.8rem' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
              <Bar dataKey="baselineLoss" name="Traditional Loss (Unmitigated)" fill="#F87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aiProtected" name="Revenue Protected by AI" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netSavings" name="Net Realized Profit Savings" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ImpactPerformance;
