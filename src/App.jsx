import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './layouts/DashboardLayout';

// 6 Consolidated Primary Modules
import ExecutiveOverview from './pages/ExecutiveOverview';
import DemandIntelligence from './pages/DemandIntelligence';
import RiskCentre from './pages/RiskCentre';
import InventoryNetwork from './pages/InventoryNetwork';
import AIDecisionCentre from './pages/AIDecisionCentre';
import ImpactPerformance from './pages/ImpactPerformance';


function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            {/* Primary Module 1: Executive Overview */}
            <Route index element={<ExecutiveOverview />} />
            <Route path="overview" element={<ExecutiveOverview />} />

            {/* Primary Module 2: Demand Intelligence (with tabs for forecasting, drivers, hidden demand, SKU analysis) */}
            <Route path="demand" element={<DemandIntelligence />} />
            <Route path="hidden-demand" element={<Navigate to="/demand?tab=hidden" replace />} />
            <Route path="demand/:section" element={<DemandSectionRedirect />} />

            {/* Primary Module 3: Risk & Alerts (with tabs for stockout, overstock, supplier, promotion guardian, critical) */}
            <Route path="risks" element={<RiskCentre />} />
            <Route path="promotions" element={<Navigate to="/risks?tab=promotions" replace />} />
            <Route path="risks/:section" element={<RiskSectionRedirect />} />

            {/* Primary Module 4: Inventory Network */}
            <Route path="inventory" element={<InventoryNetwork />} />
            <Route path="network" element={<InventoryNetwork />} />

            {/* Primary Module 5: AI Decision Centre (with tabs for recommendations, approvals, simulator, history, execution) */}
            <Route path="decisions" element={<AIDecisionCentre />} />
            <Route path="simulator" element={<Navigate to="/decisions?tab=simulation" replace />} />
            <Route path="history" element={<Navigate to="/decisions?tab=history" replace />} />
            <Route path="decisions/:section" element={<DecisionSectionRedirect />} />

            {/* Primary Module 6: Impact & Performance */}
            <Route path="performance" element={<ImpactPerformance />} />
            <Route path="impact" element={<ImpactPerformance />} />

            {/* Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

function DemandSectionRedirect() {
  const { section } = useParams();
  const tab = ({ forecasting: 'forecasting', drivers: 'drivers', 'hidden-demand': 'hidden', hidden: 'hidden', sku: 'sku', 'sku-analysis': 'sku' })[section] || 'forecasting';
  return <Navigate to={`/demand?tab=${tab}`} replace />;
}

function RiskSectionRedirect() {
  const { section } = useParams();
  const tab = ({ all: 'all', stockout: 'stockout', overstock: 'overstock', suppliers: 'supplier', supplier: 'supplier', promotions: 'promotions', critical: 'critical' })[section] || 'all';
  return <Navigate to={`/risks?tab=${tab}`} replace />;
}

function DecisionSectionRedirect() {
  const { section } = useParams();
  const tab = ({ recommendations: 'recommendations', approvals: 'approvals', simulation: 'simulation', history: 'history', execution: 'execution' })[section] || 'recommendations';
  return <Navigate to={`/decisions?tab=${tab}`} replace />;
}

export default App;
