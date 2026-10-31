"""Decisions, Approvals, Versions, Logistics Orders, Execution, and KPIs."""
from datetime import datetime, timezone, date
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    String, Integer, Numeric, Boolean, Text, DateTime, Date as SqlDate, ForeignKey, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("risk_events.risk_id"), nullable=True)
    rank_order: Mapped[int] = mapped_column(Integer, default=1)
    action_type: Mapped[str] = mapped_column(String(32), nullable=False)
    # REPLENISH_SUPPLIER, INTER_STORE_TRANSFER, ALLOCATION_CHANGE, APPLY_MARKDOWN, PROMOTION_ADJUST, NO_ACTION
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    source_store_id: Mapped[Optional[str]] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=True)
    dest_store_id: Mapped[Optional[str]] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    expected_cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    expected_revenue: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    expected_net_profit: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    confidence_score: Mapped[float] = mapped_column(Numeric(4, 3), default=1.0)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    shap_summary: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PROPOSED") # PROPOSED, ACCEPTED, REJECTED, SUPERSEDED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class DecisionRecord(Base):
    __tablename__ = "decision_records"

    decision_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("risk_events.risk_id"), nullable=True)
    chosen_recommendation_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("recommendations.recommendation_id"), nullable=True)
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    
    # Decision State Machine: PENDING, APPROVED, REJECTED, EXPIRED, REPLANNING, CANCELLED
    decision_status: Mapped[str] = mapped_column(String(32), default="PENDING")
    
    # Execution State Machine: NOT_STARTED, RESERVED, DISPATCHED, IN_TRANSIT, RECEIVED, COMPLETED, FAILED
    execution_status: Mapped[str] = mapped_column(String(32), default="NOT_STARTED")
    
    original_recommendation_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    version_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    decision_id: Mapped[str] = mapped_column(String(64), ForeignKey("decision_records.decision_id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    recommendation_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    replanning_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trigger_disruption_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    previous_version_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("decision_id", "version_number", name="uq_decision_version"),
    )


class ManagerApproval(Base):
    __tablename__ = "manager_approvals"

    approval_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    decision_id: Mapped[str] = mapped_column(String(64), ForeignKey("decision_records.decision_id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    manager_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    channel: Mapped[str] = mapped_column(String(32), default="WHATSAPP") # WHATSAPP, WEB_DASHBOARD
    decision_outcome: Mapped[str] = mapped_column(String(32), nullable=False) # APPROVED, REJECTED, ALTERNATIVE_REQUESTED
    option_selected: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class TransferOrder(Base):
    __tablename__ = "transfer_orders"

    transfer_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    decision_id: Mapped[str] = mapped_column(String(64), ForeignKey("decision_records.decision_id"), nullable=False)
    source_store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    dest_store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    transfer_cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    
    # Status: RESERVED, DISPATCHED, IN_TRANSIT, RECEIVED, COMPLETED, CANCELLED, FAILED
    status: Mapped[str] = mapped_column(String(32), default="RESERVED")
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    received_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    po_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    decision_id: Mapped[str] = mapped_column(String(64), ForeignKey("decision_records.decision_id"), nullable=False)
    supplier_id: Mapped[str] = mapped_column(String(32), ForeignKey("suppliers.supplier_id"), nullable=False)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Status: ORDERED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    status: Mapped[str] = mapped_column(String(32), default="ORDERED")
    expected_delivery_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class PromotionAction(Base):
    __tablename__ = "promotion_actions"

    promo_action_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    decision_id: Mapped[str] = mapped_column(String(64), ForeignKey("decision_records.decision_id"), nullable=False)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String(32), nullable=False) # MARKDOWN, PROMOTION_BOOST
    old_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    new_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    discount_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="APPLIED")
    effective_from: Mapped[date] = mapped_column(SqlDate, nullable=False)
    effective_to: Mapped[Optional[date]] = mapped_column(SqlDate, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    log_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False) # TRANSFER_ORDER, PURCHASE_ORDER, PROMOTION_ACTION, REPLANNING
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    previous_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class KPIPerformance(Base):
    __tablename__ = "kpi_performance"

    kpi_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    operating_mode: Mapped[str] = mapped_column(String(32), nullable=False) # BASELINE, AI_PRESCRIPTIVE, AI_AGENTIC
    stockout_rate: Mapped[float] = mapped_column(Numeric(6, 4), default=0.0)
    overstock_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    inventory_utilization: Mapped[float] = mapped_column(Numeric(6, 4), default=0.0)
    lost_sales_units: Mapped[int] = mapped_column(Integer, default=0)
    lost_sales_revenue: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    total_revenue: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    net_profit: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    inventory_turnover: Mapped[float] = mapped_column(Numeric(6, 2), default=0.0)
    service_level: Mapped[float] = mapped_column(Numeric(6, 4), default=1.0)
    decision_latency_avg_sec: Mapped[int] = mapped_column(Integer, default=0)
    acceptance_rate: Mapped[float] = mapped_column(Numeric(6, 4), default=1.0)
    replanning_success_rate: Mapped[float] = mapped_column(Numeric(6, 4), default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("store_id", "operating_mode", "snapshot_date", name="uq_kpi_store_mode_date"),
    )
