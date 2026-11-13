"""Dynamic Replanning API endpoints for RetailMind AI."""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.models import DecisionRecord, DecisionVersion
from backend.app.schemas.contracts import DynamicReplanningTriggerRequest
from backend.app.agents.replanning_agent import DynamicReplanningAgent
from backend.app.websocket.connection_manager import ws_manager

router = APIRouter(prefix="/replanning", tags=["Dynamic Replanning"])

@router.get("/active")
async def get_active_replanning(db: AsyncSession = Depends(get_db)):
    """Retrieves all plans currently in REPLANNING status with their previous vs revised versions."""
    stmt = select(DecisionRecord).where(DecisionRecord.decision_status == "REPLANNING")
    rows = (await db.execute(stmt)).scalars().all()
    results = []
    for d in rows:
        v_stmt = select(DecisionVersion).where(DecisionVersion.decision_id == d.decision_id)
        versions = (await db.execute(v_stmt)).scalars().all()
        results.append({
            "decision_id": d.decision_id,
            "current_version": d.current_version,
            "status": d.decision_status,
            "execution_status": d.execution_status,
            "versions": [
                {
                    "version_number": v.version_number,
                    "replanning_reason": v.replanning_reason,
                    "recommendation": v.recommendation_data,
                    "created_at": v.created_at.isoformat()
                }
                for v in versions
            ]
        })
    return results

@router.get("/history")
async def get_replanning_history(db: AsyncSession = Depends(get_db)):
    """Returns complete version history across all replanned decisions."""
    stmt = select(DecisionVersion).order_by(DecisionVersion.created_at.desc())
    versions = (await db.execute(stmt)).scalars().all()
    return [
        {
            "version_id": v.version_id,
            "decision_id": v.decision_id,
            "version_number": v.version_number,
            "replanning_reason": v.replanning_reason,
            "disruption": v.trigger_disruption_data,
            "recommendation": v.recommendation_data,
            "created_at": v.created_at.isoformat()
        }
        for v in versions
    ]

@router.post("/{decision_id}/trigger")
async def trigger_replanning(
    decision_id: str,
    payload: DynamicReplanningTriggerRequest,
    db: AsyncSession = Depends(get_db)
):
    """Triggers dynamic pre-dispatch re-validation (e.g. Coimbatore demand spike).
    
    Pauses unexecuted transfers, re-optimizes, and creates a new decision version.
    """
    agent = DynamicReplanningAgent(db)
    result = await agent.validate_and_replan(
        decision_id=decision_id,
        disruption_type=payload.disruption_type,
        disruption_details={"spike_units": payload.spike_units, "notes": payload.notes}
    )

    if result.get("status") == "REPLANNING_TRIGGERED":
        await ws_manager.broadcast_event(
            "REPLANNING_TRIGGERED",
            {
                "decision_id": decision_id,
                "new_version": result["new_version"],
                "reason": result["replanning_reason"]
            }
        )

    return result
