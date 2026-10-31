"""Risk Detection and Inventory Health Service for RetailMind AI.

Detects critical stockouts, potential stockouts, overstock, slow-moving items,
and cross-store imbalances using dynamic quantile demand and lead times.
"""

from datetime import date, timedelta, datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import (
    Inventory, Product, Store, RiskEvent, SupplierProduct
)
from backend.ml.inference.predictor import get_demand_predictor
from backend.app.core.logging import logger

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class RiskDetectionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.predictor = get_demand_predictor()

    async def scan_and_detect_risks(self, store_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Scans store inventories, calculates risks, and persists to risk_events."""
        stmt = (
            select(Inventory, Product, Store)
            .join(Product, Inventory.product_id == Product.product_id)
            .join(Store, Inventory.store_id == Store.store_id)
        )
        if store_id:
            stmt = stmt.where(Inventory.store_id == store_id)

        res = await self.session.execute(stmt)
        rows = res.all()

        detected_risks = []
        today = date.today()

        # Group inventories by product to detect cross-store imbalances
        prod_store_map: Dict[str, List[Dict[str, Any]]] = {}

        for inv, prod, store in rows:
            # Get 7-day quantile forecast
            fc = self.predictor.predict(
                store_id=inv.store_id,
                product_id=inv.product_id,
                horizon_days=7
            )
            daily_forecasts = fc["daily_forecasts"]
            p50_total = fc["total_p50_demand"]
            avg_daily_demand = max(1.0, p50_total / 7.0)

            # Recalculate true days of supply based on forecast
            days_supply = round(inv.available_stock / avg_daily_demand, 2)
            margin = float(prod.base_price) - float(prod.unit_cost)

            item_data = {
                "inv": inv,
                "prod": prod,
                "store": store,
                "avg_daily_demand": avg_daily_demand,
                "days_supply": days_supply,
                "margin": margin,
                "daily_forecasts": daily_forecasts,
            }
            if inv.product_id not in prod_store_map:
                prod_store_map[inv.product_id] = []
            prod_store_map[inv.product_id].append(item_data)

            # 1. Critical Stockout Check
            # If available stock < safety stock or days of supply < 1.0
            if inv.available_stock < inv.safety_stock or days_supply < 1.0:
                shortage = max(1, int(inv.safety_stock * 2 - inv.available_stock))
                financial_exposure = round(shortage * margin, 2)
                risk_id = f"RSK_STOCKOUT_{inv.store_id}_{inv.product_id}_{today.isoformat()}"
                
                detected_risks.append({
                    "risk_id": risk_id,
                    "risk_type": "CRITICAL_STOCKOUT",
                    "severity": "CRITICAL" if days_supply < 0.5 else "HIGH",
                    "store_id": inv.store_id,
                    "product_id": inv.product_id,
                    "affected_quantity": shortage,
                    "expected_occurrence": today + timedelta(days=1),
                    "financial_impact_est": financial_exposure,
                    "root_cause": f"Available stock ({inv.available_stock}) is below safety threshold ({inv.safety_stock}). Forecasted daily consumption is {avg_daily_demand:.1f} units/day.",
                    "status": "ACTIVE"
                })

            # 2. Overstock Check
            # Days of supply > 15 days and inventory > 50 units
            elif days_supply > 15.0 and inv.available_stock > 50:
                excess_units = int(inv.available_stock - (avg_daily_demand * 10))
                holding_exposure = round(excess_units * float(prod.holding_cost_per_day) * 30, 2)
                risk_id = f"RSK_OVERSTOCK_{inv.store_id}_{inv.product_id}_{today.isoformat()}"

                detected_risks.append({
                    "risk_id": risk_id,
                    "risk_type": "OVERSTOCK",
                    "severity": "MEDIUM" if days_supply < 35.0 else "HIGH",
                    "store_id": inv.store_id,
                    "product_id": inv.product_id,
                    "affected_quantity": excess_units,
                    "expected_occurrence": today + timedelta(days=7),
                    "financial_impact_est": holding_exposure,
                    "root_cause": f"Excess inventory ({inv.available_stock} units, {days_supply:.1f} days supply) causes elevated holding cost and potential markdown risk.",
                    "status": "ACTIVE"
                })

        # 3. Imbalance Check (Store A is short while Store B has surplus)
        for p_id, store_items in prod_store_map.items():
            short_stores = [s for s in store_items if s["days_supply"] < 1.5]
            surplus_stores = [s for s in store_items if s["days_supply"] > 5.0 and s["inv"].available_stock > s["inv"].safety_stock * 2]

            for short in short_stores:
                for surplus in surplus_stores:
                    transferable = surplus["inv"].available_stock - (surplus["inv"].safety_stock * 2)
                    if transferable >= 30:
                        risk_id = f"RSK_IMBALANCE_{short['store'].store_id}_{surplus['store'].store_id}_{p_id}_{today.isoformat()}"
                        detected_risks.append({
                            "risk_id": risk_id,
                            "risk_type": "IMBALANCE",
                            "severity": "HIGH",
                            "store_id": short["store"].store_id,
                            "product_id": p_id,
                            "affected_quantity": min(short["inv"].safety_stock * 2, transferable),
                            "expected_occurrence": today + timedelta(days=1),
                            "financial_impact_est": round(short["margin"] * min(short["inv"].safety_stock * 2, transferable), 2),
                            "root_cause": f"Severe stock disparity: {short['store'].city} has only {short['days_supply']:.1f} days of supply, while {surplus['store'].city} possesses {transferable} transferable surplus units.",
                            "status": "ACTIVE"
                        })

        # Persist detected risks to database
        for r in detected_risks:
            existing = await self.session.get(RiskEvent, r["risk_id"])
            if not existing:
                risk_obj = RiskEvent(
                    risk_id=r["risk_id"],
                    risk_type=r["risk_type"],
                    severity=r["severity"],
                    store_id=r["store_id"],
                    product_id=r["product_id"],
                    affected_quantity=r["affected_quantity"],
                    expected_occurrence=r["expected_occurrence"],
                    financial_impact_est=r["financial_impact_est"],
                    root_cause=r["root_cause"],
                    status=r["status"],
                    detected_at=utc_now()
                )
                self.session.add(risk_obj)
            else:
                existing.severity = r["severity"]
                existing.affected_quantity = r["affected_quantity"]
                existing.financial_impact_est = r["financial_impact_est"]
                existing.root_cause = r["root_cause"]

        await self.session.commit()
        logger.info(f"Detected and persisted {len(detected_risks)} retail operational risks.")
        return detected_risks

    async def get_active_risks(self) -> List[Dict[str, Any]]:
        """Retrieves all active risk events."""
        stmt = (
            select(RiskEvent, Product, Store)
            .join(Product, RiskEvent.product_id == Product.product_id)
            .join(Store, RiskEvent.store_id == Store.store_id)
            .where(RiskEvent.status == "ACTIVE")
            .order_by(RiskEvent.financial_impact_est.desc())
        )
        res = await self.session.execute(stmt)
        risks = []
        for r, p, s in res.all():
            risks.append({
                "risk_id": r.risk_id,
                "risk_type": r.risk_type,
                "severity": r.severity,
                "store_id": r.store_id,
                "store_name": s.name,
                "city": s.city,
                "product_id": r.product_id,
                "product_name": p.name,
                "category": p.category,
                "affected_quantity": r.affected_quantity,
                "expected_occurrence": r.expected_occurrence.isoformat(),
                "financial_impact_est": float(r.financial_impact_est),
                "root_cause": r.root_cause,
                "status": r.status,
                "detected_at": r.detected_at.isoformat(),
            })
        return risks
