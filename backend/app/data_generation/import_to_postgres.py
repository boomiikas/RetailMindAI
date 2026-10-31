"""Database ingestion script for RetailMind AI.

Imports generated CSV datasets into PostgreSQL (or configured database)
using SQLAlchemy 2.0 Async in high-speed batches.
"""

import asyncio
from datetime import datetime, date
from pathlib import Path
import pandas as pd
from sqlalchemy import select, delete, insert
from backend.app.database.session import AsyncSessionLocal, engine, Base
from backend.app.models import (
    Store, Product, Supplier, SupplierProduct, StoreProduct, StoreRoute,
    Sale, Inventory, ExternalEvent, SupplierDelivery
)
from backend.app.core.logging import logger

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_RAW = BASE_DIR / "data" / "raw"

async def import_data():
    print("=" * 70)
    print(" RetailMind AI: Database Batch Ingestion Pipeline")
    print("=" * 70)

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Stores
        print("Importing Stores...")
        df_stores = pd.read_csv(DATA_RAW / "stores.csv")
        store_records = df_stores.to_dict(orient="records")
        for rec in store_records:
            existing = await session.get(Store, rec["store_id"])
            if not existing:
                session.add(Store(**rec))
        await session.commit()
        print(f"[OK] {len(store_records)} Stores imported.")

        # 2. Products
        print("Importing Products...")
        df_products = pd.read_csv(DATA_RAW / "products.csv")
        prod_records = df_products.to_dict(orient="records")
        for rec in prod_records:
            existing = await session.get(Product, rec["product_id"])
            if not existing:
                session.add(Product(**rec))
        await session.commit()
        print(f"[OK] {len(prod_records)} Products imported.")

        # 3. Suppliers
        print("Importing Suppliers...")
        df_suppliers = pd.read_csv(DATA_RAW / "suppliers.csv")
        sup_records = df_suppliers.to_dict(orient="records")
        for rec in sup_records:
            existing = await session.get(Supplier, rec["supplier_id"])
            if not existing:
                session.add(Supplier(**rec))
        await session.commit()
        print(f"[OK] {len(sup_records)} Suppliers imported.")

        # 4. Supplier Products
        print("Importing Supplier-Product relationships...")
        df_sup_prod = pd.read_csv(DATA_RAW / "supplier_products.csv")
        sup_prod_records = df_sup_prod.to_dict(orient="records")
        for rec in sup_prod_records:
            stmt = select(SupplierProduct).where(
                SupplierProduct.supplier_id == rec["supplier_id"],
                SupplierProduct.product_id == rec["product_id"]
            )
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                session.add(SupplierProduct(**rec))
        await session.commit()
        print(f"[OK] {len(sup_prod_records)} Supplier-Product records imported.")

        # 5. Store Products
        print("Importing Store-Product relationships...")
        df_store_prod = pd.read_csv(DATA_RAW / "store_products.csv")
        store_prod_records = df_store_prod.to_dict(orient="records")
        for rec in store_prod_records:
            stmt = select(StoreProduct).where(
                StoreProduct.store_id == rec["store_id"],
                StoreProduct.product_id == rec["product_id"]
            )
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                session.add(StoreProduct(**rec))
        await session.commit()
        print(f"[OK] {len(store_prod_records)} Store-Product records imported.")

        # 6. Store Routes
        print("Importing Store Routes...")
        df_routes = pd.read_csv(DATA_RAW / "store_routes.csv")
        route_records = df_routes.to_dict(orient="records")
        for rec in route_records:
            existing = await session.get(StoreRoute, rec["route_id"])
            if not existing:
                session.add(StoreRoute(**rec))
        await session.commit()
        print(f"[OK] {len(route_records)} Logistics Routes imported.")

        # 7. Inventory Snapshots
        print("Importing Inventory positions...")
        df_inv = pd.read_csv(DATA_RAW / "inventory.csv")
        inv_records = df_inv.to_dict(orient="records")
        for rec in inv_records:
            stmt = select(Inventory).where(
                Inventory.store_id == rec["store_id"],
                Inventory.product_id == rec["product_id"]
            )
            res = await session.execute(stmt)
            inv_obj = res.scalar_one_or_none()
            rec_data = dict(rec)
            rec_data["last_updated"] = datetime.now()
            if not inv_obj:
                session.add(Inventory(**rec_data))
            else:
                for k, v in rec_data.items():
                    setattr(inv_obj, k, v)
        await session.commit()
        print(f"[OK] {len(inv_records)} Inventory records imported.")

        # 8. External Events
        print("Importing External Events...")
        df_events = pd.read_csv(DATA_RAW / "external_events.csv")
        for rec in df_events.to_dict(orient="records"):
            existing = await session.get(ExternalEvent, rec["event_id"])
            if not existing:
                rec_copy = dict(rec)
                rec_copy["event_date"] = date.fromisoformat(str(rec_copy["event_date"]))
                if pd.isna(rec_copy.get("store_id")):
                    rec_copy["store_id"] = None
                session.add(ExternalEvent(**rec_copy))
        await session.commit()
        print(f"[OK] {len(df_events)} External Events imported.")

        # 9. Supplier Deliveries
        print("Importing Supplier Deliveries...")
        df_del = pd.read_csv(DATA_RAW / "supplier_deliveries.csv")
        for rec in df_del.to_dict(orient="records"):
            existing = await session.get(SupplierDelivery, rec["delivery_id"])
            if not existing:
                rec_copy = dict(rec)
                rec_copy["order_date"] = date.fromisoformat(str(rec_copy["order_date"]))
                rec_copy["expected_delivery_date"] = date.fromisoformat(str(rec_copy["expected_delivery_date"]))
                if pd.notna(rec_copy.get("actual_delivery_date")):
                    rec_copy["actual_delivery_date"] = date.fromisoformat(str(rec_copy["actual_delivery_date"]))
                else:
                    rec_copy["actual_delivery_date"] = None
                session.add(SupplierDelivery(**rec_copy))
        await session.commit()
        print(f"[OK] {len(df_del)} Supplier Deliveries imported.")

        # 10. Historical Sales (Chunked Bulk Insert for 109,500 records)
        print("Importing 109,500 Sales records in high-performance chunks...")
        # Check if sales already loaded
        stmt = select(Sale.sale_id).limit(1)
        res = await session.execute(stmt)
        if res.scalar_one_or_none():
            print("[INFO] Sales table already populated. Skipping sales bulk insert.")
        else:
            df_sales = pd.read_csv(DATA_RAW / "sales.csv")
            # Drop true_demand_latent if present as it's not in Sale DB table
            cols_to_keep = ["store_id", "product_id", "sale_date", "units_sold", "unit_price", "promotional_flag", "weather_condition", "festival_flag", "stockout_flag"]
            df_sales_clean = df_sales[cols_to_keep].copy()
            df_sales_clean["sale_date"] = pd.to_datetime(df_sales_clean["sale_date"]).dt.date
            
            records = df_sales_clean.to_dict(orient="records")
            chunk_size = 5000
            for i in range(0, len(records), chunk_size):
                chunk = records[i:i + chunk_size]
                await session.execute(insert(Sale), chunk)
                await session.commit()
                print(f"  ... inserted {min(i + chunk_size, len(records)):,}/{len(records):,} sales records")

    print("=" * 70)
    print(" Database Batch Ingestion Completed Successfully!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(import_data())
