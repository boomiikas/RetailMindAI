# RetailMind AI: Multi-Agent Workflows & LangGraph Orchestration

## 1. Multi-Agent Framework Overview

RetailMind AI implements an agentic architecture using **LangGraph** with a centralized, typed state machine. Rather than relying on unstructured LLM decision-making, the system enforces a strict boundary:
- **Deterministic Services**: All inventory checks, forecasts, NetworkX graph traversals, MILP optimization, and cost calculations are executed by deterministic Python engines.
- **Agent Intelligence**: Coordinate state transitions, formulate structured WhatsApp manager communications, explain tradeoffs, interpret natural-language queries, and trigger dynamic replanning.

---

## 2. The 7 Specialized Agents

### Agent 1: Monitoring Agent (`MonitoringAgent`)
- **Duty**: Continuously monitors sales velocity, inventory levels, supplier delivery delays, and external event calendars.
- **Triggers**: Detects critical stockout risks (`available_stock < safety_stock`), overstock situations (`days_of_supply > 15`), or supplier delivery delays.
- **Output**: Populates `detected_risk` and sets `disruption_type` in `AgentState`.

### Agent 2: Impact Analysis Agent (`ImpactAnalysisAgent`)
- **Duty**: Maps disruptions onto a NetworkX directed operational dependency graph.
- **Triggers**: Invoked whenever `disruption_type != "NORMAL"`.
- **Output**: Downstream node and edge trajectories, estimated lost sales units, gross profit exposure, holding cost liabilities, and structured explanations.

### Agent 3: Decision Optimization Agent (`DecisionOptimizationAgent`)
- **Duty**: Interfaces with the Pyomo MILP optimization engine and HiGHS solver.
- **Objective**: Evaluates 6 business actions (Transfer, Supplier Replenishment, Allocation Change, Markdown, Promotion, No Action) to maximize net profit.
- **Output**: Creates a persistent `DecisionRecord` and `DecisionVersion` (v1) in `PENDING` state with ranked alternatives.

### Agent 4: Store Manager Agent (`StoreManagerAgent`)
- **Duty**: Formulates concise, professional WhatsApp alert messages for store managers.
- **Features**: Generates structured interactive options (Option 1: Transfer, Option 2: PO, Option 3: Allocation) with profit metrics and SHAP demand drivers.
- **Output**: Prepares message text and button IDs (`decision_id:v1:ACTION_TYPE`).

### Agent 5: Execution Agent (`ExecutionAgent`)
- **Duty**: Executes approved plans within the simulated ERP logistics pipeline.
- **Actions**: Atomically reserves source stock, generates `TransferOrder` in state `RESERVED`, logs auditable `InventoryTransaction` entries, and enforces idempotency.
- **Status Transitions**: `NOT_STARTED` $\to$ `RESERVED` $\to$ `DISPATCHED` $\to$ `IN_TRANSIT` $\to$ `RECEIVED` $\to$ `COMPLETED`.

### Agent 6: Dynamic Replanning Agent (`DynamicReplanningAgent`)
- **Duty**: Audits pre-dispatch feasibility when conditions change after approval.
- **Disruption Handling**: If the source store experiences a demand spike or stock drop, automatically pauses unexecuted transfers, re-runs Pyomo MILP, increments decision version to `v2`, and prompts the store manager for renewed approval.
- **Security Rule**: Approvals for v1 are strictly prohibited from authorizing v2.

### Agent 7: Learning Agent (`LearningAgent`)
- **Duty**: Post-execution performance measurement and feedback loop.
- **Features**: Compares actual store outcomes against forecasts and expected benefits. Tracks KPIs across three modes: Baseline, AI Prescriptive, and AI Agentic.
