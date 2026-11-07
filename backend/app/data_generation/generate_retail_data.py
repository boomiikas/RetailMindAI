"""Synthetic Retail Dataset Generator for RetailMind AI.

Generates reproducible, business-correlated multi-store retail data:
- 5 Tamil Nadu stores (Chennai, Coimbatore, Salem, Madurai, Trichy)
- 88 products across 8 realistic supermarket categories:
  1. Staples & Grains
  2. Dairy & Bakery
  3. Fruits & Vegetables
  4. Beverages
  5. Packaged Foods
  6. Personal Care
  7. Household Products
  8. Frozen & Ready-to-Eat
- 12 dedicated regional suppliers with category mapping, lead times, reliability, and MOQs
- 365 days (12 months) of daily sales: 160,600 records (365 x 5 x 88)
- Inventory snapshots, supplier lead times, delivery delays, logistics routes
- Rich correlated events: Pongal, Summer Heatwave, Northeast Monsoon, Diwali,
  weekend surges, supplier failure/delay injections, and price elasticity
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

# 1. Stores (5 Tamil Nadu Branches - Preserved)
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

# 2. Suppliers (12 Dedicated Regional Suppliers covering 8 categories)
SUPPLIERS_DATA = [
    {"supplier_id": "SUP_01", "name": "Aavin Dairy Co-operative", "contact_phone": "+919444011111", "email": "orders@aavin.tn.gov.in", "lead_time_days": 1, "reliability_score": 0.95, "min_order_qty": 50, "max_order_qty": 3500, "category": "Dairy & Bakery"},
    {"supplier_id": "SUP_02", "name": "Nilgiri & Modern Bakers", "contact_phone": "+919444022222", "email": "supply@nilgiribakers.in", "lead_time_days": 2, "reliability_score": 0.91, "min_order_qty": 40, "max_order_qty": 2000, "category": "Dairy & Bakery"},
    {"supplier_id": "SUP_03", "name": "Tamil Nadu Agro Staples Ltd", "contact_phone": "+919444033333", "email": "sales@tnagro.com", "lead_time_days": 3, "reliability_score": 0.96, "min_order_qty": 100, "max_order_qty": 5000, "category": "Staples & Grains"},
    {"supplier_id": "SUP_04", "name": "Kaveri Grain Mills", "contact_phone": "+919444044444", "email": "kaveri@grainmills.co.in", "lead_time_days": 4, "reliability_score": 0.93, "min_order_qty": 80, "max_order_qty": 4000, "category": "Staples & Grains"},
    {"supplier_id": "SUP_05", "name": "Nilgiri Horticulture Growers", "contact_phone": "+919444055555", "email": "orders@nilgirifresh.org", "lead_time_days": 1, "reliability_score": 0.88, "min_order_qty": 30, "max_order_qty": 1500, "category": "Fruits & Vegetables"},
    {"supplier_id": "SUP_06", "name": "Koyambedu Wholesale Traders", "contact_phone": "+919444066666", "email": "koyambedu@freshtraders.in", "lead_time_days": 2, "reliability_score": 0.92, "min_order_qty": 50, "max_order_qty": 3000, "category": "Fruits & Vegetables"},
    {"supplier_id": "SUP_07", "name": "South India Packaged Foods Co", "contact_phone": "+919444077777", "email": "distribution@sipackaged.in", "lead_time_days": 3, "reliability_score": 0.97, "min_order_qty": 60, "max_order_qty": 3500, "category": "Packaged Foods"},
    {"supplier_id": "SUP_08", "name": "CavinKare Personal Care Ltd", "contact_phone": "+919444088888", "email": "b2b@cavinkare.in", "lead_time_days": 3, "reliability_score": 0.95, "min_order_qty": 40, "max_order_qty": 2500, "category": "Personal Care"},
    {"supplier_id": "SUP_09", "name": "Kannan Jubilee & Tata Beverages", "contact_phone": "+919444099999", "email": "supply@tatabev.co.in", "lead_time_days": 2, "reliability_score": 0.94, "min_order_qty": 50, "max_order_qty": 3000, "category": "Beverages"},
    {"supplier_id": "SUP_10", "name": "Bovonto South Beverages", "contact_phone": "+919444100000", "email": "orders@bovontosouth.in", "lead_time_days": 2, "reliability_score": 0.90, "min_order_qty": 50, "max_order_qty": 2500, "category": "Beverages"},
    {"supplier_id": "SUP_11", "name": "Apex Home & Hygiene Products", "contact_phone": "+919444111111", "email": "b2b@apexhygiene.com", "lead_time_days": 4, "reliability_score": 0.94, "min_order_qty": 50, "max_order_qty": 3000, "category": "Household Products"},
    {"supplier_id": "SUP_12", "name": "Sumeru Frozen & Cold Chain Ltd", "contact_phone": "+919444122222", "email": "logistics@sumerufrozen.com", "lead_time_days": 2, "reliability_score": 0.89, "min_order_qty": 30, "max_order_qty": 2000, "category": "Frozen & Ready-to-Eat"},
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

# 4. Products: 88 Realistic SKUs across 8 Categories
# Template: (product_id, sku, name, category, subcategory, unit_cost, base_price, min_safety_stock, shelf_life_days, holding_cost_per_day, base_daily_demand)
PRODUCT_TEMPLATES = [
    # -------------------------------------------------------------
    # Category 1: Staples & Grains (12 items)
    # -------------------------------------------------------------
    ("RICE_001", "SKU-ST01", "Ponni Boiled Rice 5kg", "Staples & Grains", "Rice & Grains", 260.00, 325.00, 20, 365, 0.05, 50),
    ("RICE_002", "SKU-ST02", "Sona Masoori Raw Rice 5kg", "Staples & Grains", "Rice & Grains", 280.00, 350.00, 20, 365, 0.05, 45),
    ("RICE_003", "SKU-ST03", "Basmati Premium Rice 5kg", "Staples & Grains", "Rice & Grains", 550.00, 720.00, 10, 365, 0.08, 25),
    ("DAL_001", "SKU-ST04", "Premium Toor Dal 1kg", "Staples & Grains", "Pulses & Dals", 130.00, 165.00, 25, 180, 0.05, 50),
    ("DAL_002", "SKU-ST05", "Washed Moong Dal 1kg", "Staples & Grains", "Pulses & Dals", 105.00, 135.00, 20, 180, 0.05, 40),
    ("DAL_003", "SKU-ST06", "Urad Dal Gota (Idli Special) 1kg", "Staples & Grains", "Pulses & Dals", 125.00, 160.00, 25, 180, 0.05, 50),
    ("FLR_001", "SKU-ST07", "Chakki Fresh Whole Wheat Atta 5kg", "Staples & Grains", "Flours", 195.00, 250.00, 20, 90, 0.05, 45),
    ("FLR_002", "SKU-ST08", "Premium Maida Flour 1kg", "Staples & Grains", "Flours", 42.00, 55.00, 25, 90, 0.03, 35),
    ("OIL_001", "SKU-ST09", "Refined Sunflower Cooking Oil 1L", "Staples & Grains", "Edible Oils", 115.00, 145.00, 30, 270, 0.05, 60),
    ("OIL_002", "SKU-ST10", "Pure Gingelly (Sesame) Oil 1L", "Staples & Grains", "Edible Oils", 280.00, 360.00, 15, 270, 0.08, 30),
    ("OIL_003", "SKU-ST11", "Cold Pressed Groundnut Oil 1L", "Staples & Grains", "Edible Oils", 210.00, 270.00, 15, 270, 0.08, 35),
    ("SW_001", "SKU-ST12", "Organic Round Jaggery 1kg", "Staples & Grains", "Sugar & Jaggery", 60.00, 85.00, 20, 180, 0.04, 40),

    # -------------------------------------------------------------
    # Category 2: Dairy & Bakery (12 items)
    # -------------------------------------------------------------
    ("MILK_001", "SKU-DB01", "Aavin Toned Fresh Milk 500ml", "Dairy & Bakery", "Fresh Milk", 20.00, 24.00, 25, 2, 0.10, 100),
    ("MILK_002", "SKU-DB02", "Aavin Full Cream Milk 500ml", "Dairy & Bakery", "Fresh Milk", 26.00, 30.00, 20, 2, 0.10, 75),
    ("CURD_001", "SKU-DB03", "Farm Fresh Set Curd 500g", "Dairy & Bakery", "Curd & Yogurt", 28.00, 35.00, 20, 5, 0.12, 60),
    ("PNR_001", "SKU-DB04", "Fresh Malai Paneer 200g", "Dairy & Bakery", "Cheese & Paneer", 75.00, 95.00, 10, 10, 0.20, 30),
    ("BTR_001", "SKU-DB05", "Salted Table Butter 500g", "Dairy & Bakery", "Butter", 210.00, 260.00, 10, 60, 0.30, 25),
    ("GHEE_001", "SKU-DB06", "Aavin Pure Cow Ghee 500ml", "Dairy & Bakery", "Ghee", 320.00, 395.00, 15, 180, 0.25, 35),
    ("GHEE_002", "SKU-DB07", "Aavin Pure Cow Ghee 1L Tin", "Dairy & Bakery", "Ghee", 610.00, 760.00, 10, 180, 0.40, 20),
    ("CHS_001", "SKU-DB08", "Cheddar Cheese Slices 200g", "Dairy & Bakery", "Cheese & Paneer", 110.00, 145.00, 10, 90, 0.20, 20),
    ("BRD_001", "SKU-DB09", "Fresh Sandwich White Bread 400g", "Dairy & Bakery", "Breads", 28.00, 40.00, 30, 4, 0.08, 60),
    ("BRD_002", "SKU-DB10", "100% Whole Wheat Brown Bread 400g", "Dairy & Bakery", "Breads", 35.00, 50.00, 20, 4, 0.08, 45),
    ("RSK_001", "SKU-DB11", "Crispy Elaichi Milk Rusk 300g", "Dairy & Bakery", "Bakery Snacks", 38.00, 55.00, 25, 120, 0.03, 40),
    ("BTM_001", "SKU-DB12", "Spiced Masala Buttermilk 200ml", "Dairy & Bakery", "Flavored Milk", 10.00, 15.00, 30, 3, 0.05, 80),

    # -------------------------------------------------------------
    # Category 3: Fruits & Vegetables (12 items)
    # -------------------------------------------------------------
    ("VEG_001", "SKU-FV01", "Fresh Country Onions 1kg", "Fruits & Vegetables", "Vegetables", 30.00, 45.00, 50, 14, 0.15, 120),
    ("VEG_002", "SKU-FV02", "Fresh Hybrid Tomatoes 1kg", "Fruits & Vegetables", "Vegetables", 25.00, 40.00, 40, 7, 0.20, 100),
    ("VEG_003", "SKU-FV03", "Jyoti Potatoes 1kg", "Fruits & Vegetables", "Vegetables", 28.00, 42.00, 40, 30, 0.10, 80),
    ("VEG_004", "SKU-FV04", "Spicy Green Chillies 250g", "Fruits & Vegetables", "Vegetables", 12.00, 20.00, 30, 5, 0.10, 60),
    ("VEG_005", "SKU-FV05", "Fresh Old Ginger 250g", "Fruits & Vegetables", "Vegetables", 22.00, 35.00, 25, 14, 0.10, 50),
    ("VEG_006", "SKU-FV06", "Ooty Garlic Pods 250g", "Fruits & Vegetables", "Vegetables", 35.00, 55.00, 25, 30, 0.10, 50),
    ("FRT_001", "SKU-FV07", "Robusta Bananas 1 Dozen", "Fruits & Vegetables", "Fruits", 40.00, 60.00, 30, 4, 0.15, 70),
    ("FRT_002", "SKU-FV08", "Yelakki Sweet Bananas 1 Dozen", "Fruits & Vegetables", "Fruits", 55.00, 80.00, 25, 4, 0.15, 60),
    ("FRT_003", "SKU-FV09", "Shimla Royal Gala Apples 1kg", "Fruits & Vegetables", "Fruits", 140.00, 195.00, 20, 14, 0.25, 40),
    ("FRT_004", "SKU-FV10", "Sweet Nagpur Oranges 1kg", "Fruits & Vegetables", "Fruits", 65.00, 95.00, 20, 10, 0.20, 45),
    ("VEG_007", "SKU-FV11", "Pollachi Fresh Coconut 1 Pc", "Fruits & Vegetables", "Vegetables", 22.00, 32.00, 40, 20, 0.08, 90),
    ("VEG_008", "SKU-FV12", "Fresh Coriander & Curry Leaves Bunch", "Fruits & Vegetables", "Herbs", 8.00, 15.00, 50, 3, 0.10, 100),

    # -------------------------------------------------------------
    # Category 4: Beverages (10 items)
    # -------------------------------------------------------------
    ("BEV_001", "SKU-BV01", "South Indian Filter Coffee (80:20) 250g", "Beverages", "Coffee", 120.00, 160.00, 25, 270, 0.04, 50),
    ("BEV_002", "SKU-BV02", "Premium Dust Strong Tea 500g", "Beverages", "Tea", 140.00, 185.00, 25, 365, 0.04, 45),
    ("BEV_003", "SKU-BV03", "Masala Cardamom Tea 250g", "Beverages", "Tea", 85.00, 120.00, 20, 365, 0.04, 35),
    ("BEV_004", "SKU-BV04", "Bovonto Grape Flavored Soda 750ml", "Beverages", "Cold Drinks", 28.00, 40.00, 30, 180, 0.05, 55),
    ("BEV_005", "SKU-BV05", "Traditional Nannari Sarbath Syrup 750ml", "Beverages", "Syrups", 80.00, 115.00, 20, 270, 0.05, 30),
    ("BEV_006", "SKU-BV06", "Natural Mineral Spring Water 1L", "Beverages", "Water", 10.00, 20.00, 50, 365, 0.02, 100),
    ("BEV_007", "SKU-BV07", "Alphonso Mango Pulp Drink 1L", "Beverages", "Juices", 60.00, 85.00, 25, 180, 0.04, 40),
    ("BEV_008", "SKU-BV08", "Natural Tender Coconut Water 200ml", "Beverages", "Juices", 32.00, 45.00, 30, 180, 0.04, 50),
    ("BEV_009", "SKU-BV09", "Rose Milk Flavored Drink Syrup 500ml", "Beverages", "Syrups", 65.00, 95.00, 20, 270, 0.05, 30),
    ("BEV_010", "SKU-BV10", "Sparkling Lemon Lime Soda 600ml", "Beverages", "Cold Drinks", 25.00, 38.00, 30, 180, 0.04, 45),

    # -------------------------------------------------------------
    # Category 5: Packaged Foods (12 items)
    # -------------------------------------------------------------
    ("PKG_001", "SKU-PF01", "Masala Instant Noodles 4-Pack", "Packaged Foods", "Noodles & Pasta", 48.00, 60.00, 30, 270, 0.03, 65),
    ("PKG_002", "SKU-PF02", "Roasted Wheat Rava Upma Mix 500g", "Packaged Foods", "Breakfast Mixes", 45.00, 60.00, 20, 180, 0.03, 40),
    ("PKG_003", "SKU-PF03", "Wet Rice & Urad Idli Batter 1kg", "Packaged Foods", "Fresh Batter", 35.00, 50.00, 30, 4, 0.10, 70),
    ("PKG_004", "SKU-PF04", "Traditional South Indian Mixture 200g", "Packaged Foods", "Snacks", 38.00, 55.00, 25, 90, 0.04, 45),
    ("PKG_005", "SKU-PF05", "Kai Murukku Traditional Snack 200g", "Packaged Foods", "Snacks", 40.00, 60.00, 20, 90, 0.04, 45),
    ("PKG_006", "SKU-PF06", "Butter Crunch Biscuits 200g", "Packaged Foods", "Biscuits & Cookies", 28.00, 40.00, 35, 180, 0.03, 75),
    ("PKG_007", "SKU-PF07", "Marie Light Tea Biscuits 300g", "Packaged Foods", "Biscuits & Cookies", 32.00, 45.00, 35, 180, 0.03, 70),
    ("PKG_008", "SKU-PF08", "Roasted Salted Peanuts 200g", "Packaged Foods", "Snacks", 35.00, 50.00, 20, 120, 0.03, 40),
    ("PKG_009", "SKU-PF09", "Authentic Sambar Powder 200g", "Packaged Foods", "Spices & Masalas", 55.00, 75.00, 25, 270, 0.03, 50),
    ("PKG_010", "SKU-PF10", "Pepper Rasam Powder 200g", "Packaged Foods", "Spices & Masalas", 50.00, 70.00, 25, 270, 0.03, 45),
    ("PKG_011", "SKU-PF11", "Tomato Ketchup Squeeze Bottle 500g", "Packaged Foods", "Condiments", 80.00, 110.00, 20, 270, 0.04, 35),
    ("PKG_012", "SKU-PF12", "Urad Dal Appalam Papad 100g", "Packaged Foods", "Papad", 25.00, 38.00, 30, 180, 0.03, 50),

    # -------------------------------------------------------------
    # Category 6: Personal Care (10 items)
    # -------------------------------------------------------------
    ("PER_001", "SKU-PC01", "Neem & Turmeric Grade-1 Soap 125g", "Personal Care", "Bath & Body", 28.00, 40.00, 35, 730, 0.02, 60),
    ("PER_002", "SKU-PC02", "Mysore Pure Sandalwood Soap 125g", "Personal Care", "Bath & Body", 42.00, 60.00, 25, 730, 0.02, 45),
    ("PER_003", "SKU-PC03", "Ayurvedic Herbal Anti-Dandruff Shampoo 340ml", "Personal Care", "Hair Care", 145.00, 210.00, 20, 730, 0.03, 35),
    ("PER_004", "SKU-PC04", "Pure Coconut Hair Oil 500ml", "Personal Care", "Hair Care", 125.00, 175.00, 20, 730, 0.03, 40),
    ("PER_005", "SKU-PC05", "Ayurvedic Clove Toothpaste 200g", "Personal Care", "Oral Care", 65.00, 95.00, 30, 730, 0.02, 50),
    ("PER_006", "SKU-PC06", "Refreshing Talcum Powder 250g", "Personal Care", "Body Care", 75.00, 110.00, 20, 730, 0.03, 35),
    ("PER_007", "SKU-PC07", "Antibacterial Liquid Handwash 500ml", "Personal Care", "Hand Hygiene", 85.00, 125.00, 25, 730, 0.03, 40),
    ("PER_008", "SKU-PC08", "Herbal Shaving Cream Menthol 100g", "Personal Care", "Men's Grooming", 55.00, 80.00, 20, 730, 0.02, 30),
    ("PER_009", "SKU-PC09", "Deep Nourishing Body Lotion 200ml", "Personal Care", "Skin Care", 110.00, 165.00, 15, 730, 0.03, 25),
    ("PER_010", "SKU-PC10", "Ultra Comfort Sanitary Pads 15s", "Personal Care", "Feminine Hygiene", 90.00, 135.00, 30, 730, 0.02, 45),

    # -------------------------------------------------------------
    # Category 7: Household Products (10 items)
    # -------------------------------------------------------------
    ("HSD_001", "SKU-HP01", "Washing Detergent Powder 1kg", "Household Products", "Laundry", 95.00, 135.00, 30, 730, 0.03, 55),
    ("HSD_002", "SKU-HP02", "Concentrated Fabric Conditioner 1L", "Household Products", "Laundry", 150.00, 220.00, 15, 730, 0.04, 30),
    ("HSD_003", "SKU-HP03", "Lemon Grease Dishwash Gel 500ml", "Household Products", "Dishwashing", 75.00, 105.00, 25, 730, 0.03, 50),
    ("HSD_004", "SKU-HP04", "Citrus Disinfectant Floor Cleaner 1L", "Household Products", "Surface Cleaners", 90.00, 130.00, 20, 730, 0.03, 40),
    ("HSD_005", "SKU-HP05", "Extra Power Toilet Cleaner 1L", "Household Products", "Surface Cleaners", 95.00, 140.00, 20, 730, 0.03, 40),
    ("HSD_006", "SKU-HP06", "Mosquito Vaporizer Machine + Refill 45ml", "Household Products", "Pest Control", 70.00, 105.00, 25, 730, 0.02, 50),
    ("HSD_007", "SKU-HP07", "High Absorbent Kitchen Towel 2-Pack", "Household Products", "Paper Goods", 75.00, 110.00, 20, 730, 0.03, 35),
    ("HSD_008", "SKU-HP08", "Heavy Duty Garbage Bags Large 30s", "Household Products", "Waste Management", 65.00, 95.00, 20, 730, 0.02, 40),
    ("HSD_009", "SKU-HP09", "Steel Wire Scrubber 3-Pack", "Household Products", "Dishwashing", 30.00, 45.00, 30, 730, 0.02, 45),
    ("HSD_010", "SKU-HP10", "Herbal Mosquito Coil 10s", "Household Products", "Pest Control", 35.00, 50.00, 25, 730, 0.02, 40),

    # -------------------------------------------------------------
    # Category 8: Frozen & Ready-to-Eat (10 items)
    # -------------------------------------------------------------
    ("FRZ_001", "SKU-FR01", "Tender Frozen Green Peas 500g", "Frozen & Ready-to-Eat", "Frozen Vegetables", 65.00, 95.00, 20, 365, 0.05, 35),
    ("FRZ_002", "SKU-FR02", "Sweet Golden Corn Kernels 500g", "Frozen & Ready-to-Eat", "Frozen Vegetables", 70.00, 100.00, 20, 365, 0.05, 30),
    ("FRZ_003", "SKU-FR03", "Malabar Multi-Layer Parotta 5s (Frozen)", "Frozen & Ready-to-Eat", "Ready Meals", 60.00, 90.00, 25, 180, 0.06, 50),
    ("FRZ_004", "SKU-FR04", "Ready-to-Steam Idiyappam 10s (Frozen)", "Frozen & Ready-to-Eat", "Ready Meals", 55.00, 80.00, 20, 180, 0.06, 40),
    ("FRZ_005", "SKU-FR05", "Crispy Vegetable Spring Rolls 6s", "Frozen & Ready-to-Eat", "Frozen Snacks", 85.00, 125.00, 15, 270, 0.06, 25),
    ("FRZ_006", "SKU-FR06", "Spiced Paneer Tikka Pops 250g", "Frozen & Ready-to-Eat", "Frozen Snacks", 110.00, 160.00, 15, 270, 0.08, 25),
    ("FRZ_007", "SKU-FR07", "Crispy French Fries 400g", "Frozen & Ready-to-Eat", "Frozen Snacks", 75.00, 110.00, 20, 365, 0.06, 35),
    ("FRZ_008", "SKU-FR08", "Diced Mixed Vegetable Mix 500g", "Frozen & Ready-to-Eat", "Frozen Vegetables", 60.00, 88.00, 20, 365, 0.05, 30),
    ("FRZ_009", "SKU-FR09", "Traditional Malai Kulfi Bar (Frozen)", "Frozen & Ready-to-Eat", "Ice Creams & Desserts", 25.00, 40.00, 30, 180, 0.05, 55),
    ("FRZ_010", "SKU-FR10", "Fresh Grated Coconut Frozen 200g", "Frozen & Ready-to-Eat", "Frozen Ingredients", 40.00, 60.00, 25, 180, 0.05, 40),
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
        if not eligible_sups:
            eligible_sups = [SUPPLIERS_DATA[0]]
        for sup in eligible_sups:
            # Primary supplier gets standard unit cost, secondary gets slight premium
            cost_factor = 1.0 if sup["supplier_id"] in ["SUP_01", "SUP_03", "SUP_05", "SUP_07", "SUP_08", "SUP_09", "SUP_11", "SUP_12"] else 1.05
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
            target = int(prod["base_daily_demand"] * mult * 3.5)
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
    curr = start_date
    for i in range(num_days):
        m, d = curr.month, curr.day
        # Pongal Harvest Festival: Jan 13 - Jan 17
        if m == 1 and 13 <= d <= 17:
            events.append({
                "event_id": f"EVT_PONGAL_{curr.isoformat()}",
                "store_id": None,
                "event_type": "FESTIVAL_PONGAL",
                "event_date": curr.isoformat(),
                "description": "Pongal Harvest Festival across Tamil Nadu (High Jaggery, Rice, Ghee, Milk demand)",
                "impact_factor": 2.2,
            })
        # Tamil New Year / Chithirai: April 13 - April 15
        elif m == 4 and 13 <= d <= 15:
            events.append({
                "event_id": f"EVT_TAMIL_NEW_YEAR_{curr.isoformat()}",
                "store_id": None,
                "event_type": "FESTIVAL_NEW_YEAR",
                "event_date": curr.isoformat(),
                "description": "Tamil New Year / Chithirai festival celebrations",
                "impact_factor": 1.7,
            })
        # Deepavali: Late Oct / Early Nov
        elif (m == 10 and d >= 28) or (m == 11 and d <= 2):
            events.append({
                "event_id": f"EVT_DIWALI_{curr.isoformat()}",
                "store_id": None,
                "event_type": "FESTIVAL_DIWALI",
                "event_date": curr.isoformat(),
                "description": "Diwali Festival of Lights shopping peak (High Ghee, Sweets, Personal Care gift demand)",
                "impact_factor": 2.5,
            })
        # Agni Nakshatram Summer Heatwave: May 1 - May 25
        elif m == 5 and 1 <= d <= 25:
            events.append({
                "event_id": f"EVT_HEATWAVE_{curr.isoformat()}",
                "store_id": None,
                "event_type": "WEATHER_HEATWAVE",
                "event_date": curr.isoformat(),
                "description": "Agni Nakshatram Summer Heatwave (High beverage, curd, ice cream & frozen demand)",
                "impact_factor": 1.5,
            })
        # Northeast Monsoon & Coastal Flooding: Oct 25 - Nov 20
        elif (m == 10 and d >= 25) or (m == 11 and d <= 20):
            events.append({
                "event_id": f"EVT_MONSOON_{curr.isoformat()}",
                "store_id": "CHN_01",
                "event_type": "WEATHER_MONSOON",
                "event_date": curr.isoformat(),
                "description": "Northeast Monsoon heavy rains and delivery logistics delays",
                "impact_factor": 0.75,
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
    
    # Store initial stock state
    initial_inventory = {}
    for store in STORES_DATA:
        s_id = store["store_id"]
        mult = store["demand_multiplier"]
        for prod in products:
            p_id = prod["product_id"]
            base_d = prod["base_daily_demand"] * mult
            start_qty = int(base_d * random.uniform(5.0, 7.5))
            initial_inventory[(s_id, p_id)] = {
                "physical": max(start_qty, prod["min_safety_stock"] * 2),
                "reserved": 0,
                "incoming": 0,
            }

    curr_inventory = {k: dict(v) for k, v in initial_inventory.items()}

    for day_idx, curr_date in enumerate(date_range):
        curr_d_str = curr_date.isoformat()
        dow = curr_date.weekday()
        is_weekend = dow in (5, 6)
        month = curr_date.month

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
                evt_mult = ev["impact_factor"]
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

                # Category-specific event elasticity
                cat_mult = 1.0
                if festival_flag:
                    if cat in ("Staples & Grains", "Dairy & Bakery"):
                        cat_mult = evt_mult
                    elif cat == "Fruits & Vegetables":
                        cat_mult = evt_mult * 1.15
                    elif cat == "Packaged Foods":
                        cat_mult = evt_mult * 0.95
                    elif cat == "Personal Care":
                        cat_mult = 1.40 if "DIWALI" in ev["event_type"] else 1.10
                    elif cat == "Household Products":
                        cat_mult = 1.35 if "DIWALI" in ev["event_type"] else 1.05
                    else:
                        cat_mult = 1.10
                elif weather_cond == "HEATWAVE":
                    if cat == "Beverages":
                        cat_mult = 1.85 # Strong beverage surge
                    elif cat == "Frozen & Ready-to-Eat":
                        cat_mult = 1.70 # Kulfi & ice cream demand
                    elif cat == "Dairy & Bakery":
                        cat_mult = 1.45 if p_id in ("CURD_001", "BTM_001") else 1.0
                    elif cat == "Fruits & Vegetables":
                        cat_mult = 0.90 # Perishability resistance
                elif weather_cond == "MONSOON" and s_id == "CHN_01":
                    if cat in ("Beverages", "Packaged Foods"):
                        cat_mult = 1.35 # Comfort hot drinks & noodles surge
                    elif cat == "Household Products":
                        cat_mult = 1.45 # Disinfectants & mosquito coils
                    else:
                        cat_mult = 0.70 # Footfall drop

                # Day of week multiplier (weekend surge)
                dow_mult = 1.30 if is_weekend else 0.95

                # Promotional variation (10% random probability)
                promo_flag = (hash(f"{s_id}_{p_id}_{curr_d_str}") % 10 == 0)
                promo_mult = 1.35 if promo_flag else 1.0
                effective_price = round(prod["base_price"] * (0.85 if promo_flag else 1.0), 2)

                # Correlated latent true demand with Poisson/Gaussian noise
                expected_demand = base_d * cat_mult * dow_mult * promo_mult
                noise = np.random.normal(0, max(2.0, expected_demand * 0.12))
                true_demand = max(1, int(round(expected_demand + noise)))

                # Scenario injection for test reproducibility:
                # Stockout scenario for MILK_001 in Salem around day 340
                if s_id == "SLM_01" and p_id == "MILK_001" and 335 <= day_idx <= 345:
                    curr_inventory[(s_id, p_id)]["physical"] = min(curr_inventory[(s_id, p_id)]["physical"], 12)

                # Stock constraint: Observed Sales vs Censored Demand
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
                    batch_size = int(base_d * random.uniform(3.0, 5.5))
                    curr_inventory[(s_id, p_id)]["physical"] += batch_size

                sales_records.append({
                    "store_id": s_id,
                    "product_id": p_id,
                    "sale_date": curr_d_str,
                    "units_sold": units_sold,
                    "true_demand_latent": true_demand,
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
        
        # Scenario calibration for integration testing
        if s_id == "CBE_01" and p_id == "MILK_001":
            phys = 140 # Ample stock for transfer
        elif s_id == "SLM_01" and p_id == "MILK_001":
            phys = 15  # Critical stockout risk

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
    start = date(2026, 10, 1)
    for d_idx in range(30):
        o_date = start + timedelta(days=d_idx)
        for sup in SUPPLIERS_DATA[:6]:
            matching_prods = [p for p in products if p["category"] == sup["category"]]
            if not matching_prods:
                matching_prods = products[:5]
            prod = random.choice(matching_prods)
            store = random.choice(STORES_DATA)
            lead = sup["lead_time_days"]
            exp_date = o_date + timedelta(days=lead)
            
            # Probability of supplier delay
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
    print(" Assortment: 88 SKUs across 8 Tamil Nadu Supermarket Categories")
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
    print(f"[OK] Generated {len(df_products)} Products across 8 Categories -> {DATA_RAW_DIR / 'products.csv'}")

    # 5. Supplier Products & Store Products
    df_sup_prod = pd.DataFrame(get_supplier_products(products))
    df_sup_prod.to_csv(DATA_RAW_DIR / "supplier_products.csv", index=False)
    print(f"[OK] Generated {len(df_sup_prod)} Supplier-Product Mappings")

    df_store_prod = pd.DataFrame(get_store_products(products))
    df_store_prod.to_csv(DATA_RAW_DIR / "store_products.csv", index=False)
    print(f"[OK] Generated {len(df_store_prod)} Store-Product Mappings")

    # 6. Sales, Inventory & External Events
    print("\nSimulating 365 days of correlated multi-store sales (160,600 records)...")
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
    df_sales["sale_date"] = pd.to_datetime(df_sales["sale_date"])
    df_sales = df_sales.sort_values(by=["sale_date", "store_id", "product_id"]).reset_index(drop=True)

    unique_dates = df_sales["sale_date"].drop_duplicates().sort_values().reset_index(drop=True)
    train_end_idx = 273 # ~9 months
    val_end_idx = 273 + 61 # ~2 months

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
