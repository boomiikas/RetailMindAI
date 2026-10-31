"""Logistics and ERP Execution API endpoints for RetailMind AI."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.models import TransferOrder, PurchaseOrder, ExecutionLog
from backend.app.services.inventory.inventory_service import InventoryService
from backend.app.websocket.connection_manager import ws_manager

router = APIRouter(prefix="/executions", tags=["Execution"])

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

@router.get("")
async def list_executions(db: AsyncSession = Depends(get_db)):
    """Lists all active transfer and purchase execution orders."""
    trans_stmt = select(TransferOrder).order_by(TransferOrder.created_at.desc())
    transfers = (await db.execute(trans_stmt)).scalars().all()

    po_stmt = select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc())
    pos = (await db.execute(po_stmt)).scalars().all()

    return {
        "transfer_orders": [
            {
                "transfer_id": t.transfer_id,
                "decision_id": t.decision_id,
                "source_store_id": t.source_store_id,
                "dest_store_id": t.dest_store_id,
                "product_id": t.product_id,
                "quantity": t.quantity,
                "cost": float(t.transfer_cost),
                "status": t.status,
                "created_at": t.created_at.isoformat()
            }
            for t in transfers
        ],
        "purchase_orders": [
            {
                "po_id": p.po_id,
                "decision_id": p.decision_id,
                "supplier_id": p.supplier_id,
                "store_id": p.store_id,
                "product_id": p.product_id,
                "quantity": p.quantity,
                "total_cost": float(p.total_cost),
                "status": p.status,
                "expected_delivery_date": p.expected_delivery_date.isoformat()
            }
            for p in pos
        ]
    }

@router.get("/{execution_id}")
async def get_execution_details(execution_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves specific execution order details and logs."""
    order = await db.get(TransferOrder, execution_id)
    if not order:
        po = await db.get(PurchaseOrder, execution_id)
        if not po:
            raise HTTPException(status_code=404, detail=f"Execution order {execution_id} not found")
        return {"type": "PURCHASE_ORDER", "order": po}
    return {"type": "TRANSFER_ORDER", "order": order}

@router.post("/{execution_id}/confirm-dispatch")
async def confirm_dispatch(execution_id: str, db: AsyncSession = Depends(get_db)):
    """Transitions transfer order to DISPATCHED and physically deducts stock from source."""
    order = await db.get(TransferOrder, execution_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Transfer order {execution_id} not found")

    if order.status != "RESERVED":
        raise HTTPException(status_code=400, detail=f"Order must be RESERVED before dispatch. Current: {order.status}")

    inv_service = InventoryService(db)
    dispatched = await inv_service.dispatch_stock(
        store_id=order.source_store_id,
        product_id=order.product_id,
        quantity=order.quantity,
        reference_id=order.transfer_id
    )

    if not dispatched:
        raise HTTPException(status_code=400, detail="Unable to dispatch: Stock reservation verification failed.")

    order.status = "DISPATCHED"
    order.dispatched_at = utc_now()
    await db.commit()

    await ws_manager.broadcast_event(
        "EXECUTION_STEP_COMPLETED",
        {"transfer_id": execution_id, "status": "DISPATCHED"}
    )
    return {"status": "DISPATCHED", "transfer_id": execution_id}

@router.post("/{execution_id}/confirm-receipt")
async def confirm_receipt(execution_id: str, db: AsyncSession = Depends(get_db)):
    """Confirms physical arrival at destination store and adds stock to destination available inventory."""
    order = await db.get(TransferOrder, execution_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Transfer order {execution_id} not found")

    if order.status not in ("DISPATCHED", "IN_TRANSIT"):
        raise HTTPException(status_code=400, detail=f"Order must be DISPATCHED before receipt. Current: {order.status}")

    inv_service = InventoryService(db)
    received = await inv_service.receive_stock(
        store_id=order.dest_store_id,
        product_id=order.product_id,
        quantity=order.quantity,
        transaction_type="TRANSFER_IN",
        reference_id=order.transfer_id
    )

    order.status = "COMPLETED"
    order.received_at = utc_now()
    await db.commit()

    await ws_manager.broadcast_event(
        "EXECUTION_STEP_COMPLETED",
        {"transfer_id": execution_id, "status": "COMPLETED"}
    )
    return {"status": "COMPLETED", "transfer_id": execution_id, "units_added_to_available": order.quantity}
