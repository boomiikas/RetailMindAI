# RetailMind AI: API Contracts & Frontend Integration Guide

This document defines the REST APIs and WebSocket specifications for the React + Vite dashboard frontend developer.

Base URL: `http://localhost:8000/api/v1`  
WebSocket URL: `ws://localhost:8000/ws/dashboard`  
Swagger UI Documentation: `http://localhost:8000/docs`  
OpenAPI Specification JSON: `http://localhost:8000/api/v1/openapi.json`  
CORS: Configured for `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173`

---

## 1. Dashboard Endpoints

### 1.1 `GET /api/v1/dashboard/overview`
Returns high-level aggregate retail telemetry across all 5 stores.

**Response Schema (`200 OK`)**:
```json
{
  "total_stores": 5,
  "total_products": 60,
  "active_alerts_count": 3,
  "pending_decisions_count": 1,
  "aggregate_service_level": 0.965,
  "total_inventory_valuation_inr": 2845000.50,
  "system_status": "OPERATIONAL"
}
```

### 1.2 `GET /api/v1/dashboard/store-health`
Returns health indices, stockout counts, and capacity utilization per store.

**Response Schema (`200 OK`)**:
```json
[
  {
    "store_id": "CHN_01",
    "store_name": "RetailMind Chennai Flagship",
    "city": "Chennai",
    "total_skus": 60,
    "stockout_count": 0,
    "overstock_count": 2,
    "health_index": 1.0,
    "capacity_utilization": 0.82
  },
  {
    "store_id": "SLM_01",
    "store_name": "RetailMind Salem Central",
    "city": "Salem",
    "total_skus": 60,
    "stockout_count": 1,
    "overstock_count": 0,
    "health_index": 0.983,
    "capacity_utilization": 0.74
  }
]
```

### 1.3 `GET /api/v1/dashboard/kpis`
Query Parameters:
- `mode` (optional, default: `AI_AGENTIC`): `BASELINE`, `AI_PRESCRIPTIVE`, `AI_AGENTIC`

**Response Schema (`200 OK`)**:
```json
[
  {
    "snapshot_date": "2026-10-31",
    "store_id": "SLM_01",
    "operating_mode": "AI_AGENTIC",
    "stockout_rate": 0.018,
    "service_level": 0.982,
    "total_revenue": 148500.0,
    "net_profit": 39200.0,
    "inventory_turnover": 18.5
  }
]
```

### 1.4 `GET /api/v1/dashboard/alerts`
Returns active unmitigated risks sorted by financial impact.

---

## 2. Inventory Endpoints

### 2.1 `GET /api/v1/inventory`
Query Parameters:
- `store_id` (required, e.g. `SLM_01`)
- `category` (optional, e.g. `DAIRY`, `STAPLES`)

**Response Schema (`200 OK`)**:
```json
[
  {
    "store_id": "SLM_01",
    "product_id": "MILK_001",
    "product_name": "Aavin Toned Fresh Milk 500ml",
    "category": "DAIRY",
    "physical_on_hand": 15,
    "reserved_stock": 0,
    "available_stock": 15,
    "incoming_stock": 40,
    "safety_stock": 25,
    "days_of_supply": 0.8,
    "unit_cost": 20.0,
    "base_price": 24.0,
    "inventory_valuation": 300.0
  }
]
```

### 2.2 `GET /api/v1/inventory/products/{product_id}`
Returns stock distribution across all 5 stores to identify inter-store transfer surplus.

---

## 3. Forecasting Endpoints

### 3.1 `GET /api/v1/forecasts`
Query Parameters:
- `store_id` (e.g. `SLM_01`)
- `product_id` (e.g. `MILK_001`)
- `horizon_days` (default: 7)

**Response Schema (`200 OK`)**:
```json
{
  "store_id": "SLM_01",
  "product_id": "MILK_001",
  "horizon_days": 7,
  "forecast_start_date": "2026-11-01",
  "model_version": "v1.0-hgb-quantile",
  "daily_forecasts": [
    {
      "forecast_date": "2026-11-01",
      "p10": 155.9,
      "p50": 218.0,
      "p90": 259.7,
      "uncertainty_spread": 103.8
    }
  ],
  "total_p50_demand": 909.2,
  "feature_attribution": [
    {"feature": "rolling_mean_7", "shap_weight": 9.7124},
    {"feature": "festival_flag", "shap_weight": 6.5117}
  ]
}
```

### 3.2 `GET /api/v1/forecasts/accuracy`
Returns model validation metrics: MAE, RMSE, WAPE, Bias, R2.

---

## 4. Risks & Ripple Effect Endpoints

### 4.1 `GET /api/v1/risks`
Returns all active operational risk records.

### 4.2 `GET /api/v1/ripple-effects/{event_id}`
Returns directed dependency graph suitable for React Network/Graph components (e.g. Cytoscape, React Flow, vis.js).

**Response Schema (`200 OK`)**:
```json
{
  "event_id": "TEST_EVT_SUP_DELAY",
  "disruption_type": "SUPPLIER_DELAY",
  "root_disruption_node": "SUPPLIER_SUP_01",
  "affected_store_id": "SLM_01",
  "affected_product_id": "MILK_001",
  "nodes": [
    {"id": "SUPPLIER_SUP_01", "label": "Aavin Dairy Co-operative", "type": "SUPPLIER"},
    {"id": "INV_SLM_01_MILK_001", "label": "Salem Aavin Toned Fresh Milk 500ml Stock", "type": "INVENTORY"},
    {"id": "STORE_SLM_01", "label": "RetailMind Salem Central", "type": "STORE"},
    {"id": "REVENUE_SLM_01", "label": "Salem Revenue", "type": "FINANCIAL"}
  ],
  "edges": [
    {"source": "SUPPLIER_SUP_01", "target": "INV_SLM_01_MILK_001", "relationship": "DOWNSTREAM_DISRUPTION"},
    {"source": "INV_SLM_01_MILK_001", "target": "STORE_SLM_01", "relationship": "DOWNSTREAM_DISRUPTION"}
  ],
  "potential_lost_sales_units": 165,
  "financial_loss_est": 660.0,
  "structured_explanation": "Disruption detected at supplier SUP_01: Delivery delayed by 3 days..."
}
```

---

## 5. Decision Recommendations & Approvals

### 5.1 `GET /api/v1/recommendations`
Lists decisions in `PENDING` status.

### 5.2 `POST /api/v1/recommendations/generate`
**Payload**:
```json
{
  "store_id": "SLM_01",
  "product_id": "MILK_001"
}
```

### 5.3 `POST /api/v1/decisions/{decision_id}/approve`
**Payload**:
```json
{
  "manager_id": "MGR_01",
  "channel": "WEB_DASHBOARD",
  "option_selected": "INTER_STORE_TRANSFER",
  "idempotency_key": "unique-uuid-v4-string",
  "notes": "Approved from dashboard"
}
```

---

## 6. Dynamic Replanning Endpoints

### 6.1 `GET /api/v1/replanning/active`
Lists active decisions currently undergoing automated replanning.

### 6.2 `POST /api/v1/replanning/{decision_id}/trigger`
Simulates or triggers a pre-dispatch disruption to test the dynamic replanning engine.

**Payload**:
```json
{
  "disruption_type": "DEMAND_SPIKE",
  "spike_units": 45,
  "notes": "Sudden local demand surge in Coimbatore before dispatch"
}
```

---

## 7. Execution & Logistics Endpoints

### 7.1 `GET /api/v1/executions`
Returns list of all transfer orders and purchase orders.

### 7.2 `POST /api/v1/executions/{execution_id}/confirm-dispatch`
Marks shipment as physically dispatched; deducts stock from source store physical stock.

### 7.3 `POST /api/v1/executions/{execution_id}/confirm-receipt`
Marks shipment as received; adds stock to destination store available inventory.

---

## 8. Real-Time WebSocket (`/ws/dashboard`)

Connect at: `ws://localhost:8000/ws/dashboard`

Events broadcast by the server:
- `ALERT_CREATED`
- `INVENTORY_UPDATED`
- `RECOMMENDATION_GENERATED`
- `APPROVAL_STATUS_CHANGED`
- `REPLANNING_TRIGGERED`
- `EXECUTION_STEP_COMPLETED`

Sample Event Payload:
```json
{
  "event": "REPLANNING_TRIGGERED",
  "data": {
    "decision_id": "DEC_SLM_01_MILK_001_1730370000",
    "new_version": 2,
    "reason": "Unexpected local demand spike of 45 units at source branch CBE_01"
  }
}
```
