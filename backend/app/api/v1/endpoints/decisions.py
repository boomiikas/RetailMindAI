"""Decision Approvals API endpoints for RetailMind AI."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.models import DecisionRecord, DecisionVersion, ManagerApproval
from backend.app.schemas.contracts import DecisionApprovalRequest
from backend.app.agents.execution_agent import ExecutionAgent
from backend.app.services.optimization.optimizer import RetailOptimizer
from backend.app.websocket.connection_manager import ws_manager

router = APIRouter(prefix="/decisions", tags=["Approvals"])

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

@router.post("/{decision_id}/approve")
async def approve_decision(
    decision_id: str,
    payload: DecisionApprovalRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authorizes an AI recommendation, reserves inventory, and starts execution workflow."""
    # 1. Idempotency Check
    existing_stmt = select(ManagerApproval).where(ManagerApproval.idempotency_key == payload.idempotency_key)
    existing_appr = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing_appr:
        return {
            "status": "DUPLICATE_IGNORED",
            "message": f"Approval with idempotency key '{payload.idempotency_key}' already processed.",
            "decision_id": decision_id
        }

    dec = await db.get(DecisionRecord, decision_id)
    if not dec:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

    if dec.decision_status in ("REJECTED", "EXPIRED", "CANCELLED"):
        raise HTTPException(status_code=400, detail=f"Cannot approve decision in {dec.decision_status} status")

    # 2. Record Manager Approval
    approval = ManagerApproval(
        approval_id=f"APPR_{decision_id}_v{dec.current_version}",
        decision_id=decision_id,
        version_number=dec.current_version,
        manager_phone=payload.manager_id,
        channel=payload.channel,
        decision_outcome="APPROVED",
        option_selected=payload.option_selected,
        notes=payload.notes,
        idempotency_key=payload.idempotency_key,
        timestamp=utc_now()
    )
    db.add(approval)

    # 3. Update Decision Status
    dec.decision_status = "APPROVED"
    dec.updated_at = utc_now()
    await db.commit()

    # 4. Trigger Execution Agent
    # Fetch recommendation data for this version
    ver_stmt = select(DecisionVersion).where(
        DecisionVersion.decision_id == decision_id,
        DecisionVersion.version_number == dec.current_version
    )
    ver_obj = (await db.execute(ver_stmt)).scalar_one_or_none()
    rec_data = ver_obj.recommendation_data if ver_obj else dec.original_recommendation_snapshot

    exec_agent = ExecutionAgent(db)
    exec_state = {
        "decision_id": decision_id,
        "store_id": rec_data.get("dest_store_id", "SLM_01"),
        "product_id": rec_data.get("product_id", "MILK_001"),
        "chosen_recommendation": rec_data,
        "idempotency_key": payload.idempotency_key,
        "execution_logs": []
    }
    exec_res = await exec_agent.execute_approved_plan(exec_state)

    # 5. Broadcast to real-time WebSocket
    await ws_manager.broadcast_event(
        "APPROVAL_STATUS_CHANGED",
        {"decision_id": decision_id, "status": "APPROVED", "execution_status": dec.execution_status}
    )

    return {
        "status": "APPROVED",
        "decision_id": decision_id,
        "version_authorized": dec.current_version,
        "execution_status": dec.execution_status,
        "logs": exec_res.get("execution_logs", [])
    }

@router.post("/{decision_id}/reject")
async def reject_decision(
    decision_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Rejects a recommendation and cancels any pending unreserved preparation."""
    dec = await db.get(DecisionRecord, decision_id)
    if not dec:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

    dec.decision_status = "REJECTED"
    dec.updated_at = utc_now()
    await db.commit()

    await ws_manager.broadcast_event(
        "APPROVAL_STATUS_CHANGED",
        {"decision_id": decision_id, "status": "REJECTED"}
    )
    return {"status": "REJECTED", "decision_id": decision_id}

@router.post("/{decision_id}/request-alternatives")
async def request_alternatives(
    decision_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Re-runs optimizer to generate alternative strategies."""
    dec = await db.get(DecisionRecord, decision_id)
    if not dec:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

    rec = dec.original_recommendation_snapshot
    optimizer = RetailOptimizer(db)
    recs = await optimizer.optimize_inventory_decisions(
        dest_store_id=rec.get("dest_store_id", "SLM_01"),
        product_id=rec.get("product_id", "MILK_001")
    )
    return {
        "decision_id": decision_id,
        "status": "ALTERNATIVES_GENERATED",
        "alternatives": recs
    }
