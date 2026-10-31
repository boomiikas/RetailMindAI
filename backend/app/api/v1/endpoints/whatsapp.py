"""WhatsApp API & Local Mock Testing endpoints for RetailMind AI."""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from backend.app.database.session import get_db
from backend.app.whatsapp.webhook_handler import WhatsAppWebhookHandler
from backend.app.whatsapp.mock_adapter import mock_whatsapp

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Store Manager Assistant"])

class SimulateApprovalRequest(BaseModel):
    manager_phone: str = "+919843123456"
    decision_id: str
    version: int = 1
    option_chosen: str = "INTER_STORE_TRANSFER"

class SimulateQueryRequest(BaseModel):
    manager_phone: str = "+919843123456"
    query_text: str = "Which products are running low in my store?"

@router.get("/webhook")
async def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    db: AsyncSession = Depends(get_db)
):
    """Meta WhatsApp Cloud API Webhook Verification."""
    handler = WhatsAppWebhookHandler(db)
    challenge = handler.verify_webhook(hub_mode, hub_verify_token, hub_challenge)
    if challenge:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")

@router.post("/webhook")
async def receive_whatsapp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Receives inbound messages and interactive button responses from Meta WhatsApp."""
    payload = await request.json()
    handler = WhatsAppWebhookHandler(db)
    result = await handler.handle_payload(payload)
    return result

@router.post("/simulate-approval")
async def simulate_local_whatsapp_approval(
    payload: SimulateApprovalRequest,
    db: AsyncSession = Depends(get_db)
):
    """Simulates an interactive WhatsApp approval button click offline without Meta credentials."""
    from backend.app.models import DecisionRecord
    dec_obj = await db.get(DecisionRecord, payload.decision_id)
    if not dec_obj:
        dec_obj = DecisionRecord(
            decision_id=payload.decision_id,
            current_version=payload.version,
            decision_status="PENDING",
            execution_status="NOT_STARTED",
            original_recommendation_snapshot={
                "action_type": payload.option_chosen,
                "product_id": "MILK_001",
                "source_store_id": "CBE_01",
                "dest_store_id": "SLM_01",
                "quantity": 50,
                "expected_cost": 100.0,
                "expected_net_profit": 500.0
            }
        )
        db.add(dec_obj)
        await db.commit()

    webhook_data = mock_whatsapp.simulate_manager_button_click(
        manager_phone=payload.manager_phone,
        decision_id=payload.decision_id,
        version=payload.version,
        option_chosen=payload.option_chosen
    )
    handler = WhatsAppWebhookHandler(db)
    result = await handler.handle_payload(webhook_data)
    return {
        "simulation": "SUCCESS",
        "simulated_button_payload": webhook_data,
        "handler_result": result
    }

@router.post("/simulate-query")
async def simulate_local_whatsapp_query(
    payload: SimulateQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """Simulates a natural language WhatsApp query from a store manager."""
    webhook_data = mock_whatsapp.simulate_manager_text_message(
        manager_phone=payload.manager_phone,
        text=payload.query_text
    )
    handler = WhatsAppWebhookHandler(db)
    result = await handler.handle_payload(webhook_data)
    return {
        "simulation": "SUCCESS",
        "query": payload.query_text,
        "handler_result": result
    }
