import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './layouts/DashboardLayout';

// 6 Consolidated Primary Modules
import ExecutiveOverview from './pages/ExecutiveOverview';
import DemandIntelligence from './pages/DemandIntelligence';
import RiskCentre from './pages/RiskCentre';
import InventoryNetwork from './pages/InventoryNetwork';
import AIDecisionCentre from './pages/AIDecisionCentre';
import ImpactPerformance from './pages/ImpactPerformance';

// Direct Fallback Pages for Deep Linking
import DecisionRippleSimulator from './pages/DecisionRippleSimulator';
import PromotionGuardian from './pages/PromotionGuardian';
import HiddenDemandDetector from './pages/HiddenDemandDetector';
import DecisionHistory from './pages/DecisionHistory';
import WhatsAppAssistant from './pages/WhatsAppAssistant';

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
            <Route path="hidden-demand" element={<Navigate to="/demand?tab=hidden-demand" replace />} />

            {/* Primary Module 3: Risk & Alerts (with tabs for stockout, overstock, supplier, promotion guardian, critical) */}
            <Route path="risks" element={<RiskCentre />} />
            <Route path="promotions" element={<Navigate to="/risks?tab=promotions" replace />} />

            {/* Primary Module 4: Inventory Network */}
            <Route path="inventory" element={<InventoryNetwork />} />
            <Route path="network" element={<InventoryNetwork />} />

            {/* Primary Module 5: AI Decision Centre (with tabs for recommendations, approvals, simulator, history, execution) */}
            <Route path="decisions" element={<AIDecisionCentre />} />
            <Route path="simulator" element={<Navigate to="/decisions?tab=simulation" replace />} />
            <Route path="history" element={<Navigate to="/decisions?tab=history" replace />} />

            {/* Primary Module 6: Impact & Performance */}
            <Route path="performance" element={<ImpactPerformance />} />
            <Route path="impact" element={<ImpactPerformance />} />

            {/* Global Assistant Route */}
            <Route path="whatsapp" element={<WhatsAppAssistant />} />

            {/* Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
