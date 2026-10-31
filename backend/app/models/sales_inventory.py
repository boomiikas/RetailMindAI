"""Sales, Inventory, Transactions, Deliveries, and Pricing models."""
from datetime import datetime, timezone, date
from typing import Optional
from sqlalchemy import (
    String, Integer, Numeric, Boolean, Text, DateTime, Date as SqlDate, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Sale(Base):
    __tablename__ = "sales"

    sale_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    sale_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    units_sold: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    promotional_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    weather_condition: Mapped[str] = mapped_column(String(32), default="NORMAL")
    festival_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    stockout_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("store_id", "product_id", "sale_date", name="uq_sales_store_prod_date"),
        Index("idx_sales_store_prod_date", "store_id", "product_id", "sale_date"),
        Index("idx_sales_date", "sale_date"),
    )


class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    physical_on_hand: Mapped[int] = mapped_column(Integer, default=0)
    available_stock: Mapped[int] = mapped_column(Integer, default=0) # Invariant: physical_on_hand - reserved_stock
    reserved_stock: Mapped[int] = mapped_column(Integer, default=0)
    incoming_stock: Mapped[int] = mapped_column(Integer, default=0)
    safety_stock: Mapped[int] = mapped_column(Integer, default=15)
    reorder_point: Mapped[int] = mapped_column(Integer, default=25)
    days_of_supply: Mapped[float] = mapped_column(Numeric(6, 2), default=0.0)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("store_id", "product_id", name="uq_inventory_store_prod"),
        Index("idx_inventory_store_prod", "store_id", "product_id"),
    )


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    transaction_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(32), nullable=False)
    # SALE, PURCHASE_RECEIVED, TRANSFER_OUT, TRANSFER_IN, RESERVATION, RESERVATION_RELEASE, ADJUSTMENT, DAMAGE, RETURN
    quantity_change: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_type: Mapped[str] = mapped_column(String(32), nullable=False) # SALE_ORDER, TRANSFER_ORDER, PURCHASE_ORDER, AUDIT
    reference_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    previous_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    resulting_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("idx_inv_trans_store_prod", "store_id", "product_id", "created_at"),
    )


class HistoricalPrice(Base):
    __tablename__ = "historical_prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    effective_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    base_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    promotional_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    discount_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ExternalEvent(Base):
    __tablename__ = "external_events"

    event_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    store_id: Mapped[Optional[str]] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False) # FESTIVAL, WEATHER, MONSOON, HEATWAVE
    event_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    impact_factor: Mapped[float] = mapped_column(Numeric(4, 2), default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class SupplierDelivery(Base):
    __tablename__ = "supplier_deliveries"

    delivery_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    po_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    supplier_id: Mapped[str] = mapped_column(String(32), ForeignKey("suppliers.supplier_id"), nullable=False)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    order_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    expected_delivery_date: Mapped[date] = mapped_column(SqlDate, nullable=False)
    actual_delivery_date: Mapped[Optional[date]] = mapped_column(SqlDate, nullable=True)
    delay_days: Mapped[int] = mapped_column(Integer, default=0)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PENDING") # PENDING, IN_TRANSIT, DELAYED, DELIVERED, CANCELLED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
