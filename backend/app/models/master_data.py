"""Core master data models: stores, products, suppliers, mappings, routes."""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    String, Integer, Numeric, Boolean, Text, DateTime, Date, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Store(Base):
    __tablename__ = "stores"

    store_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    city: Mapped[str] = mapped_column(String(64), nullable=False)
    region: Mapped[str] = mapped_column(String(64), default="Tamil Nadu")
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    size_sqft: Mapped[int] = mapped_column(Integer, nullable=False)
    store_type: Mapped[str] = mapped_column(String(32), default="SUPERMARKET")
    manager_name: Mapped[str] = mapped_column(String(128), nullable=False)
    manager_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Product(Base):
    __tablename__ = "products"

    product_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    subcategory: Mapped[str] = mapped_column(String(64), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    base_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    min_safety_stock: Mapped[int] = mapped_column(Integer, default=10)
    shelf_life_days: Mapped[int] = mapped_column(Integer, default=365)
    holding_cost_per_day: Mapped[float] = mapped_column(Numeric(8, 4), default=0.05)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[str] = mapped_column(String(128), nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=3)
    reliability_score: Mapped[float] = mapped_column(Numeric(4, 3), default=0.95)
    min_order_qty: Mapped[int] = mapped_column(Integer, default=20)
    max_order_qty: Mapped[int] = mapped_column(Integer, default=2000)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supplier_id: Mapped[str] = mapped_column(String(32), ForeignKey("suppliers.supplier_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=3)
    reliability_score: Mapped[float] = mapped_column(Numeric(4, 3), default=0.95)
    min_order_qty: Mapped[int] = mapped_column(Integer, default=20)
    max_order_qty: Mapped[int] = mapped_column(Integer, default=2000)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (UniqueConstraint("supplier_id", "product_id", name="uq_supplier_product"),)


class StoreProduct(Base):
    __tablename__ = "store_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(32), ForeignKey("products.product_id"), nullable=False)
    is_eligible: Mapped[bool] = mapped_column(Boolean, default=True)
    target_stock_level: Mapped[int] = mapped_column(Integer, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (UniqueConstraint("store_id", "product_id", name="uq_store_product"),)


class StoreRoute(Base):
    __tablename__ = "store_routes"

    route_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    destination_store_id: Mapped[str] = mapped_column(String(32), ForeignKey("stores.store_id"), nullable=False)
    distance_km: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    transit_time_hours: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    transportation_cost_per_unit: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    route_status: Mapped[str] = mapped_column(String(32), default="ACTIVE")

    __table_args__ = (UniqueConstraint("source_store_id", "destination_store_id", name="uq_store_route"),)
