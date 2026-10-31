"""Pydantic V2 Request & Response Schemas for RetailMind AI API Contracts."""
from datetime import date, datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# 1. Dashboard Schemas
class DashboardOverviewResponse(BaseModel):
    total_stores: int
    total_products: int
    active_alerts_count: int
    pending_decisions_count: int
    aggregate_service_level: float
    total_inventory_valuation_inr: float
    system_status: str

class StoreHealthItem(BaseModel):
    store_id: str
    store_name: str
    city: str
    total_skus: int
    stockout_count: int
    overstock_count: int
    health_index: float
    capacity_utilization: float

class KPIItem(BaseModel):
    snapshot_date: str
    store_id: str
    operating_mode: str
    stockout_rate: float
    service_level: float
    total_revenue: float
    net_profit: float
    inventory_turnover: float

# 2. Inventory Schemas
class InventoryItemResponse(BaseModel):
    store_id: str
    product_id: str
    product_name: str
    category: str
    physical_on_hand: int
    reserved_stock: int
    available_stock: int
    incoming_stock: int
    safety_stock: int
    days_of_supply: float
    unit_cost: float
    base_price: float
    inventory_valuation: float

# 3. Forecasting Schemas
class DailyQuantileForecast(BaseModel):
    forecast_date: str
    p10: float
    p50: float
    p90: float
    uncertainty_spread: float

class DemandForecastResponse(BaseModel):
    store_id: str
    product_id: str
    horizon_days: int
    forecast_start_date: str
    model_version: str
    daily_forecasts: List[DailyQuantileForecast]
    total_p50_demand: float
    feature_attribution: List[Dict[str, Any]]

class ForecastAccuracyResponse(BaseModel):
    model_name: str
    model_version: str
    validation_metrics: Dict[str, float]
    test_metrics: Dict[str, float]
    top_drivers: List[Dict[str, Any]]

# 4. Risk & Ripple Schemas
class RiskItemResponse(BaseModel):
    risk_id: str
    risk_type: str
    severity: str
    store_id: str
    store_name: str
    city: str
    product_id: str
    product_name: str
    affected_quantity: int
    expected_occurrence: str
    financial_impact_est: float
    root_cause: str
    status: str

class RippleEffectResponse(BaseModel):
    event_id: str
    disruption_type: str
    root_disruption_node: str
    affected_store_id: str
    affected_product_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    dependency_path: List[str]
    potential_lost_sales_units: int
    financial_loss_est: float
    holding_cost_est: float
    markdown_risk_est: float
    structured_explanation: str

# 5. Recommendation & Decision Schemas
class RecommendationItem(BaseModel):
    rank_order: int
    action_type: str
    product_id: str
    source_store_id: Optional[str] = None
    dest_store_id: Optional[str] = None
    quantity: int
    expected_cost: float
    expected_revenue: float
    expected_net_profit: float
    confidence_score: float
    explanation: str

class GenerateRecommendationRequest(BaseModel):
    store_id: str
    product_id: str

# 6. Approvals & Dynamic Replanning
class DecisionApprovalRequest(BaseModel):
    manager_id: str = "MGR_01"
    channel: str = "WEB_DASHBOARD"
    option_selected: str = "INTER_STORE_TRANSFER"
    idempotency_key: str
    notes: Optional[str] = None

class DynamicReplanningTriggerRequest(BaseModel):
    disruption_type: str = "DEMAND_SPIKE"
    spike_units: int = 45
    notes: Optional[str] = "Coimbatore local demand spike before dispatch"

# 7. What-If Simulation
class SimulationScenarioInput(BaseModel):
    scenario_name: str
    action_type: str
    quantity: int = 0
    inflow_day: int = 1
    transfer_cost_per_unit: float = 2.0
    discount_pct: float = 0.0

class RunSimulationRequest(BaseModel):
    store_id: str
    product_id: str
    scenarios: List[SimulationScenarioInput]
