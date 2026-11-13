"""Typed State Schema for LangGraph Multi-Agent System in RetailMind AI."""
from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime

class AgentState(TypedDict):
    # Workflow Context
    workflow_id: str
    triggered_at: str
    store_id: str
    product_id: str
    disruption_type: str # NORMAL, STOCKOUT, OVERSTOCK, SUPPLIER_DELAY, DEMAND_SPIKE
    
    # Anomaly / Risk Findings
    detected_risk: Optional[Dict[str, Any]]
    ripple_impact: Optional[Dict[str, Any]]
    
    # Decisions & Alternatives
    forecast_summary: Optional[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    chosen_recommendation: Optional[Dict[str, Any]]
    decision_id: Optional[str]
    current_version: int
    decision_status: str # PENDING, APPROVED, REJECTED, EXPIRED, REPLANNING, CANCELLED
    execution_status: str # NOT_STARTED, RESERVED, DISPATCHED, IN_TRANSIT, RECEIVED, COMPLETED, FAILED

    # Human-in-the-Loop & Approval
    approval_channel: Optional[str] # WEB_DASHBOARD
    manager_decision: Optional[str] # APPROVED, REJECTED, ALTERNATIVE_REQUESTED
    option_selected: Optional[str]
    idempotency_key: Optional[str]
    approval_timestamp: Optional[str]

    # Dynamic Replanning & Version History
    previous_version_data: Optional[Dict[str, Any]]
    replanning_reason: Optional[str]
    is_replanned: bool

    # Natural Language Explanations
    structured_explanation: Optional[str]
    
    # Execution & Outcomes
    transfer_order_id: Optional[str]
    purchase_order_id: Optional[str]
    execution_logs: List[str]
    actual_outcome: Optional[Dict[str, Any]]
