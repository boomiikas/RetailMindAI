# RetailMind AI: Explainable, Adaptive Multi-Agent Retail Decision Intelligence Platform

RetailMind AI is an enterprise-grade, agentic retail supply-chain decision intelligence platform built for multi-store supermarket networks across Tamil Nadu (**Chennai, Coimbatore, Madurai, Tiruppur, Salem**).

The platform bridges predictive analytics and autonomous execution. Rather than stopping at passive forecasting, RetailMind AI observes multi-store inventory, predicts granular quantile demand distributions ($P_{10}, P_{50}, P_{90}$), diagnoses supply-chain ripple effects across directed operational graphs, formulates and solves Mixed-Integer Linear Programs (MILP) to recommend the most profitable business interventions, seeks store manager approval via WhatsApp interactive messages, executes approved logistics actions, and **dynamically replans in real time when operating conditions change**.

---

## 1. Simplified System Architecture

RetailMind AI uses a **two-layer decoupled architecture**:
1. **Deterministic Operational Core (Python 3.13 + Math + SQL)**: Handles 100% of telemetry, risk detection, forecasting, graph cascading, MILP optimization, ledger transactions, replanning, and KPI reporting. Zero LLM involvement for mission-critical calculations.
2. **Cognitive Agent Layer (Max 2 LLM Agents)**:
   - **`Retail Intelligence Agent`**: Unified LangGraph + Groq LLM brain handling Natural Language Understanding (NLU), analytical tool routing, grounded context retrieval, and decision/SHAP explanation.
   - **`Decision Communication Agent`**: Specialized in store manager interaction over WhatsApp / Telegram, converting decision snapshots into interactive proposals and explaining revised plans ($v_1 \to v_2$).

```mermaid
flowchart TD
    subgraph ClientLayer ["Client & Interaction Layer"]
        UI["React 18 + Vite Dashboard\n(Port 3000)"]
        WA["WhatsApp / Telegram (Managers)"]
    end

    subgraph AgentLayer ["Cognitive Agent Layer (Max 2 LLM Agents)"]
        RIA["Retail Intelligence Agent\n(NLU, Analytical Tool Calling, SHAP & Optimization Synthesis)"]
        DCA["Decision Communication Agent\n(Proposal Messaging, Manager Clarification & Feedback)"]
    end

    subgraph ServiceLayer ["Deterministic Operational Core (Python 3.13)"]
        MON["Risk & Inventory Service\n(Threshold Scans, Stockout/Overstock Alerts)"]
        PRED["Dual-Mode Predictive Engine\n(Statistical SDOWF Baseline & HGB Quantiles)"]
        RIP["Ripple Intelligence Service\n(NetworkX DAG Cascading Loss Engine)"]
        OPT["Prescriptive Optimizer\n(Pyomo + HiGHS MILP Solver)"]
        REP["Dynamic Replanning Engine\n(Pre-dispatch Invariant Audit, V1/V2 Versioning)"]
        EXEC["Execution & Inventory Ledger\n(ACID Stock Reservations, POs, Transfers)"]
        PERF["KPI & Outcome Service\n(Expected vs Actuals, Operating Modes Comparison)"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        DB[("Supabase Cloud PostgreSQL\n(27 Relational Tables, Strict FKs, Ledger)")]
    end

    UI <-->|REST APIs & WebSockets| RIA
    UI <-->|Direct CRUD / Stats| ServiceLayer
    WA <-->|Webhooks / Buttons| DCA
    DCA <-->|Direct Approval Validation| EXEC
    RIA <-->|Deterministic Tool Calls| ServiceLayer
    ServiceLayer <-->|Asyncpg / SQLAlchemy 2.0| DB
```

---

## 2. Technology Stack

| Layer | Component | Technology / Implementation |
|---|---|---|
| **Backend & API** | Web Framework | **FastAPI** (Python 3.13) with async lifespan |
| | ORM & Validation | **SQLAlchemy 2.0 Async** + **Pydantic v2** |
| | Connection Pool | **AsyncAdaptedQueuePool** with auto-recycle and pre-ping |
| | Real-Time Streaming | **FastAPI WebSockets** (`/ws/dashboard`) |
| **Database** | Database Engine | **Supabase Cloud PostgreSQL 16+** |
| | Data Tables | **27 Relational Tables** with strict foreign keys & inventory invariants |
| **Forecasting Engine** | Dual-Mode Pluggable | **Mode A (Default)**: Lightweight Seasonal DoW + Festival (SDOWF) with empirical residual uncertainty<br>**Mode B (Precision)**: **HistGradientBoostingRegressor** with Quantile Loss ($P_{10}, P_{50}, P_{90}$) |
| | Explainability | **SHAP** TreeExplainer + Feature Attribution |
| **Optimization & Graph** | Ripple Effects | **NetworkX** (Directed operational dependency graph) |
| | Mathematical Solver | **Pyomo** + **HiGHS** (`appsi_highs` MILP solver) |
| | Digital Twin | **SimPy** + **NumPy** discrete-event simulator |
| **Cognitive Agents** | Framework | **LangGraph** StateGraph |
| | Agents (Max 2) | 1. **Retail Intelligence Agent** (Copilot & Reasoning)<br>2. **Decision Communication Agent** (WhatsApp Dialogue & Proposals) |
| | LLM Provider | **Groq Cloud LPU** (`openai/gpt-oss-120b`, zero Ollama dependency) |
| **Human Approval** | Messaging Channel | **Meta WhatsApp Cloud API** + **Offline Mock Adapter** |
| **Frontend** | Client Application | **React 18**, **Vite**, **Lucide Icons**, **Chart.js** |
| | AI Copilot | Floating, real-time grounded retail assistant with strict guardrails |

---

## 3. Key Capabilities

### 3.1. Dual-Mode Pluggable Demand Forecasting
- **Mode A: Lightweight Seasonal Day-of-Week + Festival (SDOWF) [Default]**:
  - Zero binary disk footprint (0 KB), instant computation (<1ms).
  - Captures 14-day rolling baseline, weekly shopping patterns (Friday evening through Sunday peaks), and Tamil Nadu festival surges (Pongal in mid-Jan, Deepavali in late Oct/Nov, Tamil New Year in mid-Apr).
  - Produces $P_{10}, P_{50}, P_{90}$ quantiles via empirical residual uncertainty.
- **Mode B: HistGradientBoosting Quantile Regression [Precision Option]**:
  - Trained on **160,600 sales records** across 88 SKUs, 5 stores, and 12 months.
  - Achieves Validation $R^2 = 0.918$, $\text{WAPE} = 10.58\%$, $\text{MAE} = 5.81$.
- **Model Comparison API**: `GET /api/v1/forecasts/compare-models` returns empirical comparative metrics across SMA-7, WMA-7, SES, SDOWF, and HistGradientBoosting.

### 3.2. Ripple Effect Graph Intelligence (NetworkX)
- Models supply chains as directed operational graphs:
  $$\text{Supplier} \longrightarrow \text{Product} \longrightarrow \text{Inventory Node} \longrightarrow \text{Store} \longrightarrow \text{Revenue} \longrightarrow \text{Net Profit}$$
- Automatically tracks downstream disruption cascades (e.g. supplier delivery delay $\to$ inventory burn $\to$ store stockout $\to$ lost margin).

### 3.3. Prescriptive MILP Optimization (Pyomo + HiGHS)
- Evaluates 6 actionable business interventions:
  1. `REPLENISH_SUPPLIER`: Expedited or standard purchase order.
  2. `INTER_STORE_TRANSFER`: Rebalance surplus from neighboring store (e.g. Coimbatore $\to$ Salem).
  3. `ALLOCATION_CHANGE`: Redirect incoming cross-dock shipment.
  4. `APPLY_MARKDOWN`: 10–30% discount to clear overstocked inventory before expiry.
  5. `PROMOTION_ADJUST`: Suppress promotion banners when inventory is scarce.
  6. `NO_ACTION`: Maintain baseline schedule when intervention costs exceed expected benefit.
- Mathematically guarantees that source store safety stock is **never violated**.

### 3.4. WhatsApp Store Manager Assistant & Idempotent Approvals
- Interactive button messages sent to store managers (`Option 1: Transfer`, `Option 2: Supplier Order`, `Option 3: Markdown`, `Reject`).
- State-machine verification:
  - Cryptographic idempotency keys: duplicate button clicks return cached confirmation.
  - Version-lock: Version 1 approval **cannot** authorize an altered Version 2 order.

### 3.5. Dynamic Replanning Engine
- Continuously re-validates operating assumptions before logistics dispatch.
- **Example Scenario**: Salem to Coimbatore transfer approved ($V_1$). An unexpected demand spike (+45 units) hits Coimbatore before truck dispatch. The engine automatically pauses $V_1$, releases stock reservations, re-optimizes with Pyomo, creates Version 2 ($V_2$), and requests fresh manager approval.

### 3.6. >90% LLM Token & Cost Reduction
- Zero LLM calls in the core operational loop: telemetry checks, risk scans, DAG cascading, Pyomo optimization, WhatsApp button clicks, stock reservations, order execution, and replanning audits incur **\$0.00 in LLM costs**.
- LLM calls occur strictly when human reasoning, conversational NLU, or plain-language synthesis is required (~150–250 tokens per event).

---

## 4. Local Setup & Execution Guide

### Prerequisites
- **Python 3.11+** (Python 3.13.5 tested)
- **Node.js 18+** and **npm**
- **Git**

---

### Step 1: Configure Environment

Ensure your `.env` file at the project root contains your Supabase PostgreSQL credentials and Groq API key:

```ini
APP_ENV=development
DEBUG=true
PORT=8000
HOST=0.0.0.0

# Database (Supabase Cloud PostgreSQL)
DATABASE_URL=postgresql+asyncpg://postgres:supa%40123%40supa@db.ocbrjixzawtvwrlwbrye.supabase.co:5432/postgres
SYNC_DATABASE_URL=postgresql://postgres:supa%40123%40supa@db.ocbrjixzawtvwrlwbrye.supabase.co:5432/postgres
DATABASE_ECHO=false

# Groq Cloud API
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
LLM_PROVIDER=groq
LLM_TEMPERATURE=0.1

# WhatsApp Meta Cloud API
WHATSAPP_TOKEN=EAATCdZA8BNX4BS2xC521Gz522EVrWlssCE19iBZARTy1Yx2hZAFZCQbWQlIOh68BIosDZBVHQiAzgcwEzoibacGAOKbryJegRZBJVtdXJ1wDZCKlNUoa8rTsPzjyec3ccXSQZB6KJvqqFuG1EmqZBqZBjbxnwD0J9YYL9cN8QmZA2X1ZCTGzJgZBZBmUneYFOhIC394kKkSrMb7LbQfqPoZBALX9kvh4GZBhCA9aY8TcPGZCc9NZBPWexXmVNXqKouvY7l6HUYlFynqLCMcGbONK9Bq6CRKUQo9AZDZD
WHATSAPP_PHONE_NUMBER_ID=mock_phone_id
WHATSAPP_VERIFY_TOKEN=retailmind_meta_webhook_verify_secret
WHATSAPP_API_VERSION=v21.0
USE_MOCK_WHATSAPP=true

# Security & CORS
SECRET_KEY=dev-retailmind-super-secret-key-32-chars-long!
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

---

### Step 2: Install Dependencies

```bash
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
npm install
```

---

### Step 3: Run the Backend Server

Start FastAPI on port `8000`:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **WebSocket Feed**: `ws://localhost:8000/ws/dashboard`

---

### Step 4: Run the Frontend Dashboard

In a separate terminal window:

```bash
npm run dev
```

The React + Vite application will open at:
**[http://localhost:3000](http://localhost:3000)**

---

## 5. Automated Verification Tests (18/18 Passing)

The test suite validates the full stack: REST APIs, Groq LLM integration, and all 8 end-to-end retail operational scenarios against Supabase PostgreSQL:

```bash
.\.venv\Scripts\python -m pytest backend/tests/test_api_endpoints.py backend/tests/test_groq_integration.py backend/tests/test_retailmind_scenarios.py -v
```

### Full Test Suite Summary

| Test File | Scenario / Feature Tested | Result |
|---|---|:---:|
| `test_api_endpoints.py` | Health check endpoint (`/health`) | **PASSED** |
| `test_api_endpoints.py` | Executive dashboard overview (`/api/v1/dashboard/overview`) | **PASSED** |
| `test_api_endpoints.py` | Multi-store inventory list (`/api/v1/inventory`) | **PASSED** |
| `test_api_endpoints.py` | Quantile demand forecast (`/api/v1/forecasts`) | **PASSED** |
| `test_api_endpoints.py` | Model comparison benchmark (`/api/v1/forecasts/compare-models`) | **PASSED** |
| `test_api_endpoints.py` | Retail Copilot Chatbot (`/api/v1/chat`) | **PASSED** |
| `test_api_endpoints.py` | WhatsApp query simulation (`/api/v1/whatsapp/simulate-query`) | **PASSED** |
| `test_groq_integration.py` | Groq direct API completion (`openai/gpt-oss-120b`) | **PASSED** |
| `test_groq_integration.py` | Groq decision explanation synthesis with SHAP weights | **PASSED** |
| `test_groq_integration.py` | Groq store manager conversational query answering | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 1: Normal Stockout $\to$ Inter-Store Transfer | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 2: Overstock Detection $\to$ Markdown Strategy | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 3: Supplier Delay $\to$ Downstream Ripple Analysis | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 4: WhatsApp Store Manager Approval Workflow | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 5: Dynamic Replanning on Pre-Dispatch Spike | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 6: Rejection of Duplicate / Idempotent Approvals | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 7: Failed Execution with Error Handling | **PASSED** |
| `test_retailmind_scenarios.py` | Scenario 8: Baseline vs AI Prescriptive vs AI Agentic KPIs | **PASSED** |

---

## 6. Real-Time Copilot Chatbot

The dashboard includes an AI Copilot grounded in live PostgreSQL data:
- Uses Groq Cloud LPU (`openai/gpt-oss-120b`) for rapid responses.
- **Strict Guardrail Policy**:
  - Answers questions related to: inventory levels, stockout risks, quantile demand, store health, supplier lead times, and pending decisions.
  - Politely declines off-topic prompts to preserve enterprise focus.
