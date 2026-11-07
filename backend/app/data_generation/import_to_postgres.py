"""Database ingestion script for RetailMind AI.

Imports generated CSV datasets into Supabase PostgreSQL (or configured database)
using SQLAlchemy 2.0 Async in high-speed batches.
"""

import asyncio
from datetime import datetime, date
from pathlib import Path
import pandas as pd
from sqlalchemy import select, delete, insert, text
from backend.app.database.session import AsyncSessionLocal, engine, Base
from backend.app.models import (
    Store, Product, Supplier, SupplierProduct, StoreProduct, StoreRoute,
    Sale, Inventory, ExternalEvent, SupplierDelivery
)
from backend.app.core.logging import logger

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_RAW = BASE_DIR / "data" / "raw"

async def import_data(clean: bool = True):
    print("=" * 70)
    print(" RetailMind AI: Database Batch Ingestion Pipeline (Supabase PostgreSQL)")
    print("=" * 70)

    # 1. Ensure all 27 tables exist in database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        if clean:
            print("[INFO] Cleaning existing records to ensure fresh 88-SKU consistency...")
            try:
                await session.execute(text("""
                    TRUNCATE TABLE sales, inventory_transactions, inventory, 
                    supplier_deliveries, supplier_products, store_products, 
                    store_routes, external_events, products, suppliers, stores 
                    CASCADE;
                """))
                await session.commit()
                print("[OK] Existing tables truncated cleanly.")
            except Exception as e:
                await session.rollback()
                print(f"[NOTE] Truncate CASCADE exception ({e}), performing table DELETEs...")
                tables_to_delete = [
                    Sale, Inventory, SupplierDelivery, SupplierProduct,
                    StoreProduct, StoreRoute, ExternalEvent, Product, Supplier, Store
                ]
                for tbl in tables_to_delete:
                    await session.execute(delete(tbl))
                await session.commit()
                print("[OK] Tables cleared via DELETE.")

        # 2. Stores
        print("Importing Stores...")
        df_stores = pd.read_csv(DATA_RAW / "stores.csv", dtype={"manager_phone": str})
        store_records = df_stores.to_dict(orient="records")
        for rec in store_records:
            rec["manager_phone"] = str(rec["manager_phone"])
            session.add(Store(**rec))
        await session.commit()
        print(f"[OK] {len(store_records)} Stores imported.")

        # 3. Products (88 SKUs)
        print("Importing Products (88 SKUs across 8 Categories)...")
        df_products = pd.read_csv(DATA_RAW / "products.csv")
        prod_records = df_products.to_dict(orient="records")
        for rec in prod_records:
            session.add(Product(**rec))
        await session.commit()
        print(f"[OK] {len(prod_records)} Products imported.")

        # 4. Suppliers (12 Vendors)
        print("Importing Suppliers (12 Regional Vendors)...")
        df_suppliers = pd.read_csv(DATA_RAW / "suppliers.csv", dtype={"contact_phone": str})
        sup_records = df_suppliers.to_dict(orient="records")
        for rec in sup_records:
            rec["contact_phone"] = str(rec["contact_phone"])
            session.add(Supplier(**rec))
        await session.commit()
        print(f"[OK] {len(sup_records)} Suppliers imported.")

        # 5. Supplier Products
        print("Importing Supplier-Product relationships...")
        df_sup_prod = pd.read_csv(DATA_RAW / "supplier_products.csv")
        sup_prod_records = df_sup_prod.to_dict(orient="records")
        chunk_size = 500
        for i in range(0, len(sup_prod_records), chunk_size):
            chunk = sup_prod_records[i:i + chunk_size]
            await session.execute(insert(SupplierProduct), chunk)
            await session.commit()
        print(f"[OK] {len(sup_prod_records)} Supplier-Product records imported.")

        # 6. Store Products
        print("Importing Store-Product relationships (440 entries)...")
        df_store_prod = pd.read_csv(DATA_RAW / "store_products.csv")
        store_prod_records = df_store_prod.to_dict(orient="records")
        for i in range(0, len(store_prod_records), chunk_size):
            chunk = store_prod_records[i:i + chunk_size]
            await session.execute(insert(StoreProduct), chunk)
            await session.commit()
        print(f"[OK] {len(store_prod_records)} Store-Product records imported.")

        # 7. Store Routes
        print("Importing Store Routes...")
        df_routes = pd.read_csv(DATA_RAW / "store_routes.csv")
        route_records = df_routes.to_dict(orient="records")
        for rec in route_records:
            session.add(StoreRoute(**rec))
        await session.commit()
        print(f"[OK] {len(route_records)} Logistics Routes imported.")

        # 8. Inventory Snapshots (440 entries)
        print("Importing Inventory positions (440 store-product items)...")
        df_inv = pd.read_csv(DATA_RAW / "inventory.csv")
        inv_records = df_inv.to_dict(orient="records")
        for rec in inv_records:
            rec_data = dict(rec)
            rec_data["last_updated"] = datetime.now()
            session.add(Inventory(**rec_data))
        await session.commit()
        print(f"[OK] {len(inv_records)} Inventory records imported.")

        # 9. External Events
        print("Importing External Events...")
        df_events = pd.read_csv(DATA_RAW / "external_events.csv")
        for rec in df_events.to_dict(orient="records"):
            rec_copy = dict(rec)
            rec_copy["event_date"] = date.fromisoformat(str(rec_copy["event_date"]))
            if pd.isna(rec_copy.get("store_id")):
                rec_copy["store_id"] = None
            session.add(ExternalEvent(**rec_copy))
        await session.commit()
        print(f"[OK] {len(df_events)} External Events imported.")

        # 10. Supplier Deliveries
        print("Importing Supplier Deliveries...")
        df_del = pd.read_csv(DATA_RAW / "supplier_deliveries.csv")
        for rec in df_del.to_dict(orient="records"):
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

        # 11. Historical Sales (160,600 records in chunked batches)
        print("Importing 160,600 Sales records in high-performance chunks...")
        df_sales = pd.read_csv(DATA_RAW / "sales.csv")
        cols_to_keep = ["store_id", "product_id", "sale_date", "units_sold", "unit_price", "promotional_flag", "weather_condition", "festival_flag", "stockout_flag"]
        df_sales_clean = df_sales[cols_to_keep].copy()
        df_sales_clean["sale_date"] = pd.to_datetime(df_sales_clean["sale_date"]).dt.date
        df_sales_clean["units_sold"] = df_sales_clean["units_sold"].astype(int)
        df_sales_clean["unit_price"] = df_sales_clean["unit_price"].astype(float)
        df_sales_clean["promotional_flag"] = df_sales_clean["promotional_flag"].astype(bool)
        df_sales_clean["festival_flag"] = df_sales_clean["festival_flag"].astype(bool)
        df_sales_clean["stockout_flag"] = df_sales_clean["stockout_flag"].astype(bool)
        
        records = df_sales_clean.to_dict(orient="records")
        chunk_size = 5000
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            await session.execute(insert(Sale), chunk)
            await session.commit()
            print(f"  ... inserted {min(i + chunk_size, len(records)):,}/{len(records):,} sales records")

    print("=" * 70)
    print(" Supabase Database Ingestion Completed Successfully!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(import_data(clean=True))
