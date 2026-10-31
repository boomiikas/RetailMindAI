"""Ripple Effect API endpoints for RetailMind AI."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.schemas.contracts import RippleEffectResponse
from backend.app.services.ripple.ripple_service import RippleEffectService

router = APIRouter(prefix="/ripple-effects", tags=["Ripple Effects"])

@router.get("/{event_id}", response_model=RippleEffectResponse)
async def get_ripple_effect(event_id: str, db: AsyncSession = Depends(get_db)):
    """Traces and returns NetworkX dependency DAG nodes, edges, and cascading financial exposure."""
    service = RippleEffectService(db)
    # Default parameters based on event_id parsing
    store_id = "SLM_01" if "SLM" in event_id else "CBE_01"
    product_id = "MILK_001"
    disruption = "SUPPLIER_DELAY" if "SUP" in event_id else "CRITICAL_STOCKOUT"

    ripple = await service.analyze_ripple_effect(
        event_id=event_id,
        disruption_type=disruption,
        source_entity_id="SUP_01",
        affected_product_id=product_id,
        affected_store_id=store_id,
        delay_days=3
    )
    return ripple
