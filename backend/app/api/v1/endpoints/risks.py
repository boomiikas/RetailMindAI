"""Risks and Ripple Effects API endpoints for RetailMind AI."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.models import RiskEvent, Product, Store
from backend.app.schemas.contracts import RiskItemResponse
from backend.app.services.risk.risk_service import RiskDetectionService

router = APIRouter(prefix="/risks", tags=["Risks"])

@router.get("", response_model=List[RiskItemResponse])
async def list_risks(db: AsyncSession = Depends(get_db)):
    """Lists all active inventory risk events sorted by financial impact."""
    service = RiskDetectionService(db)
    risks = await service.get_active_risks()
    return risks

@router.get("/{risk_id}", response_model=RiskItemResponse)
async def get_risk_detail(risk_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves full details for a specific operational risk event."""
    stmt = (
        select(RiskEvent, Product, Store)
        .join(Product, RiskEvent.product_id == Product.product_id)
        .join(Store, RiskEvent.store_id == Store.store_id)
        .where(RiskEvent.risk_id == risk_id)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Risk {risk_id} not found")
    r, p, s = row
    return RiskItemResponse(
        risk_id=r.risk_id,
        risk_type=r.risk_type,
        severity=r.severity,
        store_id=r.store_id,
        store_name=s.name,
        city=s.city,
        product_id=r.product_id,
        product_name=p.name,
        affected_quantity=r.affected_quantity,
        expected_occurrence=r.expected_occurrence.isoformat(),
        financial_impact_est=float(r.financial_impact_est),
        root_cause=r.root_cause,
        status=r.status
    )
