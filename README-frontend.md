# RetailPulse AI — Autonomous Retail Decision Intelligence Platform

> **"Don't just predict what will happen. Decide what the business should do next."**

RetailPulse AI is an enterprise-grade Autonomous Retail Decision Intelligence Platform designed for supermarket chains operating across multiple stores. Built for high-stakes operational decisioning, RetailPulse AI shifts retail management from passive, reactive sales forecasting to high-conviction, autonomous action recommendation, consequence simulation, and cross-store inventory redistribution.

---

## 🚀 Key Signature Capabilities

1. **Decision Ripple Simulator (Signature Feature)**:
   - Understand the causal business consequences of retail actions *before* committing capital.
   - Dynamically calculates the chain reaction:
     $$\text{Action} \rightarrow \text{Demand Shift} \rightarrow \text{Inventory Depletion} \rightarrow \text{Replenishment Lead Time} \rightarrow \text{Carrier Overhead} \rightarrow \text{Net Margin} \rightarrow \text{Customer Experience}$$
   - Compares strategic pathways (*Option A: Status Quo*, *Option B: Pre-allocate Stock*, *Option C: Moderate Discount*) and delivers an algorithmic verdict.

2. **Inventory Rescue Network (Lateral Transshipment Topology)**:
   - Interactive 5-node regional topology: **Coimbatore, Erode, Tiruppur, Salem, and Chennai**.
   - Automated routing that identifies overstocked buffer stores and executes inter-store stock transfers in under 4 hours, resolving critical deficits without waiting days for external distributor delays.
   - One-click **"Optimize Network Inventory"** algorithmic redistribution engine.

3. **Hidden Demand Detector (Stockout Reconstruction)**:
   - Solves the fundamental blindspot of traditional ERPs: when a product stocks out, recorded cashier sales drop to 0, corrupting future demand forecasts.
   - Reconstructs true consumer demand and tracks shopper walkout vs substitute acceptance rates.

4. **Promotion Intelligence Guardian**:
   - Pre-evaluates marketing campaigns against backroom inventory capacity and supplier re-order lead times.
   - Flags discount-induced stockouts before launch, allowing managers to calibrate discounts or pre-allocate stock.

5. **AI Decision Centre & Transparent Explainability**:
   - Actionable recommendation cards with multi-signal reasoning (*Why this action?*, *Expected Impact*, *Evaluated Alternatives*).
   - Full human-in-the-loop approval, rejection with categorized feedback, and automated append to the audit history.

---

## 🛠 Technology Stack

- **Framework**: React 18 with Vite
- **Routing**: React Router v6 (`react-router-dom`)
- **Visualizations & Charts**: Recharts
- **Iconography**: Lucide React
- **Styling Architecture**: Custom CSS Design System using CSS Variables (No Tailwind CSS)
- **State Management**: React Context (`AppContext.jsx`) with reactive notifications and cross-component sync
- **API Architecture**: Separate Service Layer (`src/services/api.js`) ready for Axios backend integration

---

## 🎨 Enterprise Design System Tokens

| Token | Value | Purpose |
|---|---|---|
| `--color-primary` | `#2563EB` | Core Brand Blue |
| `--color-primary-hover` | `#1D4ED8` | Interactive Hover |
| `--color-dark-navy` | `#101828` | Headings & Brand Accents |
| `--color-bg` | `#F5F7FB` | Soft Dashboard Canvas |
| `--color-surface` | `#FFFFFF` | Enterprise Data Cards |
| `--color-border` | `#E5E7EB` | Subtle Visual Dividers |
| `--color-success` | `#16A34A` | High Health & Protected Profit |
| `--color-warning` | `#F59E0B` | Overstock & Moderate Vulnerability |
| `--color-danger` | `#DC2626` | Imminent Stockout & Critical Risk |
| `--color-purple` | `#7C3AED` | Predictive Trajectories & Model Estimates |

---

## 📂 Project Architecture

```
tcs/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── context/
    │   └── AppContext.jsx          # Global Store filter, Date range, Notifications, Audit sync
    ├── services/
    │   └── api.js                  # Data abstraction layer with Axios client
    ├── data/
    │   └── mockData.js             # Realistic enterprise datasets for 5 hubs & SKUs
    ├── layouts/
    │   ├── DashboardLayout.jsx     # Master layout
    │   ├── Sidebar.jsx             # 10 navigation items + Settings + Help + Profile
    │   └── TopNavbar.jsx           # Breadcrumb, Search, Store filter, Date picker, Notifications
    ├── components/
    │   ├── common/
    │   │   ├── KPICard.jsx
    │   │   ├── RiskBadge.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── Modal.jsx
    │   │   └── NotificationPanel.jsx
    └── pages/
        ├── ExecutiveOverview.jsx       # Page 1: High-level KPIs, Alerts, Donut & Bar charts
        ├── DemandIntelligence.jsx      # Page 2: Forecast curves, weather/event indicators, classifications
        ├── RiskCentre.jsx              # Page 3: Vulnerability radar, scores /100, financial loss tags
        ├── InventoryNetwork.jsx        # Page 4: Interactive network graph, transfers, optimization plan
        ├── AIDecisionCentre.jsx        # Page 5: Action cards, approval/rejection modal, alternatives
        ├── DecisionRippleSimulator.jsx # Page 6: SIGNATURE interactive what-if consequence engine
        ├── PromotionGuardian.jsx       # Page 7: Operational safety audits, discount calibration
        ├── HiddenDemandDetector.jsx    # Page 8: Model-estimated unmet demand & substitution analysis
        ├── ImpactPerformance.jsx       # Page 9: Baseline vs AI empirical benchmark & savings
        └── DecisionHistory.jsx         # Page 10: Searchable immutable audit trail & drill-down files
```

---

## 🏃‍♂️ How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000` (or the port indicated in the terminal).

3. **Build for Production**:
   ```bash
   npm run build
   ```
   Generates an optimized bundle in the `dist/` directory.

---

## 💡 Navigating the Application

- **Store Filtering**: Use the store dropdown in the top navbar or the interactive pins on the **Inventory Network** page to switch between *All Stores, Coimbatore, Erode, Tiruppur, Salem, and Chennai*.
- **Interactive Simulator**: Open **Decision Ripple Simulator** (`/simulator`), adjust the discount slider or select different scenarios to watch the causal ripple pipeline and financial metrics recalculate in real-time.
- **Approving Decisions**: In **AI Decision Centre** (`/decisions`), click "Approve" on any recommendation. Notice how the card status changes, an unread notification is triggered in the bell drawer, and the action is immediately recorded in **Decision History** (`/history`).
- **Lateral Transshipment**: In **Inventory Network** (`/network`), click **"Optimize Network Inventory"** to trigger the algorithmic redistribution solver and review the resulting inter-store freight plan.
