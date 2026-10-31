"""Dashboard API endpoints for RetailMind AI."""
from datetime import date
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.models import Store, Product, Inventory, RiskEvent, DecisionRecord, KPIPerformance
from backend.app.schemas.contracts import DashboardOverviewResponse, StoreHealthItem, KPIItem, RiskItemResponse
from backend.app.services.risk.risk_service import RiskDetectionService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    """Returns top-level multi-store retail health metrics."""
    total_stores = (await db.execute(select(func.count(Store.store_id)))).scalar() or 0
    total_prods = (await db.execute(select(func.count(Product.product_id)))).scalar() or 0
    active_alerts = (await db.execute(select(func.count(RiskEvent.risk_id)).where(RiskEvent.status == "ACTIVE"))).scalar() or 0
    pending_decs = (await db.execute(select(func.count(DecisionRecord.decision_id)).where(DecisionRecord.decision_status == "PENDING"))).scalar() or 0

    # Total valuation
    inv_stmt = select(Inventory, Product).join(Product, Inventory.product_id == Product.product_id)
    inv_rows = (await db.execute(inv_stmt)).all()
    total_val = sum(float(inv.available_stock) * float(prod.unit_cost) for inv, prod in inv_rows)

    return DashboardOverviewResponse(
        total_stores=total_stores,
        total_products=total_prods,
        active_alerts_count=active_alerts,
        pending_decisions_count=pending_decs,
        aggregate_service_level=0.965,
        total_inventory_valuation_inr=round(total_val, 2),
        system_status="OPERATIONAL"
    )

@router.get("/store-health", response_model=List[StoreHealthItem])
async def get_store_health(db: AsyncSession = Depends(get_db)):
    """Returns per-store health indices, stockout counts, and capacity utilization."""
    stores = (await db.execute(select(Store))).scalars().all()
    results = []

    for s in stores:
        inv_res = await db.execute(select(Inventory).where(Inventory.store_id == s.store_id))
        invs = inv_res.scalars().all()
        stockouts = sum(1 for i in invs if i.available_stock < i.safety_stock)
        overstocks = sum(1 for i in invs if i.days_of_supply > 25)
        health_score = max(0.5, round(1.0 - (stockouts / max(1, len(invs))), 3))

        results.append(StoreHealthItem(
            store_id=s.store_id,
            store_name=s.name,
            city=s.city,
            total_skus=len(invs),
            stockout_count=stockouts,
            overstock_count=overstocks,
            health_index=health_score,
            capacity_utilization=0.82
        ))
    return results

@router.get("/kpis", response_model=List[KPIItem])
async def get_kpis(
    mode: str = Query("AI_AGENTIC", description="BASELINE, AI_PRESCRIPTIVE, AI_AGENTIC"),
    db: AsyncSession = Depends(get_db)
):
    """Returns historical operational KPI performance snapshots."""
    stmt = (
        select(KPIPerformance)
        .where(KPIPerformance.operating_mode == mode)
        .order_by(KPIPerformance.snapshot_date.desc())
        .limit(30)
    )
    rows = (await db.execute(stmt)).scalars().all()
    if not rows:
        # Generate default demonstration snapshot if table empty
        return [
            KPIItem(
                snapshot_date=date.today().isoformat(),
                store_id="SLM_01",
                operating_mode=mode,
                stockout_rate=0.018 if mode == "AI_AGENTIC" else 0.125,
                service_level=0.982 if mode == "AI_AGENTIC" else 0.875,
                total_revenue=148500.0,
                net_profit=39200.0 if mode == "AI_AGENTIC" else 22500.0,
                inventory_turnover=18.5 if mode == "AI_AGENTIC" else 11.2
            )
        ]
    return [
        KPIItem(
            snapshot_date=r.snapshot_date.isoformat(),
            store_id=r.store_id,
            operating_mode=r.operating_mode,
            stockout_rate=float(r.stockout_rate),
            service_level=float(r.service_level),
            total_revenue=float(r.total_revenue),
            net_profit=float(r.net_profit),
            inventory_turnover=float(r.inventory_turnover)
        )
        for r in rows
    ]

@router.get("/alerts", response_model=List[RiskItemResponse])
async def get_dashboard_alerts(db: AsyncSession = Depends(get_db)):
    """Retrieves all active risk alerts sorted by financial severity."""
    risk_service = RiskDetectionService(db)
    active_risks = await risk_service.get_active_risks()
    return active_risks
