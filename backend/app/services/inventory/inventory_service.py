"""Inventory Management and Ledger Service for RetailMind AI.

Manages physical stock, available stock, reservations, and auditable transaction logs
with strict invariants (available = physical - reserved) and non-negative constraints.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import (
    Inventory, Product, Store, InventoryTransaction
)
from backend.app.core.logging import logger

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class InventoryService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_store_inventory(
        self,
        store_id: str,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves inventory positions with calculated valuation for a store."""
        stmt = (
            select(Inventory, Product)
            .join(Product, Inventory.product_id == Product.product_id)
            .where(Inventory.store_id == store_id)
        )
        if category:
            stmt = stmt.where(Product.category == category)

        res = await self.session.execute(stmt)
        rows = res.all()

        results = []
        for inv, prod in rows:
            # Calculated valuation: available_stock * unit_cost
            val = round(float(inv.available_stock) * float(prod.unit_cost), 2)
            results.append({
                "store_id": inv.store_id,
                "product_id": inv.product_id,
                "product_name": prod.name,
                "category": prod.category,
                "physical_on_hand": inv.physical_on_hand,
                "reserved_stock": inv.reserved_stock,
                "available_stock": inv.available_stock,
                "incoming_stock": inv.incoming_stock,
                "safety_stock": inv.safety_stock,
                "reorder_point": inv.reorder_point,
                "days_of_supply": float(inv.days_of_supply),
                "unit_cost": float(prod.unit_cost),
                "base_price": float(prod.base_price),
                "inventory_valuation": val,
                "last_updated": inv.last_updated.isoformat() if inv.last_updated else None,
            })
        return results

    async def get_product_multi_store_stock(self, product_id: str) -> List[Dict[str, Any]]:
        """Returns stock across all 5 stores for a given product to identify transfer opportunities."""
        stmt = (
            select(Inventory, Store, Product)
            .join(Store, Inventory.store_id == Store.store_id)
            .join(Product, Inventory.product_id == Product.product_id)
            .where(Inventory.product_id == product_id)
        )
        res = await self.session.execute(stmt)
        rows = res.all()

        results = []
        for inv, store, prod in rows:
            surplus = max(0, inv.available_stock - (inv.safety_stock * 2))
            results.append({
                "store_id": store.store_id,
                "store_name": store.name,
                "city": store.city,
                "physical_on_hand": inv.physical_on_hand,
                "available_stock": inv.available_stock,
                "reserved_stock": inv.reserved_stock,
                "incoming_stock": inv.incoming_stock,
                "safety_stock": inv.safety_stock,
                "days_of_supply": float(inv.days_of_supply),
                "surplus_available": surplus,
                "has_surplus": surplus > 20,
            })
        return results

    async def reserve_stock(
        self,
        store_id: str,
        product_id: str,
        quantity: int,
        reference_type: str,
        reference_id: str
    ) -> bool:
        """Atomically reserves stock. available_stock = physical_on_hand - reserved_stock."""
        stmt = (
            select(Inventory)
            .where(Inventory.store_id == store_id, Inventory.product_id == product_id)
            .with_for_update()
        )
        res = await self.session.execute(stmt)
        inv = res.scalar_one_or_none()
        if not inv:
            logger.error(f"Inventory record not found for {store_id}, {product_id}")
            return False

        if inv.available_stock < quantity:
            logger.warning(
                f"Insufficient available stock to reserve: {inv.available_stock} < {quantity}"
            )
            return False

        prev_qty = inv.available_stock
        inv.reserved_stock += quantity
        inv.available_stock = inv.physical_on_hand - inv.reserved_stock
        inv.last_updated = utc_now()

        # Audit ledger
        tx = InventoryTransaction(
            store_id=store_id,
            product_id=product_id,
            transaction_type="RESERVATION",
            quantity_change=quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            previous_quantity=prev_qty,
            resulting_quantity=inv.available_stock,
            created_at=utc_now()
        )
        self.session.add(tx)
        await self.session.commit()
        logger.info(f"Reserved {quantity} of {product_id} at {store_id} for {reference_id}")
        return True

    async def release_reservation(
        self,
        store_id: str,
        product_id: str,
        quantity: int,
        reference_type: str,
        reference_id: str
    ) -> bool:
        """Releases a reservation back to available stock."""
        stmt = (
            select(Inventory)
            .where(Inventory.store_id == store_id, Inventory.product_id == product_id)
            .with_for_update()
        )
        res = await self.session.execute(stmt)
        inv = res.scalar_one_or_none()
        if not inv:
            return False

        release_qty = min(quantity, inv.reserved_stock)
        prev_qty = inv.available_stock
        inv.reserved_stock -= release_qty
        inv.available_stock = inv.physical_on_hand - inv.reserved_stock
        inv.last_updated = utc_now()

        tx = InventoryTransaction(
            store_id=store_id,
            product_id=product_id,
            transaction_type="RESERVATION_RELEASE",
            quantity_change=release_qty,
            reference_type=reference_type,
            reference_id=reference_id,
            previous_quantity=prev_qty,
            resulting_quantity=inv.available_stock,
            created_at=utc_now()
        )
        self.session.add(tx)
        await self.session.commit()
        logger.info(f"Released {release_qty} reserved stock for {product_id} at {store_id}")
        return True

    async def dispatch_stock(
        self,
        store_id: str,
        product_id: str,
        quantity: int,
        reference_id: str
    ) -> bool:
        """Dispatches reserved physical stock (deducts from physical and reserved)."""
        stmt = (
            select(Inventory)
            .where(Inventory.store_id == store_id, Inventory.product_id == product_id)
            .with_for_update()
        )
        res = await self.session.execute(stmt)
        inv = res.scalar_one_or_none()
        if not inv or inv.reserved_stock < quantity:
            return False

        prev_phys = inv.physical_on_hand
        inv.physical_on_hand -= quantity
        inv.reserved_stock -= quantity
        inv.available_stock = inv.physical_on_hand - inv.reserved_stock
        inv.last_updated = utc_now()

        tx = InventoryTransaction(
            store_id=store_id,
            product_id=product_id,
            transaction_type="TRANSFER_OUT",
            quantity_change=-quantity,
            reference_type="TRANSFER_ORDER",
            reference_id=reference_id,
            previous_quantity=prev_phys,
            resulting_quantity=inv.physical_on_hand,
            created_at=utc_now()
        )
        self.session.add(tx)
        await self.session.commit()
        return True

    async def receive_stock(
        self,
        store_id: str,
        product_id: str,
        quantity: int,
        transaction_type: str, # TRANSFER_IN or PURCHASE_RECEIVED
        reference_id: str
    ) -> bool:
        """Receives arriving stock into physical on hand."""
        stmt = (
            select(Inventory)
            .where(Inventory.store_id == store_id, Inventory.product_id == product_id)
            .with_for_update()
        )
        res = await self.session.execute(stmt)
        inv = res.scalar_one_or_none()
        if not inv:
            return False

        prev_phys = inv.physical_on_hand
        inv.physical_on_hand += quantity
        # Ingest incoming stock if previously recorded
        inv.incoming_stock = max(0, inv.incoming_stock - quantity)
        inv.available_stock = inv.physical_on_hand - inv.reserved_stock
        inv.last_updated = utc_now()

        tx = InventoryTransaction(
            store_id=store_id,
            product_id=product_id,
            transaction_type=transaction_type,
            quantity_change=quantity,
            reference_type="LOGISTICS_RECEIPT",
            reference_id=reference_id,
            previous_quantity=prev_phys,
            resulting_quantity=inv.physical_on_hand,
            created_at=utc_now()
        )
        self.session.add(tx)
        await self.session.commit()
        logger.info(f"Received {quantity} of {product_id} at {store_id} ({transaction_type})")
        return True
