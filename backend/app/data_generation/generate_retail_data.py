"""Synthetic Retail Dataset Generator for RetailMind AI.

Generates reproducible, business-correlated multi-store retail data:
- 5 Tamil Nadu stores
- 60 products across 5 categories
- 8 suppliers
- 365 days (12 months) of daily sales: 109,500 records
- Inventory snapshots, supplier lead times, delivery delays, logistics routes
- Festivals (Pongal, Tamil New Year, Diwali), weather (Heatwave, Monsoon), promotions
- Censored demand and stockout flags
- Chronological train/validation/test splits
"""

import os
import random
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_RAW_DIR = BASE_DIR / "data" / "raw"
DATA_PROCESSED_DIR = BASE_DIR / "data" / "processed"

DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# 1. Stores (5 Tamil Nadu Branches)
STORES_DATA = [
    {
        "store_id": "CHN_01",
        "name": "RetailMind Chennai Flagship",
        "city": "Chennai",
        "region": "Tamil Nadu",
        "address": "42 Anna Nagar 2nd Avenue, Chennai 600040",
        "size_sqft": 14500,
        "store_type": "HYPERMARKET",
        "manager_name": "R. Sundaram",
        "manager_phone": "+919840123456",
        "active": True,
        "demand_multiplier": 1.45,
    },
    {
        "store_id": "CBE_01",
        "name": "RetailMind Coimbatore Hub",
        "city": "Coimbatore",
        "region": "Tamil Nadu",
        "address": "18 RS Puram West, Coimbatore 641002",
        "size_sqft": 9800,
        "store_type": "SUPERMARKET",
        "manager_name": "K. Murugan",
        "manager_phone": "+919842123456",
        "active": True,
        "demand_multiplier": 1.15,
    },
    {
        "store_id": "SLM_01",
        "name": "RetailMind Salem Central",
        "city": "Salem",
        "region": "Tamil Nadu",
        "address": "88 Junction Main Road, Salem 636005",
        "size_sqft": 7500,
        "store_type": "SUPERMARKET",
        "manager_name": "S. Selvan",
        "manager_phone": "+919843123456",
        "active": True,
        "demand_multiplier": 0.85,
    },
    {
        "store_id": "MDU_01",
        "name": "RetailMind Madurai Express",
        "city": "Madurai",
        "region": "Tamil Nadu",
        "address": "105 Meenakshi Amman Kovil St, Madurai 625001",
        "size_sqft": 8200,
        "store_type": "SUPERMARKET",
        "manager_name": "P. Ramanathan",
        "manager_phone": "+919845123456",
        "active": True,
        "demand_multiplier": 0.95,
    },
    {
        "store_id": "TRY_01",
        "name": "RetailMind Trichy Central",
        "city": "Trichy",
        "region": "Tamil Nadu",
        "address": "14 Salai Road, Woraiyur, Trichy 620003",
        "size_sqft": 6900,
        "store_type": "SUPERMARKET",
        "manager_name": "M. Alagappan",
        "manager_phone": "+919846123456",
        "active": True,
        "demand_multiplier": 0.80,
    },
]

# 2. Suppliers (8 Dedicated Regional Suppliers)
SUPPLIERS_DATA = [
    {"supplier_id": "SUP_01", "name": "Aavin Dairy Co-operative", "contact_phone": "+919444011111", "email": "orders@aavin.tn.gov.in", "lead_time_days": 1, "reliability_score": 0.94, "min_order_qty": 50, "max_order_qty": 3000, "category": "DAIRY"},
    {"supplier_id": "SUP_02", "name": "Milma Fresh Dairy", "contact_phone": "+919444022222", "email": "supply@milmadairy.in", "lead_time_days": 2, "reliability_score": 0.88, "min_order_qty": 40, "max_order_qty": 2000, "category": "DAIRY"},
    {"supplier_id": "SUP_03", "name": "Tamil Nadu Agro Staples Ltd", "contact_phone": "+919444033333", "email": "sales@tnagro.com", "lead_time_days": 3, "reliability_score": 0.96, "min_order_qty": 100, "max_order_qty": 5000, "category": "STAPLES"},
    {"supplier_id": "SUP_04", "name": "Kaveri Grain Mills", "contact_phone": "+919444044444", "email": "kaveri@grainmills.co.in", "lead_time_days": 4, "reliability_score": 0.91, "min_order_qty": 80, "max_order_qty": 4000, "category": "STAPLES"},
    {"supplier_id": "SUP_05", "name": "Nilgiri Horticulture Growers", "contact_phone": "+919444055555", "email": "orders@nilgirifresh.org", "lead_time_days": 1, "reliability_score": 0.86, "min_order_qty": 30, "max_order_qty": 1500, "category": "PRODUCE"},
    {"supplier_id": "SUP_06", "name": "Koyambedu Fresh Traders", "contact_phone": "+919444066666", "email": "koyambedu@freshtraders.in", "lead_time_days": 2, "reliability_score": 0.92, "min_order_qty": 50, "max_order_qty": 2500, "category": "PRODUCE"},
    {"supplier_id": "SUP_07", "name": "South India Packaged Foods Co", "contact_phone": "+919444077777", "email": "distribution@sipackaged.in", "lead_time_days": 3, "reliability_score": 0.97, "min_order_qty": 60, "max_order_qty": 3500, "category": "PACKAGED"},
    {"supplier_id": "SUP_08", "name": "Apex Home & Hygiene Products", "contact_phone": "+919444088888", "email": "b2b@apexhygiene.com", "lead_time_days": 4, "reliability_score": 0.95, "min_order_qty": 50, "max_order_qty": 3000, "category": "PERSONAL_HOME"},
]

# 3. Inter-Store Logistics Routes (5x4 = 20 pairs)
DISTANCES = {
    ("CHN_01", "CBE_01"): (500, 9.0, 4.5),
    ("CHN_01", "SLM_01"): (350, 6.5, 3.2),
    ("CHN_01", "MDU_01"): (460, 8.5, 4.2),
    ("CHN_01", "TRY_01"): (330, 6.0, 3.0),
    ("CBE_01", "SLM_01"): (165, 3.5, 1.8),
    ("CBE_01", "MDU_01"): (215, 4.5, 2.2),
    ("CBE_01", "TRY_01"): (210, 4.2, 2.1),
    ("SLM_01", "MDU_01"): (235, 4.5, 2.3),
    ("SLM_01", "TRY_01"): (140, 3.0, 1.5),
    ("MDU_01", "TRY_01"): (135, 2.8, 1.4),
}

def get_store_routes() -> List[Dict]:
    routes = []
    store_ids = [s["store_id"] for s in STORES_DATA]
    for s1 in store_ids:
        for s2 in store_ids:
            if s1 == s2:
                continue
            pair = (s1, s2) if (s1, s2) in DISTANCES else (s2, s1)
            dist, hours, cost = DISTANCES[pair]
            routes.append({
                "route_id": f"RT_{s1}_{s2}",
                "source_store_id": s1,
                "destination_store_id": s2,
                "distance_km": dist,
                "transit_time_hours": hours,
                "transportation_cost_per_unit": cost,
                "route_status": "ACTIVE",
            })
    return routes

# 4. Products (60 Items across 5 Categories)
PRODUCT_TEMPLATES = [
    # Category: DAIRY (12 items)
    ("MILK_001", "SKU-D01", "Aavin Toned Fresh Milk 500ml", "DAIRY", "Fresh Milk", 20.00, 24.00, 25, 2, 0.10, 100),
    ("MILK_002", "SKU-D02", "Aavin Full Cream Milk 500ml", "DAIRY", "Fresh Milk", 26.00, 30.00, 20, 2, 0.10, 75),
    ("MILK_003", "SKU-D03", "Milma Homogenised Milk 500ml", "DAIRY", "Fresh Milk", 21.00, 25.00, 15, 2, 0.10, 60),
    ("CURD_001", "SKU-D04", "Aavin Farm Fresh Curd 500g", "DAIRY", "Curd & Yogurt", 28.00, 35.00, 20, 5, 0.12, 60),
    ("CURD_002", "SKU-D05", "Milma Thick Set Curd 500g", "DAIRY", "Curd & Yogurt", 30.00, 38.00, 15, 5, 0.12, 45),
    ("PANEER_01", "SKU-D06", "Fresh Malai Paneer 200g", "DAIRY", "Cheese & Paneer", 75.00, 95.00, 10, 10, 0.20, 30),
    ("BUTTER_01", "SKU-D07", "Aavin Salted Butter 500g", "DAIRY", "Butter", 210.00, 260.00, 10, 60, 0.30, 25),
    ("GHEE_001", "SKU-D08", "Aavin Pure Cow Ghee 500ml", "DAIRY", "Ghee", 320.00, 395.00, 15, 180, 0.25, 35),
    ("GHEE_002", "SKU-D09", "Aavin Pure Cow Ghee 1L", "DAIRY", "Ghee", 610.00, 760.00, 10, 180, 0.40, 20),
    ("CHEESE_01", "SKU-D10", "Cheddar Cheese Slices 200g", "DAIRY", "Cheese & Paneer", 110.00, 145.00, 10, 90, 0.20, 20),
    ("BUTTERMILK_1", "SKU-D11", "Spiced Buttermilk 200ml", "DAIRY", "Flavored Milk", 10.00, 15.00, 30, 3, 0.05, 80),
    ("LOBUTTER_1", "SKU-D12", "Aavin Cooking Butter 500g", "DAIRY", "Butter", 200.00, 250.00, 10, 45, 0.25, 20),

    # Category: STAPLES (12 items)
    ("RICE_001", "SKU-S01", "Ponni Boiled Rice 5kg", "STAPLES", "Rice & Grains", 260.00, 325.00, 20, 365, 0.05, 50),
    ("RICE_002", "SKU-S02", "Sona Masoori Raw Rice 5kg", "STAPLES", "Rice & Grains", 280.00, 350.00, 20, 365, 0.05, 45),
    ("RICE_003", "SKU-S03", "Basmati Premium Rice 5kg", "STAPLES", "Rice & Grains", 550.00, 720.00, 10, 365, 0.08, 25),
    ("DAL_001", "SKU-S04", "Toor Dal Premium 1kg", "STAPLES", "Pulses & Dals", 130.00, 165.00, 25, 180, 0.05, 50),
    ("DAL_002", "SKU-S05", "Moong Dal Washed 1kg", "STAPLES", "Pulses & Dals", 105.00, 135.00, 20, 180, 0.05, 40),
    ("DAL_003", "SKU-S06", "Urad Dal Gota 1kg", "STAPLES", "Pulses & Dals", 125.00, 160.00, 25, 180, 0.05, 50),
    ("WHEAT_001", "SKU-S07", "Chakki Fresh Atta 5kg", "STAPLES", "Flours", 195.00, 250.00, 20, 90, 0.05, 45),
    ("OIL_001", "SKU-S08", "Refined Sunflower Oil 1L", "STAPLES", "Edible Oils", 115.00, 145.00, 30, 270, 0.05, 60),
    ("OIL_002", "SKU-S09", "Pure Gingelly (Sesame) Oil 1L", "STAPLES", "Edible Oils", 280.00, 360.00, 15, 270, 0.08, 30),
    ("OIL_003", "SKU-S10", "Cold Pressed Groundnut Oil 1L", "STAPLES", "Edible Oils", 210.00, 270.00, 15, 270, 0.08, 35),
    ("SUGAR_001", "SKU-S11", "Refined White Sugar 1kg", "STAPLES", "Sugar & Jaggery", 38.00, 48.00, 40, 365, 0.02, 70),
    ("JAGGERY_01", "SKU-S12", "Organic Round Jaggery 1kg", "STAPLES", "Sugar & Jaggery", 60.00, 85.00, 20, 180, 0.04, 40),

    # Category: PRODUCE (12 items)
    ("PROD_001", "SKU-P01", "Fresh Country Onions 1kg", "PRODUCE", "Vegetables", 30.00, 45.00, 50, 14, 0.15, 120),
    ("PROD_002", "SKU-P02", "Fresh Red Tomatoes 1kg", "PRODUCE", "Vegetables", 25.00, 40.00, 40, 7, 0.20, 100),
    ("PROD_003", "SKU-P03", "Baby Potatoes 1kg", "PRODUCE", "Vegetables", 28.00, 42.00, 40, 30, 0.10, 80),
    ("PROD_004", "SKU-P04", "Green Chillies 250g", "PRODUCE", "Vegetables", 12.00, 20.00, 30, 5, 0.10, 60),
    ("PROD_005", "SKU-P05", "Fresh Ginger 250g", "PRODUCE", "Vegetables", 22.00, 35.00, 25, 14, 0.10, 50),
    ("PROD_006", "SKU-P06", "Fresh Garlic 250g", "PRODUCE", "Vegetables", 35.00, 55.00, 25, 30, 0.10, 50),
    ("PROD_007", "SKU-P07", "Robusta Bananas 1 Dozen", "PRODUCE", "Fruits", 40.00, 60.00, 30, 4, 0.15, 70),
    ("PROD_008", "SKU-P08", "Yelakki Sweet Bananas 1 Dozen", "PRODUCE", "Fruits", 55.00, 80.00, 25, 4, 0.15, 60),
    ("PROD_009", "SKU-P09", "Shimla Crisp Apples 1kg", "PRODUCE", "Fruits", 140.00, 195.00, 20, 14, 0.25, 40),
    ("PROD_010", "SKU-P10", "Nagpur Oranges 1kg", "PRODUCE", "Fruits", 65.00, 95.00, 20, 10, 0.20, 45),
    ("PROD_011", "SKU-P11", "Fresh Coconut 1 Pc", "PRODUCE", "Vegetables", 22.00, 32.00, 40, 20, 0.08, 90),
    ("PROD_012", "SKU-P12", "Coriander & Curry Leaves Bunch", "PRODUCE", "Herbs", 8.00, 15.00, 50, 3, 0.10, 100),

    # Category: PACKAGED (12 items)
    ("PKG_001", "SKU-K01", "Masala Instant Noodles 4-Pack", "PACKAGED", "Noodles & Pasta", 48.00, 60.00, 30, 270, 0.03, 65),
    ("PKG_002", "SKU-K02", "Wheat Rava Upma Mix 500g", "PACKAGED", "Breakfast Mixes", 45.00, 60.00, 20, 180, 0.03, 40),
    ("PKG_003", "SKU-K03", "Instant Idli/Dosa Batter 1kg", "PACKAGED", "Fresh Batter", 35.00, 50.00, 30, 4, 0.10, 70),
    ("PKG_004", "SKU-K04", "South Indian Filter Coffee 250g", "PACKAGED", "Beverages", 120.00, 160.00, 25, 270, 0.04, 50),
    ("PKG_005", "SKU-K05", "Dust Tea Powder 500g", "PACKAGED", "Beverages", 140.00, 185.00, 25, 365, 0.04, 45),
    ("PKG_006", "SKU-K06", "Butter Crunch Biscuits 200g", "PACKAGED", "Biscuits & Cookies", 28.00, 40.00, 35, 180, 0.03, 75),
    ("PKG_007", "SKU-K07", "Marie Light Biscuits 300g", "PACKAGED", "Biscuits & Cookies", 32.00, 45.00, 35, 180, 0.03, 70),
    ("PKG_008", "SKU-K08", "Roasted Salted Peanuts 200g", "PACKAGED", "Snacks", 35.00, 50.00, 20, 120, 0.03, 40),
    ("PKG_009", "SKU-K09", "Murukku Traditional Snack 200g", "PACKAGED", "Snacks", 40.00, 60.00, 20, 90, 0.04, 45),
    ("PKG_010", "SKU-K10", "Tomato Ketchup Easy Squeeze 500g", "PACKAGED", "Condiments", 80.00, 110.00, 20, 270, 0.04, 35),
    ("PKG_011", "SKU-K11", "Mixed Fruit Jam 500g", "PACKAGED", "Condiments", 95.00, 130.00, 15, 270, 0.04, 30),
    ("PKG_012", "SKU-K12", "Sambar Powder Authentic 200g", "PACKAGED", "Spices & Masalas", 55.00, 75.00, 25, 270, 0.03, 50),

    # Category: PERSONAL_HOME (12 items)
    ("HOME_001", "SKU-H01", "Bathing Soap Neem & Turmeric 125g", "PERSONAL_HOME", "Bath & Body", 28.00, 40.00, 35, 730, 0.02, 60),
    ("HOME_002", "SKU-H02", "Sandalwood Luxury Soap 125g", "PERSONAL_HOME", "Bath & Body", 42.00, 60.00, 25, 730, 0.02, 45),
    ("HOME_003", "SKU-H03", "Herbal Anti-Dandruff Shampoo 340ml", "PERSONAL_HOME", "Hair Care", 145.00, 210.00, 20, 730, 0.03, 35),
    ("HOME_004", "SKU-H04", "Ayurvedic Toothpaste 200g", "PERSONAL_HOME", "Oral Care", 65.00, 95.00, 30, 730, 0.02, 50),
    ("HOME_005", "SKU-H05", "Washing Detergent Powder 1kg", "PERSONAL_HOME", "Laundry", 95.00, 135.00, 30, 730, 0.03, 55),
    ("HOME_006", "SKU-H06", "Liquid Fabric Conditioner 1L", "PERSONAL_HOME", "Laundry", 150.00, 220.00, 15, 730, 0.04, 30),
    ("HOME_007", "SKU-H07", "Lemon Dishwash Gel 500ml", "PERSONAL_HOME", "Kitchen Hygiene", 75.00, 105.00, 25, 730, 0.03, 50),
    ("HOME_008", "SKU-H08", "Citrus Surface Floor Cleaner 1L", "PERSONAL_HOME", "Home Care", 90.00, 130.00, 20, 730, 0.03, 40),
    ("HOME_009", "SKU-H09", "Toilet Cleaner Liquid 1L", "PERSONAL_HOME", "Home Care", 95.00, 140.00, 20, 730, 0.03, 40),
    ("HOME_010", "SKU-H10", "Mosquito Vaporizer Refill 45ml", "PERSONAL_HOME", "Pest Control", 60.00, 85.00, 25, 730, 0.02, 50),
    ("HOME_011", "SKU-H11", "Kitchen Paper Towel 2 Rolls", "PERSONAL_HOME", "Paper Products", 75.00, 110.00, 20, 730, 0.03, 35),
    ("HOME_012", "SKU-H12", "Biodegradable Garbage Bags 30s", "PERSONAL_HOME", "Home Care", 65.00, 95.00, 20, 730, 0.02, 40),
]

def get_products() -> List[Dict]:
    products = []
    for p in PRODUCT_TEMPLATES:
        products.append({
            "product_id": p[0],
            "sku": p[1],
            "name": p[2],
            "category": p[3],
            "subcategory": p[4],
            "unit_cost": p[5],
            "base_price": p[6],
            "min_safety_stock": p[7],
            "shelf_life_days": p[8],
            "holding_cost_per_day": p[9],
            "base_daily_demand": p[10],
            "active": True,
        })
    return products

def get_supplier_products(products: List[Dict]) -> List[Dict]:
    supplier_prods = []
    # Map suppliers to products by category
    for prod in products:
        cat = prod["category"]
        eligible_sups = [s for s in SUPPLIERS_DATA if s["category"] == cat]
        for sup in eligible_sups:
            # Add small random price/lead-time variation between primary and secondary suppliers
            cost_factor = 1.0 if sup["supplier_id"] in ["SUP_01", "SUP_03", "SUP_05", "SUP_07", "SUP_08"] else 1.05
            supplier_prods.append({
                "supplier_id": sup["supplier_id"],
                "product_id": prod["product_id"],
                "unit_cost": round(prod["unit_cost"] * cost_factor, 2),
                "lead_time_days": sup["lead_time_days"],
                "reliability_score": sup["reliability_score"],
                "min_order_qty": sup["min_order_qty"],
                "max_order_qty": sup["max_order_qty"],
                "active": True,
            })
    return supplier_prods

def get_store_products(products: List[Dict]) -> List[Dict]:
    store_prods = []
    for store in STORES_DATA:
        s_id = store["store_id"]
        mult = store["demand_multiplier"]
        for prod in products:
            target = int(prod["base_daily_demand"] * mult * 3.5) # ~3.5 days of target stock
            store_prods.append({
                "store_id": s_id,
                "product_id": prod["product_id"],
                "is_eligible": True,
                "target_stock_level": max(target, prod["min_safety_stock"] * 2),
            })
    return store_prods

# 5. External Calendar & Tamil Nadu Events
def get_external_events(start_date: date, num_days: int) -> List[Dict]:
    events = []
    # Key Tamil Nadu Festivals & Climate Events
    # Pongal: Jan 14-16 (Days around Jan 15)
    # Tamil New Year: April 14
    # Deepavali: late Oct / early Nov
    # Summer Heatwave: May 10 - May 25
    # Northeast Monsoon: Nov 5 - Nov 20
    curr = start_date
    for i in range(num_days):
        m, d = curr.month, curr.day
        # Pongal
        if m == 1 and 13 <= d <= 17:
            events.append({
                "event_id": f"EVT_PONGAL_{curr.isoformat()}",
                "store_id": None, # All stores
                "event_type": "FESTIVAL_PONGAL",
                "event_date": curr.isoformat(),
                "description": "Pongal Harvest Festival across Tamil Nadu",
                "impact_factor": 2.2,
            })
        # Tamil New Year
        elif m == 4 and 13 <= d <= 15:
            events.append({
                "event_id": f"EVT_TAMIL_NEW_YEAR_{curr.isoformat()}",
                "store_id": None,
                "event_type": "FESTIVAL_NEW_YEAR",
                "event_date": curr.isoformat(),
                "description": "Tamil New Year / Chithirai celebration",
                "impact_factor": 1.7,
            })
        # Deepavali
        elif (m == 10 and d >= 28) or (m == 11 and d <= 2):
            events.append({
                "event_id": f"EVT_DIWALI_{curr.isoformat()}",
                "store_id": None,
                "event_type": "FESTIVAL_DIWALI",
                "event_date": curr.isoformat(),
                "description": "Diwali Festival of Lights shopping peak",
                "impact_factor": 2.5,
            })
        # Summer Heatwave
        elif m == 5 and 10 <= d <= 25:
            events.append({
                "event_id": f"EVT_HEATWAVE_{curr.isoformat()}",
                "store_id": None,
                "event_type": "WEATHER_HEATWAVE",
                "event_date": curr.isoformat(),
                "description": "Agni Nakshatram Summer Heatwave (High dairy/beverage demand)",
                "impact_factor": 1.4,
            })
        # Northeast Monsoon
        elif m == 11 and 8 <= d <= 18:
            events.append({
                "event_id": f"EVT_MONSOON_{curr.isoformat()}",
                "store_id": "CHN_01", # Particularly hits Chennai
                "event_type": "WEATHER_MONSOON",
                "event_date": curr.isoformat(),
                "description": "Northeast Monsoon heavy rains and delivery delays",
                "impact_factor": 0.75, # Store footfall down, delivery lead times stretched
            })
        curr += timedelta(days=1)
    return events

# 6. Daily Sales & Synthetic Correlated Demand Generation
def generate_sales_and_inventory(products: List[Dict]) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    start_date = date(2025, 11, 1)
    num_days = 365
    date_range = [start_date + timedelta(days=i) for i in range(num_days)]
    
    events = get_external_events(start_date, num_days)
    event_map = {}
    for ev in events:
        d_str = ev["event_date"]
        event_map[d_str] = ev

    sales_records = []
    
    # Track daily inventory positions store by store
    # Store stock state: { (store_id, product_id): {"physical": int, "reserved": int, "incoming": int} }
    initial_inventory = {}
    for store in STORES_DATA:
        s_id = store["store_id"]
        mult = store["demand_multiplier"]
        for prod in products:
            p_id = prod["product_id"]
            base_d = prod["base_daily_demand"] * mult
            # Start with 5 to 7 days of inventory
            start_qty = int(base_d * random.uniform(5.0, 7.0))
            initial_inventory[(s_id, p_id)] = {
                "physical": start_qty,
                "reserved": 0,
                "incoming": 0,
            }

    # Running inventory state
    curr_inventory = {k: dict(v) for k, v in initial_inventory.items()}

    for day_idx, curr_date in enumerate(date_range):
        curr_d_str = curr_date.isoformat()
        dow = curr_date.weekday() # 0 = Monday, 5 = Saturday, 6 = Sunday
        is_weekend = dow in (5, 6)
        month = curr_date.month

        # Check external event
        ev = event_map.get(curr_d_str)
        festival_flag = False
        weather_cond = "NORMAL"
        evt_mult = 1.0

        if ev:
            if "FESTIVAL" in ev["event_type"]:
                festival_flag = True
                evt_mult = ev["impact_factor"]
            elif "HEATWAVE" in ev["event_type"]:
                weather_cond = "HEATWAVE"
            elif "MONSOON" in ev["event_type"]:
                weather_cond = "MONSOON"
                evt_mult = ev["impact_factor"]

        for store in STORES_DATA:
            s_id = store["store_id"]
            s_mult = store["demand_multiplier"]

            for prod in products:
                p_id = prod["product_id"]
                cat = prod["category"]
                base_d = prod["base_daily_demand"] * s_mult

                # Category-specific multipliers
                cat_mult = 1.0
                if festival_flag:
                    if cat in ("DAIRY", "STAPLES", "PRODUCE"):
                        cat_mult = evt_mult # High festival impact on food staples
                    elif cat == "PACKAGED":
                        cat_mult = evt_mult * 0.9
                    else:
                        cat_mult = 1.1
                elif weather_cond == "HEATWAVE":
                    if cat == "DAIRY":
                        cat_mult = 1.35 # High curd/buttermilk consumption
                    elif cat == "PRODUCE":
                        cat_mult = 0.90 # Spoilage resistance/lighter cooking
                elif weather_cond == "MONSOON" and s_id == "CHN_01":
                    cat_mult = 0.70 # Heavy rain footfall drop

                # Day of week multiplier (weekend boost for retail)
                dow_mult = 1.25 if is_weekend else 0.95

                # Promotional variation (approx 10% of time)
                promo_flag = (hash(f"{s_id}_{p_id}_{curr_d_str}") % 10 == 0)
                promo_mult = 1.30 if promo_flag else 1.0
                effective_price = round(prod["base_price"] * (0.85 if promo_flag else 1.0), 2)

                # Correlated latent true demand with Poisson/Gaussian noise
                expected_demand = base_d * cat_mult * dow_mult * promo_mult
                noise = np.random.normal(0, max(2.0, expected_demand * 0.12))
                true_demand = max(1, int(round(expected_demand + noise)))

                # Operational Stockout Scenario Injection:
                # E.g. Around day 340-345 in Salem for Milk (Coimbatore - Salem transfer scenario preparation)
                if s_id == "SLM_01" and p_id == "MILK_001" and 335 <= day_idx <= 345:
                    curr_inventory[(s_id, p_id)]["physical"] = min(curr_inventory[(s_id, p_id)]["physical"], 12)

                # Check inventory constraint: Observed Sales vs Censored Demand
                stock_avail = curr_inventory[(s_id, p_id)]["physical"]
                stockout_flag = False

                if stock_avail <= 0:
                    units_sold = 0
                    stockout_flag = True
                elif stock_avail < true_demand:
                    units_sold = stock_avail
                    stockout_flag = True
                    curr_inventory[(s_id, p_id)]["physical"] = 0
                else:
                    units_sold = true_demand
                    curr_inventory[(s_id, p_id)]["physical"] -= units_sold

                # Simulate daily replenishment delivery if stock drops below reorder point
                reorder_threshold = int(base_d * 2.5)
                if curr_inventory[(s_id, p_id)]["physical"] < reorder_threshold:
                    # Inflow takes 1-3 days; for sales history simulation, add batch arrival
                    batch_size = int(base_d * random.uniform(3.0, 5.0))
                    curr_inventory[(s_id, p_id)]["physical"] += batch_size

                sales_records.append({
                    "store_id": s_id,
                    "product_id": p_id,
                    "sale_date": curr_d_str,
                    "units_sold": units_sold,
                    "true_demand_latent": true_demand, # Preserved for evaluation
                    "unit_price": effective_price,
                    "promotional_flag": promo_flag,
                    "weather_condition": weather_cond,
                    "festival_flag": festival_flag,
                    "stockout_flag": stockout_flag,
                })

    df_sales = pd.DataFrame(sales_records)

    # 7. Final Current Inventory Snapshot
    inventory_records = []
    for (s_id, p_id), inv in curr_inventory.items():
        prod_meta = next(p for p in products if p["product_id"] == p_id)
        store_meta = next(s for s in STORES_DATA if s["store_id"] == s_id)
        avg_d = max(1.0, prod_meta["base_daily_demand"] * store_meta["demand_multiplier"])
        
        phys = max(0, inv["physical"])
        reserved = 0
        
        # Prepare Coimbatore RS Puram with sufficient milk for Salem transfer scenario
        if s_id == "CBE_01" and p_id == "MILK_001":
            phys = 140
        elif s_id == "SLM_01" and p_id == "MILK_001":
            phys = 15 # Severe stockout risk

        avail = phys - reserved
        safety = prod_meta["min_safety_stock"]
        reorder = int(safety * 2.2)
        days_supply = round(avail / avg_d, 2)

        inventory_records.append({
            "store_id": s_id,
            "product_id": p_id,
            "physical_on_hand": phys,
            "available_stock": avail,
            "reserved_stock": reserved,
            "incoming_stock": int(avg_d * 2.0),
            "safety_stock": safety,
            "reorder_point": reorder,
            "days_of_supply": days_supply,
            "last_updated": date.today().isoformat(),
        })

    df_inventory = pd.DataFrame(inventory_records)
    return df_sales, df_inventory, pd.DataFrame(events)

def generate_supplier_deliveries(products: List[Dict]) -> pd.DataFrame:
    """Generate realistic delivery history and current in-transit shipments."""
    deliveries = []
    start = date(2026, 10, 1) # Recent operational month
    for d_idx in range(30):
        o_date = start + timedelta(days=d_idx)
        # Random sample of deliveries
        for sup in SUPPLIERS_DATA[:4]:
            prod = random.choice([p for p in products if p["category"] == sup["category"]])
            store = random.choice(STORES_DATA)
            lead = sup["lead_time_days"]
            exp_date = o_date + timedelta(days=lead)
            
            # 12% probability of supplier delay
            delayed = (random.random() > sup["reliability_score"])
            delay_days = random.randint(1, 4) if delayed else 0
            act_date = exp_date + timedelta(days=delay_days) if d_idx < 25 else None
            status = "DELIVERED" if act_date and act_date <= date(2026, 10, 31) else ("DELAYED" if delayed else "IN_TRANSIT")

            deliveries.append({
                "delivery_id": f"DEL_{sup['supplier_id']}_{store['store_id']}_{o_date.isoformat()}",
                "po_id": f"PO_{sup['supplier_id']}_{d_idx:04d}",
                "supplier_id": sup["supplier_id"],
                "store_id": store["store_id"],
                "product_id": prod["product_id"],
                "order_date": o_date.isoformat(),
                "expected_delivery_date": exp_date.isoformat(),
                "actual_delivery_date": act_date.isoformat() if act_date else None,
                "delay_days": delay_days,
                "quantity": random.randint(50, 200),
                "status": status,
            })
    return pd.DataFrame(deliveries)

def run_generation():
    print("=" * 70)
    print(" RetailMind AI: Synthetic Retail Dataset Generation Pipeline")
    print(f" Deterministic Random Seed: {SEED}")
    print("=" * 70)

    # 1. Stores
    df_stores = pd.DataFrame(STORES_DATA).drop(columns=["demand_multiplier"])
    df_stores.to_csv(DATA_RAW_DIR / "stores.csv", index=False)
    print(f"[OK] Generated {len(df_stores)} Stores -> {DATA_RAW_DIR / 'stores.csv'}")

    # 2. Suppliers
    df_suppliers = pd.DataFrame(SUPPLIERS_DATA).drop(columns=["category"])
    df_suppliers.to_csv(DATA_RAW_DIR / "suppliers.csv", index=False)
    print(f"[OK] Generated {len(df_suppliers)} Suppliers -> {DATA_RAW_DIR / 'suppliers.csv'}")

    # 3. Store Routes
    routes = get_store_routes()
    df_routes = pd.DataFrame(routes)
    df_routes.to_csv(DATA_RAW_DIR / "store_routes.csv", index=False)
    print(f"[OK] Generated {len(df_routes)} Store Routes -> {DATA_RAW_DIR / 'store_routes.csv'}")

    # 4. Products
    products = get_products()
    df_products = pd.DataFrame(products).drop(columns=["base_daily_demand"])
    df_products.to_csv(DATA_RAW_DIR / "products.csv", index=False)
    print(f"[OK] Generated {len(df_products)} Products -> {DATA_RAW_DIR / 'products.csv'}")

    # 5. Supplier Products & Store Products
    df_sup_prod = pd.DataFrame(get_supplier_products(products))
    df_sup_prod.to_csv(DATA_RAW_DIR / "supplier_products.csv", index=False)
    print(f"[OK] Generated {len(df_sup_prod)} Supplier-Product Mappings")

    df_store_prod = pd.DataFrame(get_store_products(products))
    df_store_prod.to_csv(DATA_RAW_DIR / "store_products.csv", index=False)
    print(f"[OK] Generated {len(df_store_prod)} Store-Product Mappings")

    # 6. Sales, Inventory & External Events
    print("\nSimulating 365 days of correlated multi-store sales (109,500 records)...")
    df_sales, df_inventory, df_events = generate_sales_and_inventory(products)

    df_sales.to_csv(DATA_RAW_DIR / "sales.csv", index=False)
    df_inventory.to_csv(DATA_RAW_DIR / "inventory.csv", index=False)
    df_events.to_csv(DATA_RAW_DIR / "external_events.csv", index=False)

    print(f"[OK] Generated {len(df_sales):,} Daily Sales Records -> {DATA_RAW_DIR / 'sales.csv'}")
    print(f"[OK] Generated {len(df_inventory)} Inventory Snapshots -> {DATA_RAW_DIR / 'inventory.csv'}")
    print(f"[OK] Generated {len(df_events)} External Events -> {DATA_RAW_DIR / 'external_events.csv'}")

    # 7. Supplier Deliveries
    df_deliveries = generate_supplier_deliveries(products)
    df_deliveries.to_csv(DATA_RAW_DIR / "supplier_deliveries.csv", index=False)
    print(f"[OK] Generated {len(df_deliveries)} Supplier Deliveries -> {DATA_RAW_DIR / 'supplier_deliveries.csv'}")

    # 8. Chronological Splits (Train: M1-M9, Val: M10-M11, Test: M12)
    # Sorting by date prevents temporal leakage
    df_sales["sale_date"] = pd.to_datetime(df_sales["sale_date"])
    df_sales = df_sales.sort_values(by=["sale_date", "store_id", "product_id"]).reset_index(drop=True)

    unique_dates = df_sales["sale_date"].drop_duplicates().sort_values().reset_index(drop=True)
    num_total_days = len(unique_dates)
    train_end_idx = 273 # ~9 months (273 days)
    val_end_idx = 273 + 61 # ~2 months (61 days)

    train_cutoff = unique_dates.iloc[train_end_idx]
    val_cutoff = unique_dates.iloc[val_end_idx]

    df_train = df_sales[df_sales["sale_date"] < train_cutoff]
    df_val = df_sales[(df_sales["sale_date"] >= train_cutoff) & (df_sales["sale_date"] < val_cutoff)]
    df_test = df_sales[df_sales["sale_date"] >= val_cutoff]

    df_train.to_csv(DATA_PROCESSED_DIR / "sales_train.csv", index=False)
    df_val.to_csv(DATA_PROCESSED_DIR / "sales_val.csv", index=False)
    df_test.to_csv(DATA_PROCESSED_DIR / "sales_test.csv", index=False)

    print("\n--- Chronological Dataset Splits ---")
    print(f" Training Set   (Months 1-9):  {len(df_train):,} rows ({df_train['sale_date'].min().date()} to {df_train['sale_date'].max().date()})")
    print(f" Validation Set (Months 10-11): {len(df_val):,} rows ({df_val['sale_date'].min().date()} to {df_val['sale_date'].max().date()})")
    print(f" Testing Set    (Month 12):     {len(df_test):,} rows ({df_test['sale_date'].min().date()} to {df_test['sale_date'].max().date()})")
    print("=" * 70)
    print(" Synthetic Retail Dataset Generation Completed Successfully!")
    print("=" * 70)

if __name__ == "__main__":
    run_generation()
