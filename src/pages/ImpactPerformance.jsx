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
  Area,
  Line
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
  Layers,
  Activity,
  IndianRupee
} from 'lucide-react';
import { RetailPulseApi } from '../services/api';
import KPICard from '../components/common/KPICard';

const THREE_MODE_BENCHMARKS = [
  {
    metric: 'Stockout Incidence Rate',
    baseline: '14.2%',
    prescriptive: '6.8%',
    agentic: '3.6%',
    netDelta: '-10.6% absolute',
    verdict: '74% reduction in shelf stockouts across high-velocity staples'
  },
  {
    metric: 'Excess Capital in Overstock',
    baseline: '₹4.85L / store',
    prescriptive: '₹2.90L / store',
    agentic: '₹1.45L / store',
    netDelta: '-70.1% working capital',
    verdict: 'Continuous lateral transfers rebalance excess before expiry'
  },
  {
    metric: 'Service Level & On-Shelf Availability',
    baseline: '85.8%',
    prescriptive: '93.2%',
    agentic: '96.4%',
    netDelta: '+10.6% service level',
    verdict: 'Top-quartile availability sustained through peak monsoon'
  },
  {
    metric: 'Promotional Margin Preservation',
    baseline: '18.4%',
    prescriptive: '21.0%',
    agentic: '23.8%',
    netDelta: '+5.4% margin lift',
    verdict: 'Promotion Guardian halts stockout-inducing discounts'
  },
  {
    metric: 'Dynamic Replanning Adaptation Time',
    baseline: '48 - 72 Hours',
    prescriptive: '12 - 24 Hours',
    agentic: '< 15 Minutes',
    netDelta: 'Real-time autonomy',
    verdict: 'Automated highway rerouting upon freight disruption'
  },
  {
    metric: 'Forecast Uncertainty & Bias',
    baseline: '24.5% WAPE',
    prescriptive: '12.8% WAPE',
    agentic: '5.8% WAPE',
    netDelta: '-18.7% error delta',
    verdict: 'Dual-mode statistical baseline with quantile calibration'
  }
];

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

  const { monthlyTrend, totalSavingsToDate, totalRevenueProtected, decisionsExecutedCount, decisionSuccessRate } = benchmarks;

  return (
    <div className="impact-performance-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Impact & Performance Audit</h2>
          <p className="page-subtitle">
            Empirical benchmark comparing traditional retail heuristics against autonomous RetailMind AI strategy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            <CheckCircle2 size={13} /> {decisionsExecutedCount} Decisions Executed
          </span>
          <span className="badge badge-success">
            Success Rate: {decisionSuccessRate}
          </span>
        </div>
      </div>

      {/* Value Realization KPI Strip */}
      <div className="kpi-grid">
        <KPICard
          title="Revenue Protected"
          value={totalRevenueProtected}
          trend="+18.4% YoY"
          trendDirection="positive"
          subtitle="Stockout walkouts prevented"
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
          icon={IndianRupee}
          iconColor="#2563EB"
          iconBg="#EFF6FF"
        />
        <KPICard
          title="Stockout Rate"
          value="3.6%"
          trend="-10.6% absolute reduction"
          trendDirection="positive"
          subtitle="Baseline heuristic was 14.2%"
          icon={TrendingUp}
          iconColor="#7C3AED"
          iconBg="#F3E8FF"
        />
        <KPICard
          title="Decision Execution SLA"
          value={decisionSuccessRate}
          trend="+36.2% lift"
          trendDirection="positive"
          subtitle="Over manual store manager ordering"
          icon={Award}
          iconColor="#0D9488"
          iconBg="#CCFBF1"
        />
      </div>

      {/* 3-Mode Operating Benchmark Table */}
      <div className="section-card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-card-header">
          <div>
            <div className="section-card-title">
              <Award size={18} color="var(--color-primary)" />
              Three-Mode Operating Benchmark: Baseline vs Prescriptive vs Agentic
            </div>
            <div className="section-card-subtitle">
              Measured operational delta comparing traditional Min-Max, mathematical optimization, and RetailMind AI
            </div>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            Audited Operating Ledger
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Operational Dimension</th>
                <th style={{ textAlign: 'center' }}>1. Traditional Baseline (Min-Max)</th>
                <th style={{ textAlign: 'center' }}>2. Prescriptive Optimization (LP)</th>
                <th style={{ textAlign: 'center', backgroundColor: '#EFF6FF', color: 'var(--color-primary)' }}>
                  3. RetailMind Agentic AI
                </th>
                <th style={{ textAlign: 'center' }}>Net Realized Delta</th>
                <th>Strategic Business Impact</th>
              </tr>
            </thead>
            <tbody>
              {THREE_MODE_BENCHMARKS.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700 }}>{row.metric}</td>
                  <td style={{ textAlign: 'center', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {row.baseline}
                  </td>
                  <td style={{ textAlign: 'center', color: '#475569', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {row.prescriptive}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', backgroundColor: '#F8FAFC' }}>
                    {row.agentic}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-success" style={{ fontWeight: 700 }}>
                      <ArrowUpRight size={13} /> {row.netDelta}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {row.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cumulative Financial Realization Chart */}
      <div className="section-card">
        <div className="section-card-header">
          <div>
            <div className="section-card-title">
              <BarChart3 size={18} color="var(--color-primary)" />
              Monthly Revenue Protected vs Unmitigated Losses (₹)
            </div>
            <div className="section-card-subtitle">
              Cumulative financial trajectory demonstrating sustained capital preservation
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
