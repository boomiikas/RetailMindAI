# RetailMind AI: Explainable, Adaptive Multi-Agent Retail Decision Intelligence Platform

RetailMind AI is an enterprise-grade, agentic retail supply-chain decision intelligence platform built for multi-store retail networks across Tamil Nadu (Chennai, Coimbatore, Madurai, Tiruppur, Salem).

The platform bridges predictive analytics and autonomous execution. Rather than stopping at passive forecasting, RetailMind AI observes multi-store inventory, predicts granular quantile demand distributions ($P_{10}, P_{50}, P_{90}$), diagnoses supply-chain ripple effects across directed operational graphs, formulates and solves Mixed-Integer Linear Programs (MILP) to recommend the most profitable business interventions, seeks store manager approval via WhatsApp interactive messages, executes approved logistics actions, and **dynamically replans in real time when operating conditions change**.

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph DataFoundation ["Data Foundation & Ingestion"]
        DB[("PostgreSQL / SQLite\n27 Relational Tables")]
        HIST["109,500 Historical Sales\n5 Stores | 60 SKUs | 8 Suppliers"]
        HIST --> DB
    end

    subgraph IntelligenceLayer ["Machine Learning & Optimization Engines"]
        QML["HistGradientBoosting Quantile Forecasting\nP10 / P50 / P90 + SHAP Explanations"]
        DAG["NetworkX Operational Dependency DAG\nSupply-Chain Ripple Effect Engine"]
        OPT["Pyomo + HiGHS Optimization Engine\nMILP over 6 Business Actions"]
        TWIN["SimPy Discrete-Event Digital Twin\nWhat-If Counterfactual Simulator"]
    end

    subgraph MultiAgentCore ["LangGraph Multi-Agent Orchestration"]
        AG1["1. Monitoring Agent"]
        AG2["2. Impact Analysis Agent"]
        AG3["3. Decision Optimization Agent"]
        AG4["4. Store Manager Agent"]
        AG5["5. Execution Agent"]
        AG6["6. Dynamic Replanning Agent"]
        AG7["7. Learning & Feedback Agent"]
    end

    subgraph HumanInTheLoop ["Store Manager Interface"]
        WA["Meta WhatsApp Cloud API\nInteractive Button Approvals"]
        MOCK_WA["Offline WhatsApp Mock Adapter"]
    end

    subgraph FrontendCopilot ["User Experience & Copilot"]
        VITE["React 18 + Vite Dashboard\nReal-time Metrics & Analytics"]
        CHAT["Groq-Powered AI Copilot\nStrict Retail Domain Guardrails"]
        GROQ["Groq Cloud LPU API\nopenai/gpt-oss-120b"]
    end

    DB --> QML
    QML --> AG1
    AG1 --> AG2
    AG2 --> DAG
    DAG --> AG3
    AG3 --> OPT
    OPT --> TWIN
    AG3 --> AG4
    AG4 --> WA
    AG4 --> MOCK_WA
    WA --> AG5
    AG5 --> DB
    AG5 --> AG6
    AG6 -.->|"Post-Approval Disruption Detected"| AG3
    DB --> AG7

    VITE <-->|"REST APIs & WebSockets"| DB
    CHAT <-->|"POST /api/v1/chat"| GROQ
    GROQ <-->|"Grounded Context"| DB
```

---

## 2. Technology Stack

| Layer | Component | Technology / Implementation |
|---|---|---|
| **Backend & API** | Web Framework | **FastAPI** (Python 3.13) with async lifespan |
| | ORM & Validation | **SQLAlchemy 2.0 Async** + **Pydantic v2** |
| | Real-Time Streaming | **FastAPI WebSockets** (`/ws/dashboard`) |
| **Database** | Database Engine | **PostgreSQL 16+** (Docker Compose) / **SQLite Async** |
| | Data Tables | **27 Relational Tables** with strict inventory invariants |
| **Machine Learning** | Demand Forecasting | **HistGradientBoostingRegressor** with Quantile Loss ($P_{10}, P_{50}, P_{90}$) |
| | Explainability | **SHAP** TreeExplainer (Feature attribution) |
| **Optimization & Graph** | Ripple Effects | **NetworkX** (Directed operational dependency graph) |
| | Mathematical Solver | **Pyomo** + **HiGHS** (`appsi_highs` MILP solver) |
| | Digital Twin | **SimPy** + **NumPy** discrete-event simulator |
| **Agent Orchestration** | Multi-Agent Core | **LangGraph** StateGraph with 7 specialized agents |
| | LLM Provider | **Groq Cloud LPU** (`openai/gpt-oss-120b`, zero Ollama dependency) |
| **Human Approval** | Messaging Channel | **Meta WhatsApp Cloud API** + **Local Mock Adapter** |
| **Frontend** | Client Application | **React 18**, **Vite**, **Lucide Icons**, **Chart.js** |
| | AI Copilot | Floating, real-time grounded retail assistant with strict guardrails |

---

## 3. Key Capabilities

### 3.1. Quantile Demand Forecasting & True Demand Reconstruction
- Addresses **stockout-censored sales**: unobserved demand during stockout periods is reconstructed prior to model training so true velocity is not underestimated.
- Trains $P_{10}$ (low downside), $P_{50}$ (median), and $P_{90}$ (peak surge) regressors with chronological splitting (Months 1–9 Train, Months 10–11 Validation, Month 12 Test) to eliminate temporal data leakage.
- Achieves $R^2 = 0.920$ and $\text{WAPE} = 10.46\%$ on the test horizon.

### 3.2. Ripple Effect Graph Intelligence (NetworkX)
- Models supply chains as directed operational graphs:
  $$\text{Supplier} \longrightarrow \text{Store} \longrightarrow \text{Inventory} \longrightarrow \text{Demand} \longrightarrow \text{Revenue} \longrightarrow \text{Net Margin}$$
- Computes downstream cascading financial liabilities: lost sales, stockout penalties, customer churn risk, holding costs, and supplier expediting fees.

### 3.3. Risk-Aware MILP Optimization (Pyomo + HiGHS)
- Evaluates 6 actionable business interventions:
  1. `REPLENISH_SUPPLIER`: Expedited or standard purchase order.
  2. `INTER_STORE_TRANSFER`: Rebalance surplus from neighboring store (e.g. Salem/Erode $\to$ Coimbatore).
  3. `ALLOCATION_CHANGE`: Redirect incoming cross-dock shipment.
  4. `APPLY_MARKDOWN`: 10–30% discount to clear overstocked inventory before expiry.
  5. `PROMOTION_ADJUST`: Shift promotional banners to suppress demand when inventory is scarce.
  6. `NO_ACTION`: Maintain baseline schedule when intervention costs exceed expected benefit.
- Enforces hard constraints: source store safety stock is **never violated**, supplier batch MOQ/MaxOQ, highway logistics costs, and budget limits.

### 3.4. WhatsApp Store Manager Assistant & Idempotent Approvals
- Interactive button messages sent to store managers (`Approve Transfer`, `Reject`, `Adjust Quantity`).
- State-machine verification:
  - Idempotent: duplicate button clicks return cached decision confirmation.
  - Expiry checks: decisions expire after configurable SLA (default 60 minutes).
  - Version-lock: Version 1 approval **cannot** authorize an altered Version 2 order.

### 3.5. Dynamic Replanning Engine
- Continuously re-validates operating assumptions before logistics dispatch.
- **Example Scenario**: Salem to Coimbatore transfer approved ($V_1$). A sudden rainstorm triggers a Coimbatore demand spike (+85%). The engine pauses the pending transfer, re-optimizes the network, generates Version 2 ($V_2$) with updated quantities, voids $V_1$, and requests fresh manager approval.

### 3.6. Groq-Powered AI Copilot with Strict Domain Guardrails
- Directly accessible from the bottom-right of the dashboard.
- Uses Groq Cloud LPU (`openai/gpt-oss-120b`) for lightning-fast sub-second responses.
- **Strict Guardrail Policy**:
  - Answers questions related to: inventory levels, stockout risks, quantile demand, store health, supplier lead times, and pending decisions.
  - Explicitly refuses off-topic queries (poetry, coding help, general knowledge, chit-chat) to maintain operational safety.

---

## 4. Local Setup & Execution Guide

### Prerequisites
- **Python 3.11+** (Python 3.13 tested)
- **Node.js 18+** and **npm**
- **Git**
- Optional: **Docker & Docker Compose** (for PostgreSQL 16 & Redis)

---

### Step 1: Clone and Configure Environment

```bash
# Navigate to the project root
cd d:/Project/tcs26

# Create and activate virtual environment
python -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS / Linux:
# source .venv/bin/activate
```

Verify your `.env` file at the root has your Groq API key and WhatsApp credentials configured:

```ini
APP_ENV=development
DEBUG=true
PORT=8000
HOST=0.0.0.0

# Database (Default uses SQLite async for zero-dependency local runs)
DATABASE_URL=sqlite+aiosqlite:///./retailmind.db
SYNC_DATABASE_URL=sqlite:///./retailmind.db
DATABASE_ECHO=false

# Groq Cloud API
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=openai/gpt-oss-120b
LLM_PROVIDER=groq
LLM_TEMPERATURE=0.1

# WhatsApp Meta Cloud API
WHATSAPP_TOKEN=EAATCdZA8BNX4BS2xC521Gz522EVrWlssCE19iBZARTy1Yx2hZAFZCQbWQlIOh68BIosDZBVHQiAzgcwEzoibacGAOKbryJegRZBJVtdXJ1wDZCKlNUoa8rTsPzjyec3ccXSQZB6KJvqqFuG1EmqZBqZBjbxnwD0J9YYL9cN8QmZA2X1ZCTGzJgZBZBmUneYFOhIC394kKkSrMb7LbQfqPoZBALX9kvh4GZBhCA9aY8TcPGZCc9NZBPWexXmVNXqKouvY7l6HUYlFynqLCMcGbONK9Bq6CRKUQo9AZDZD
WHATSAPP_PHONE_NUMBER_ID=8667754243
WHATSAPP_VERIFY_TOKEN=retailmind_meta_webhook_verify_secret
WHATSAPP_API_VERSION=v21.0
USE_MOCK_WHATSAPP=false

# Security & CORS
SECRET_KEY=dev-retailmind-super-secret-key-32-chars-long!
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

---

### Step 2: Install Dependencies

```bash
# Install Python backend dependencies
pip install -r requirements.txt

# Install Node frontend dependencies
npm install
```

---

### Step 3: Seed Synthetic Retail Data & Train ML Models

```bash
# 1. Generate 365 days of sales for 5 stores, 60 SKUs, 8 suppliers (109,500 sales rows)
python -m backend.app.data_generation.generate_retail_data

# 2. Validate data consistency and inventory invariants
python -m backend.app.data_generation.validate_dataset

# 3. Seed database tables
python -m backend.app.data_generation.import_to_postgres

# 4. Train HistGradientBoosting Quantile Regression models
python -m backend.ml.training.train_forecasting
```

---

### Step 4: Run the Backend Server

Start FastAPI with hot reload on port `8000`:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **WebSocket Feed**: `ws://localhost:8000/ws/dashboard`

---

### Step 5: Run the Frontend Dashboard

In a separate terminal window:

```bash
npm run dev
```

The React + Vite application will open at:
**[http://localhost:3000](http://localhost:3000)**

The frontend automatically proxies `/api` and `/ws` to the FastAPI backend running on port `8000`.

---

## 5. Running Automated Verification Tests

The platform contains a test suite covering REST APIs, end-to-end multi-agent retail scenarios, dynamic replanning, and Groq LLM integration:

```bash
# Run the entire test suite
.\.venv\Scripts\python -m pytest backend/tests/test_api_endpoints.py backend/tests/test_retailmind_scenarios.py backend/tests/test_groq_integration.py -v
```

### Test Suite Summary (16/16 Passed)

| Test Suite | Scenario / Feature Tested | Result |
|---|---|:---:|
| `test_api_endpoints.py` | Health Check endpoint (`/health`, `/api/v1/health`) | **PASSED** |
| `test_api_endpoints.py` | Executive Overview metrics (`/api/v1/dashboard/overview`) | **PASSED** |
| `test_api_endpoints.py` | Inventory list with invariants (`/api/v1/inventory`) | **PASSED** |
| `test_api_endpoints.py` | Quantile demand forecasts (`/api/v1/forecasts`) | **PASSED** |
| `test_api_endpoints.py` | WhatsApp query simulation (`/api/v1/whatsapp/simulate-query`) | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 1: Normal Stockout $\to$ Inter-Store Transfer | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 2: Severe Overstock $\to$ Markdown Strategy | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 3: Supplier Delay $\to$ Downstream Ripple Analysis | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 4: WhatsApp Store Manager Approval Workflow | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 5: Dynamic Replanning on Post-Approval Spike | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 6: Rejection of Expired / Duplicate Approvals | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 7: Failed Execution with Error Handling | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 8: Simulation vs Actual Performance Tracking | **PASSED** |
| `test_groq_integration.py` | Groq Cloud LPU Direct API Completion (`openai/gpt-oss-120b`) | **PASSED** |
| `test_groq_integration.py` | Groq Decision Explanation Synthesis with Financial Rationale | **PASSED** |
| `test_groq_integration.py` | Groq Natural-Language Store Manager Query Answering | **PASSED** |

---

## 6. Real-Time Copilot Chatbot & Guardrails

The dashboard includes a floating AI Copilot widget on every screen.

### Example Queries Supported

```
User: "Which products have critical stockout risks?"
Copilot: "Based on our latest Quantile ML forecasts, 4 SKUs are below safety stock:
1. Fresh Farm Milk 500ml at Coimbatore (18 units available vs safety stock of 60)
2. 1L Sunflower Cooking Oil at Salem (14 units available vs safety stock of 40)
..."

User: "What is tomorrow's milk demand forecast in Coimbatore?"
Copilot: "For Fresh Farm Milk 500ml in Coimbatore:
- P10 (Pessimistic): 85 units
- P50 (Expected): 115 units
- P90 (Peak Surge): 142 units
Recommended action: Transfer 80 units from Erode surplus."
```

### Strict Domain Guardrail Refusal

```
User: "Write a poem about the sunrise."
Copilot: "I am RetailMind AI Copilot, specialized strictly in retail operations,
supply-chain decision intelligence, inventory health, and multi-store demand forecasting.
Please ask a question related to store operations, stock levels, demand projections, or supply-chain actions."
```

---

## 7. PostgreSQL Docker Infrastructure (Optional)

To run RetailMind AI on local PostgreSQL instead of SQLite:

```bash
# Start PostgreSQL 16 and Redis containers
docker compose -f infrastructure/docker-compose.yml up -d

# Update .env:
# DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/retailmind
# SYNC_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/retailmind

# Ingest data into PostgreSQL
python -m backend.app.data_generation.import_to_postgres
```

---

## 8. Directory Structure

```
d:/Project/tcs26/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/      # 13 REST API endpoints (dashboard, chat, whatsapp, etc.)
│   │   ├── core/                  # Logging, error handlers, state contracts
│   │   ├── database/              # SQLAlchemy session, engine, initialization
│   │   ├── data_generation/       # Synthetic data generation and validation scripts
│   │   ├── models/                # 27 SQLAlchemy 2.0 async database models
│   │   ├── schemas/               # Pydantic v2 validation contracts
│   │   ├── services/
│   │   │   ├── agents/            # 7 LangGraph multi-agent modules
│   │   │   ├── llm/               # Groq Cloud API service (openai/gpt-oss-120b)
│   │   │   ├── optimization/      # Pyomo MILP optimization engine
│   │   │   ├── ripple/            # NetworkX cascading ripple effect graph
│   │   │   ├── simulation/        # SimPy discrete-event digital twin
│   │   │   ├── risk/              # Stockout & overstock detection
│   │   │   └── whatsapp/          # Meta WhatsApp Cloud API & Mock Adapter
│   │   └── websocket/             # Real-time WebSocket connection manager
│   ├── ml/
│   │   ├── models/                # HistGradientBoosting quantile model files (.joblib)
│   │   └── training/              # Training, evaluation & SHAP explainability scripts
│   └── tests/                     # 16 Pytest automated test scenarios
├── src/                           # React 18 + Vite frontend
│   ├── components/
│   │   ├── common/                # ChatbotWidget.jsx, KPI cards, tables
│   │   └── ...                    # Page-specific visual analytics
│   ├── context/                   # AppContext.jsx global state provider
│   ├── services/                  # api.js connected to FastAPI endpoints
│   └── styles/                    # Design tokens and responsive CSS
├── infrastructure/                # Docker compose for PostgreSQL 16 & Redis
├── .env                           # Local environment configuration
├── package.json                   # Frontend npm configuration
├── requirements.txt               # Backend Python dependencies
└── vite.config.js                 # Vite proxy configuration (/api & /ws -> 8000)
```

---

## 9. License

Developed for academic, research, and enterprise retail intelligence demonstration.
