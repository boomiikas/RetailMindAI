# RetailMind AI: Explainable, Adaptive Multi-Agent Retail Decision Intelligence Platform

RetailMind AI is an enterprise-grade retail supply-chain decision intelligence backend built for multi-store retail networks. It moves beyond passive demand forecasting into active, prescriptive, and agentic decision intelligence.

The platform continuously observes retail operations, forecasts granular demand distributions (P10, P50, P90), analyzes supply-chain ripple effects via directed dependency graphs, evaluates multi-action interventions via Mixed-Integer Linear Programming (MILP), obtains human approval through WhatsApp, executes logistics actions, and **dynamically replans in real time when operating conditions change**.

---

## Key Features

1. **Quantile Demand Forecasting & Uncertainty**:
   - `HistGradientBoostingRegressor` with native quantile loss for P10, P50, and P90 demand projections.
   - Accounts for **stockout-censored sales** to avoid underestimating true latent demand.
   - Evaluated chronologically (Months 1–9 Train, 10–11 Validation, 12 Test) preventing temporal leakage ($R^2 = 0.920$, WAPE = $10.46\%$).
   - Feature attribution via SHAP TreeExplainer.

2. **Supply-Chain Ripple Effect DAG (NetworkX)**:
   - Directed operational dependency graph linking Suppliers, Stores, Products, Inventory, Demand, Revenue, and Net Profit.
   - Mathematical downstream cascading impact traversal (lost margin, holding liabilities, markdown risks).
   - Formatted for React graph/network component rendering.

3. **Risk-Aware Optimization Engine (Pyomo + HiGHS)**:
   - Mixed-Integer Linear Programming (MILP) maximizing expected net profit across 6 business actions:
     1. `REPLENISH_SUPPLIER`
     2. `INTER_STORE_TRANSFER`
     3. `ALLOCATION_CHANGE`
     4. `APPLY_MARKDOWN`
     5. `PROMOTION_ADJUST`
     6. `NO_ACTION`
   - Feasibility constraints: source store safety stock protection, supplier batch capacity (MOQ/MaxOQ), route transport costs, and budget limits.

4. **What-If Digital Twin (SimPy + NumPy)**:
   - Discrete-event simulation comparing alternative strategies under identical starting conditions without modifying live inventory records.

5. **LangGraph Multi-Agent Orchestration**:
   - 7 specialized agents: Monitoring, Impact Analysis, Decision Optimization, Store Manager, Execution, Dynamic Replanning, and Learning.
   - Typed state machine with persistent checkpointing.
   - **Groq Cloud API integration** (`openai/gpt-oss-120b`) for rapid natural-language synthesis without Ollama fallback.

6. **WhatsApp Store Manager Assistant**:
   - Meta WhatsApp Cloud API integration + Local Mock Adapter for offline development.
   - Interactive button approvals with strict idempotency and version authorization.
   - Answers natural-language inventory questions using live database queries.

7. **Dynamic Replanning Engine**:
   - Continuous pre-dispatch validation.
   - Automatically detects post-approval disruptions (e.g. Coimbatore local demand spike), pauses unexecuted transfers, re-optimizes, produces Version 2, and requests renewed manager approval.

8. **Clean Architecture & Separation of Concerns**:
   - PostgreSQL 16+ as the single source of truth across 27 relational tables.
   - Clear inventory invariants: $\text{available} = \text{physical} - \text{reserved}$.
   - Over 25 documented REST APIs with Pydantic v2 schemas and real-time WebSocket `/ws/dashboard`.

---

## Quickstart & Local Execution

### 1. Setup Environment
```bash
# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Generate Synthetic Dataset & Seed Database
```bash
# Generates 365 days of sales across 5 Tamil Nadu stores (109,500 records)
python -m backend.app.data_generation.generate_retail_data

# Validate dataset integrity & invariants
python -m backend.app.data_generation.validate_dataset

# Ingest records into database
python -m backend.app.data_generation.import_to_postgres
```

### 3. Train Demand Forecasting Models
```bash
python -m backend.ml.training.train_forecasting
```

### 4. Start the FastAPI Application
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- WebSocket Stream: `ws://localhost:8000/ws/dashboard`

### 5. Run the Test Suite
```bash
pytest backend/tests/ -v
```
All 13 automated tests pass, verifying the complete operational lifecycle from risk detection to dynamic replanning.

---

## Documentation

- [System Architecture Blueprint](docs/architecture.md)
- [API Contracts for Frontend Integration](docs/api-contracts.md)
- [Synthetic Data Dictionary](docs/data-dictionary.md)
- [Multi-Agent Workflows & LangGraph](docs/agent-workflows.md)
- [Local Development Setup Guide](docs/setup-guide.md)
