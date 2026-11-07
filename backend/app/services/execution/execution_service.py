"""Execution Service for RetailMind AI.

Deterministic operational service orchestrating business actions:
- Atomic stock reservations with invariants
- Inter-store Transfer Orders
- Purchase Orders
- Audit trail execution logging
Zero LLM involvement for reliable transaction execution.
"""

from datetime import datetime, timezone, date, timedelta
from typing import Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import (
    DecisionRecord, TransferOrder, PurchaseOrder, PromotionAction, ExecutionLog
)
from backend.app.services.inventory.inventory_service import InventoryService
from backend.app.core.logging import logger

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ExecutionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.inventory_service = InventoryService(session)

    async def execute_approved_plan(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Executes an approved decision plan deterministically."""
        decision_id = state.get("decision_id")
        action = state.get("chosen_recommendation", {})
        action_type = action.get("action_type")
        logs = state.get("execution_logs", [])

        logger.info(f"[ExecutionService] Executing action {action_type} for Decision: {decision_id}")

        # Check DB decision status
        dec_obj = await self.session.get(DecisionRecord, decision_id)
        if not dec_obj or dec_obj.decision_status != "APPROVED":
            logger.warning(f"[ExecutionService] Execution aborted: Decision {decision_id} is not APPROVED.")
            return state

        if action_type == "INTER_STORE_TRANSFER":
            src_store = action.get("source_store_id")
            dst_store = action.get("dest_store_id") or state.get("store_id", "SLM_01")
            qty = action.get("quantity", 0)
            cost = action.get("expected_cost", 0.0)

            # 1. Reserve source inventory
            reserved = await self.inventory_service.reserve_stock(
                store_id=src_store,
                product_id=state["product_id"],
                quantity=qty,
                reference_type="TRANSFER_ORDER",
                reference_id=decision_id
            )
            if not reserved:
                dec_obj.execution_status = "FAILED"
                await self.session.commit()
                logs.append(f"Failed to reserve {qty} units at source store {src_store}.")
                state["execution_status"] = "FAILED"
                return state

            # 2. Create TransferOrder record
            transfer_id = f"TRF_{decision_id}"
            order = TransferOrder(
                transfer_id=transfer_id,
                decision_id=decision_id,
                source_store_id=src_store,
                dest_store_id=dst_store,
                product_id=state["product_id"],
                quantity=qty,
                transfer_cost=cost,
                status="RESERVED",
                created_at=utc_now()
            )
            self.session.add(order)

            # Update decision execution status
            dec_obj.execution_status = "RESERVED"
            state["transfer_order_id"] = transfer_id
            state["execution_status"] = "RESERVED"

            exec_log = ExecutionLog(
                entity_type="TRANSFER_ORDER",
                entity_id=transfer_id,
                action="RESERVED_STOCK",
                previous_status="NOT_STARTED",
                new_status="RESERVED",
                details={"source": src_store, "destination": dst_store, "quantity": qty, "cost": cost},
                idempotency_key=state.get("idempotency_key"),
                created_at=utc_now()
            )
            self.session.add(exec_log)
            await self.session.commit()
            logs.append(f"Created TransferOrder {transfer_id}: Reserved {qty} units at {src_store}.")

        elif action_type == "REPLENISH_SUPPLIER":
            sup_id = action.get("source_store_id") or "SUP_01"
            qty = action.get("quantity", 50)
            unit_cost = float(action.get("expected_cost", 0.0)) / max(1, qty)

            po_id = f"PO_{decision_id}"
            po = PurchaseOrder(
                po_id=po_id,
                decision_id=decision_id,
                supplier_id=sup_id,
                store_id=state["store_id"],
                product_id=state["product_id"],
                quantity=qty,
                unit_cost=unit_cost,
                total_cost=float(action.get("expected_cost", 0.0)),
                status="ORDERED",
                expected_delivery_date=date.today() + timedelta(days=2),
                created_at=utc_now()
            )
            self.session.add(po)
            dec_obj.execution_status = "ORDERED"
            state["purchase_order_id"] = po_id
            state["execution_status"] = "ORDERED"

            exec_log = ExecutionLog(
                entity_type="PURCHASE_ORDER",
                entity_id=po_id,
                action="CREATED_PO",
                previous_status="NOT_STARTED",
                new_status="ORDERED",
                details={"supplier_id": sup_id, "quantity": qty},
                idempotency_key=state.get("idempotency_key"),
                created_at=utc_now()
            )
            self.session.add(exec_log)
            await self.session.commit()
            logs.append(f"Created PurchaseOrder {po_id} with {sup_id} for {qty} units.")

        state["execution_logs"] = logs
        return state

# Alias for backward compatibility
ExecutionAgent = ExecutionService
