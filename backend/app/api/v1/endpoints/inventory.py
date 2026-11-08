"""Inventory API endpoints for RetailMind AI."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.models import Product
from backend.app.schemas.contracts import InventoryItemResponse
from backend.app.services.inventory.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryItemResponse])
async def list_inventory(
    store_id: str = Query("SLM_01", description="Store ID filter"),
    category: Optional[str] = Query(None, description="Category filter (DAIRY, STAPLES, etc.)"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves store inventory positions with calculated valuation."""
    service = InventoryService(db)
    items = await service.get_store_inventory(store_id=store_id, category=category)
    return items

@router.get("/all-products")
async def list_all_products(db: AsyncSession = Depends(get_db)):
    """Returns all monitored products in the catalog."""
    prods = (await db.execute(select(Product))).scalars().all()
    return [
        {
            "product_id": p.product_id,
            "name": p.name,
            "category": p.category,
            "base_price": float(p.base_price),
            "unit_cost": float(p.unit_cost),
            "shelf_life_days": p.shelf_life_days
        }
        for p in prods
    ]

@router.get("/stores/{store_id}", response_model=List[InventoryItemResponse])
async def get_store_inventory_details(
    store_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Returns all inventory positions for a specific retail store."""
    service = InventoryService(db)
    items = await service.get_store_inventory(store_id=store_id)
    if not items:
        raise HTTPException(status_code=404, detail=f"No inventory records for store {store_id}")
    return items

@router.get("/products/{product_id}")
async def get_product_distribution(
    product_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Returns multi-store stock distribution for a given product to evaluate transfer surplus."""
    service = InventoryService(db)
    distribution = await service.get_product_multi_store_stock(product_id=product_id)
    if not distribution:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found across stores")
    return {
        "product_id": product_id,
        "stores_count": len(distribution),
        "distribution": distribution
    }
