import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './layouts/DashboardLayout';

// Page Imports
import ExecutiveOverview from './pages/ExecutiveOverview';
import DemandIntelligence from './pages/DemandIntelligence';
import RiskCentre from './pages/RiskCentre';
import InventoryNetwork from './pages/InventoryNetwork';
import AIDecisionCentre from './pages/AIDecisionCentre';
import DecisionRippleSimulator from './pages/DecisionRippleSimulator';
import PromotionGuardian from './pages/PromotionGuardian';
import HiddenDemandDetector from './pages/HiddenDemandDetector';
import ImpactPerformance from './pages/ImpactPerformance';
import DecisionHistory from './pages/DecisionHistory';
import WhatsAppAssistant from './pages/WhatsAppAssistant';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<ExecutiveOverview />} />
            <Route path="overview" element={<ExecutiveOverview />} />
            <Route path="demand" element={<DemandIntelligence />} />
            <Route path="risks" element={<RiskCentre />} />
            <Route path="network" element={<InventoryNetwork />} />
            <Route path="decisions" element={<AIDecisionCentre />} />
            <Route path="simulator" element={<DecisionRippleSimulator />} />
            <Route path="whatsapp" element={<WhatsAppAssistant />} />
            <Route path="promotions" element={<PromotionGuardian />} />
            <Route path="hidden-demand" element={<HiddenDemandDetector />} />
            <Route path="impact" element={<ImpactPerformance />} />
            <Route path="history" element={<DecisionHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
