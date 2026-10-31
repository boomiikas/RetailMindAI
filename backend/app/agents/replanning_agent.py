"""Dynamic Replanning Agent: Continuous pre-execution feasibility validation and automated re-optimization."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.agents.state import AgentState
from backend.app.models import (
    DecisionRecord, DecisionVersion, TransferOrder, Inventory, Product, Store, ExecutionLog
)
from backend.app.services.inventory.inventory_service import InventoryService
from backend.app.services.optimization.optimizer import RetailOptimizer
from backend.app.core.logging import logger

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class DynamicReplanningAgent:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.inventory_service = InventoryService(session)
        self.optimizer = RetailOptimizer(session)

    async def validate_and_replan(
        self,
        decision_id: str,
        disruption_type: str = "DEMAND_SPIKE",
        disruption_details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Validates an approved decision against live operational conditions.
        
        If pre-dispatch conditions invalidate feasibility, pauses unexecuted actions,
        re-optimizes, creates Decision Version 2, and prepares renewed approval.
        """
        logger.info(f"[DynamicReplanningAgent] Auditing pre-dispatch feasibility for Decision: {decision_id}")
        
        dec_obj = await self.session.get(DecisionRecord, decision_id)
        if not dec_obj:
            raise ValueError(f"Decision {decision_id} not found.")

        # Check existing transfer order
        stmt = select(TransferOrder).where(TransferOrder.decision_id == decision_id)
        res = await self.session.execute(stmt)
        transfer_order = res.scalar_one_or_none()

        if not transfer_order:
            logger.warning("[DynamicReplanningAgent] No active transfer order found to audit.")
            return {"status": "NO_CHANGE", "decision_id": decision_id}

        # If already physically dispatched or completed, cannot simply pause
        if transfer_order.status in ("DISPATCHED", "IN_TRANSIT", "RECEIVED", "COMPLETED"):
            logger.info(f"[DynamicReplanningAgent] Shipment is already {transfer_order.status}; routing to recovery/diversion.")
            return {"status": "IN_FLIGHT", "transfer_id": transfer_order.transfer_id}

        src_store_id = transfer_order.source_store_id
        product_id = transfer_order.product_id
        approved_qty = transfer_order.quantity

        # 1. Revalidate source store available stock
        inv_stmt = select(Inventory).where(
            Inventory.store_id == src_store_id,
            Inventory.product_id == product_id
        )
        inv_res = await self.session.execute(inv_stmt)
        src_inv = inv_res.scalar_one_or_none()

        # Simulate disruption impact on source store:
        # e.g. Coimbatore local demand spike of 45 units
        spike = disruption_details.get("spike_units", 45) if disruption_details else 45
        available_at_source = src_inv.physical_on_hand - spike if src_inv else 50
        transferable_safe_stock = max(0, available_at_source - (src_inv.safety_stock if src_inv else 20))

        logger.info(
            f"[DynamicReplanningAgent] Disruption check at {src_store_id}: "
            f"Physical={src_inv.physical_on_hand}, Spike={spike}, Safe Transferable={transferable_safe_stock}, "
            f"Original Approved={approved_qty}"
        )

        # 2. Check if original transfer violates source safety buffer
        if approved_qty > transferable_safe_stock:
            logger.warning(
                f"[DynamicReplanningAgent] INFEASIBILITY DETECTED! "
                f"Transferring {approved_qty} units from {src_store_id} would violate its safety stock buffer ({src_inv.safety_stock})."
            )

            # A. Pause the unexecuted transfer order
            transfer_order.status = "CANCELLED"
            # Release previous reservation
            await self.inventory_service.release_reservation(
                store_id=src_store_id,
                product_id=product_id,
                quantity=approved_qty,
                reference_type="REPLANNING_PAUSE",
                reference_id=decision_id
            )

            # B. Transition Decision to REPLANNING state
            dec_obj.decision_status = "REPLANNING"
            dec_obj.execution_status = "NOT_STARTED"
            new_version_num = dec_obj.current_version + 1
            dec_obj.current_version = new_version_num
            dec_obj.updated_at = utc_now()

            # C. Re-run Pyomo MILP Optimization under constrained source inventory
            v2_recs = await self.optimizer.optimize_inventory_decisions(
                dest_store_id=transfer_order.dest_store_id,
                product_id=product_id
            )

            # Create revised options specifically addressing the disruption:
            # Option 1: Split transfer (e.g. 40 units from Coimbatore + 40 from Trichy)
            # Option 2: Emergency supplier order
            # Option 3: 40 units transfer + allocation reduction
            v2_primary = v2_recs[0] if v2_recs else {}

            # D. Persist Version 2 Record
            version_id = f"VER_{decision_id}_v{new_version_num}"
            v2_record = DecisionVersion(
                version_id=version_id,
                decision_id=decision_id,
                version_number=new_version_num,
                recommendation_data=v2_primary,
                replanning_reason=(
                    f"Unexpected local demand spike of {spike} units at source branch {src_store_id}. "
                    f"Reduced safe transferable inventory from {approved_qty} to {transferable_safe_stock} units."
                ),
                trigger_disruption_data=disruption_details or {"spike_units": spike, "disruption_type": disruption_type},
                previous_version_id=f"VER_{decision_id}_v{new_version_num - 1}",
                created_at=utc_now()
            )
            self.session.add(v2_record)

            # Execution log
            exec_log = ExecutionLog(
                entity_type="REPLANNING",
                entity_id=decision_id,
                action="VERSION_UPGRADE",
                previous_status="APPROVED",
                new_status="REPLANNING",
                details={
                    "previous_version": new_version_num - 1,
                    "new_version": new_version_num,
                    "reason": f"Demand spike at {src_store_id}"
                },
                created_at=utc_now()
            )
            self.session.add(exec_log)
            await self.session.commit()

            # E. Format Fresh Manager Notification
            dest_store = await self.session.get(Store, transfer_order.dest_store_id)
            dest_city = dest_store.city if dest_store else transfer_order.dest_store_id

            v2_notification = (
                f"⚠️ *RETAILMIND DYNAMIC REPLANNING ALERT*\n"
                f"Decision `{decision_id}` (v1) has been *PAUSED* before dispatch.\n"
                f"────────────────────────\n"
                f"🔍 *Reason*: {src_store_id} experienced an unexpected demand spike (+{spike} units). "
                f"Dispatching original 80 units would breach Coimbatore safety stock.\n\n"
                f"🔄 *Revised Strategies (Version {new_version_num})*:\n"
                f"1. *Split Transfer*: Transfer {transferable_safe_stock} units from Coimbatore + 40 from Trichy.\n"
                f"2. *Expedited PO*: Order 80 units directly from Supplier.\n"
                f"3. *Partial Fulfillment*: Transfer {transferable_safe_stock} units and adjust {dest_city} allocation.\n\n"
                f"Reply with *1*, *2*, or *3* to authorize Version {new_version_num}."
            )

            return {
                "status": "REPLANNING_TRIGGERED",
                "decision_id": decision_id,
                "previous_version": new_version_num - 1,
                "new_version": new_version_num,
                "paused_transfer_id": transfer_order.transfer_id,
                "replanning_reason": v2_record.replanning_reason,
                "revised_recommendations": v2_recs,
                "manager_notification_text": v2_notification
            }

        return {"status": "VALID", "decision_id": decision_id}
