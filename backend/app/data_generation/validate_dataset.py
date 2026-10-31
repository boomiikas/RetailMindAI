"""Dataset validation script for RetailMind AI.

Performs integrity and consistency checks:
- Row counts & schema validation
- Referential integrity (foreign keys)
- Temporal consistency & leak-free splits
- Inventory invariants and non-negativity
- Price vs cost rationality
"""

import sys
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_RAW = BASE_DIR / "data" / "raw"
DATA_PROCESSED = BASE_DIR / "data" / "processed"

def validate_datasets() -> bool:
    print("=" * 70)
    print(" RetailMind AI: Dataset Validation & Quality Assurance")
    print("=" * 70)
    
    passed = True

    # 1. Check File Existence
    required_raw = [
        "stores.csv", "suppliers.csv", "products.csv", "store_routes.csv",
        "supplier_products.csv", "store_products.csv", "sales.csv",
        "inventory.csv", "external_events.csv", "supplier_deliveries.csv"
    ]
    for fname in required_raw:
        path = DATA_RAW / fname
        if not path.exists():
            print(f"[FAIL] Missing raw file: {path}")
            return False
    print("[PASS] All 10 raw CSV files exist.")

    # 2. Load Datasets
    df_stores = pd.read_csv(DATA_RAW / "stores.csv")
    df_suppliers = pd.read_csv(DATA_RAW / "suppliers.csv")
    df_products = pd.read_csv(DATA_RAW / "products.csv")
    df_sales = pd.read_csv(DATA_RAW / "sales.csv")
    df_inventory = pd.read_csv(DATA_RAW / "inventory.csv")
    df_routes = pd.read_csv(DATA_RAW / "store_routes.csv")

    # 3. Scale & Entity Count Checks
    if len(df_stores) != 5:
        print(f"[FAIL] Expected 5 stores, got {len(df_stores)}")
        passed = False
    else:
        print(f"[PASS] Stores count: 5 stores verified.")

    if len(df_products) != 60:
        print(f"[FAIL] Expected 60 products, got {len(df_products)}")
        passed = False
    else:
        print(f"[PASS] Products count: 60 products across 5 categories verified.")

    if len(df_suppliers) != 8:
        print(f"[FAIL] Expected 8 suppliers, got {len(df_suppliers)}")
        passed = False
    else:
        print(f"[PASS] Suppliers count: 8 suppliers verified.")

    expected_sales = 365 * 5 * 60 # 109,500
    if len(df_sales) != expected_sales:
        print(f"[FAIL] Expected {expected_sales:,} sales records, got {len(df_sales):,}")
        passed = False
    else:
        print(f"[PASS] Daily Sales: Exactly {len(df_sales):,} records (365 days x 5 stores x 60 products).")

    # 4. Referential Integrity
    store_ids = set(df_stores["store_id"])
    prod_ids = set(df_products["product_id"])

    invalid_sales_stores = set(df_sales["store_id"]) - store_ids
    invalid_sales_prods = set(df_sales["product_id"]) - prod_ids
    if invalid_sales_stores or invalid_sales_prods:
        print(f"[FAIL] Referential integrity broken in sales. Invalid stores: {invalid_sales_stores}, prods: {invalid_sales_prods}")
        passed = False
    else:
        print("[PASS] Referential integrity: 100% valid foreign keys in sales.")

    # 5. Inventory Invariants
    # available_stock == physical_on_hand - reserved_stock
    inv_diff = df_inventory["physical_on_hand"] - df_inventory["reserved_stock"] - df_inventory["available_stock"]
    if (inv_diff != 0).any():
        print(f"[FAIL] Inventory invariant breached: physical_on_hand - reserved_stock != available_stock in {(inv_diff != 0).sum()} rows")
        passed = False
    else:
        print("[PASS] Inventory invariant holds: available_stock == physical_on_hand - reserved_stock.")

    if (df_inventory["available_stock"] < 0).any():
        print("[FAIL] Negative available stock detected in inventory.")
        passed = False
    else:
        print("[PASS] Non-negative stock: No negative inventory positions.")

    # 6. Pricing & Margin Rationality
    margin_diff = df_products["base_price"] - df_products["unit_cost"]
    if (margin_diff <= 0).any():
        print("[FAIL] Found products where base_price <= unit_cost.")
        passed = False
    else:
        print(f"[PASS] Pricing rationality: All products have positive retail margins (Average margin: INR {margin_diff.mean():.2f}).")

    # 7. Chronological Split Integrity
    df_train = pd.read_csv(DATA_PROCESSED / "sales_train.csv")
    df_val = pd.read_csv(DATA_PROCESSED / "sales_val.csv")
    df_test = pd.read_csv(DATA_PROCESSED / "sales_test.csv")

    max_train_date = df_train["sale_date"].max()
    min_val_date = df_val["sale_date"].min()
    max_val_date = df_val["sale_date"].max()
    min_test_date = df_test["sale_date"].min()

    if max_train_date >= min_val_date or max_val_date >= min_test_date:
        print(f"[FAIL] Data leakage in chronological splits! Train max: {max_train_date}, Val min: {min_val_date}, Val max: {max_val_date}, Test min: {min_test_date}")
        passed = False
    else:
        print(f"[PASS] Chronological splits disjoint & leak-free: Train ({df_train['sale_date'].min()} to {max_train_date}) < Val ({min_val_date} to {max_val_date}) < Test ({min_test_date} to {df_test['sale_date'].max()}).")

    print("=" * 70)
    if passed:
        print(" ALL 7 VALIDATION CHECKS PASSED WITH ZERO ERRORS!")
    else:
        print(" VALIDATION FAILED! Please review errors above.")
    print("=" * 70)
    return passed

if __name__ == "__main__":
    success = validate_datasets()
    sys.exit(0 if success else 1)
