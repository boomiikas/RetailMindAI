"""Forecasting, Evaluation, Risk, Ripple Impact, and Model Metrics models."""
from datetime import datetime, timezone, date
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    String, Integer, Numeric, Boolean, Text, DateTime, Date as SqlDate, ForeignKey, JSON
)
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.database.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    forecast_run_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    training_dataset_version: Mapped[str] = mapped_column(String(64), default="v1.0")
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    forecast_horizon_days: Mapped[int] = mapped_column(Integer, default=7)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    forecast_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    forecast_run_id: Mapped[str] = mapped_column(String(64), ForeignKey("forecast_runs.forecast_run_id"), nullable=False)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    forecast_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    p10: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    p50: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    p90: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), default="v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ForecastActual(Base):
    __tablename__ = "forecast_actuals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    forecast_run_id: Mapped[str] = mapped_column(String(64), ForeignKey("forecast_runs.forecast_run_id"), nullable=False)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    target_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    forecast_p50: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    actual_demand: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    absolute_error: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    percentage_error: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class RiskEvent(Base):
    __tablename__ = "risk_events"

    risk_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_type: Mapped[str] = mapped_column(String(64), nullable=False)
    # CRITICAL_STOCKOUT, POTENTIAL_STOCKOUT, OVERSTOCK, SLOW_MOVING, IMBALANCE
    severity: Mapped[str] = mapped_column(String(16), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    affected_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    expected_occurrence: Mapped[date] = mapped_column(SqlDate, nullable=False)
    financial_impact_est: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    root_cause: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE") # ACTIVE, MITIGATED, RESOLVED, IGNORED
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class RippleImpact(Base):
    __tablename__ = "ripple_impacts"

    impact_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    risk_id: Mapped[str] = mapped_column(String(64), ForeignKey("risk_events.risk_id"), nullable=False)
    root_disruption_node: Mapped[str] = mapped_column(String(128), nullable=False)
    affected_nodes: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False) # Downstream nodes with metrics
    dependency_path: Mapped[List[Any]] = mapped_column(JSON, nullable=False) # Graph trajectory
    potential_lost_sales_units: Mapped[int] = mapped_column(Integer, default=0)
    financial_loss_est: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    markdown_risk_est: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    holding_cost_est: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    structured_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ModelMetric(Base):
    __tablename__ = "model_metrics"

    metric_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    evaluation_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    dataset_split: Mapped[str] = mapped_column(String(16), nullable=False) # TRAIN, VALIDATION, TEST
    mae: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    rmse: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    wape: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    forecast_bias: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    r2_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 4), nullable=True)
    features_used: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
