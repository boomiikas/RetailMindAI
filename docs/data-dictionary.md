# RetailMind AI: Synthetic Retail Data Dictionary

This document defines every generated table, column, data type, unit, and logical constraint in the synthetic retail dataset for RetailMind AI.

Deterministic Seed: `42`  
Coverage: 5 Stores $\times$ 60 Products $\times$ 365 Days = **109,500 daily sales records** across Tamil Nadu, India.

---

## 1. Master Data Tables

### 1.1 `stores`
Represents physical retail retail outlets across Tamil Nadu.

| Field Name | Type | Description | Allowed Values / Example |
|---|---|---|---|
| `store_id` | String(32) | Primary key for store | `CHN_01`, `CBE_01`, `SLM_01`, `MDU_01`, `TRY_01` |
| `name` | String(128) | Human-readable store brand name | `RetailMind Chennai Flagship` |
| `city` | String(64) | Municipality / City in Tamil Nadu | `Chennai`, `Coimbatore`, `Salem`, `Madurai`, `Trichy` |
| `region` | String(64) | State / Geographic territory | `Tamil Nadu` |
| `address` | Text | Physical street address | `42 Anna Nagar 2nd Avenue, Chennai 600040` |
| `size_sqft` | Integer | Total retail floor area in square feet | `6,900` – `14,500` |
| `store_type` | String(32) | Classification of store format | `HYPERMARKET`, `SUPERMARKET` |
| `manager_name` | String(128) | Designated store operational manager | `R. Sundaram`, `K. Murugan` |
| `manager_phone` | String(32) | WhatsApp-enabled manager mobile number | `+919840123456` |
| `active` | Boolean | Store operational status | `True` / `False` |
| `created_at` | Timestamp | Ingestion record creation timestamp | ISO 8601 UTC |

### 1.2 `products`
Master catalogue of retail consumer items.

| Field Name | Type | Description | Allowed Values / Example |
|---|---|---|---|
| `product_id` | String(32) | Primary key for product | `MILK_001`, `RICE_001`, `PROD_001` |
| `sku` | String(64) | Stock Keeping Unit identifier | `SKU-D01`, `SKU-S01` |
| `name` | String(128) | Commercial product name | `Aavin Toned Fresh Milk 500ml` |
| `category` | String(64) | High-level retail department | `DAIRY`, `STAPLES`, `PRODUCE`, `PACKAGED`, `PERSONAL_HOME` |
| `subcategory` | String(64) | Fine-grained merchandising segment | `Fresh Milk`, `Rice & Grains`, `Vegetables`, etc. |
| `unit_cost` | Numeric(10,2) | Procurement acquisition cost per unit (INR) | ₹8.00 – ₹610.00 |
| `base_price` | Numeric(10,2) | Normal non-discounted retail selling price (INR) | ₹15.00 – ₹760.00 |
| `min_safety_stock` | Integer | Minimum units required for emergency buffer | 10 – 50 units |
| `shelf_life_days` | Integer | Usable life from packaging to expiration | 2 (Fresh Milk) – 730 (Personal Care) |
| `holding_cost_per_day` | Numeric(8,4) | Inventory carrying cost per unit per day (INR) | ₹0.02 – ₹0.40 |
| `active` | Boolean | Commercial availability flag | `True` |

### 1.3 `suppliers`
Wholesale and manufacturing vendor master.

| Field Name | Type | Description | Example |
|---|---|---|---|
| `supplier_id` | String(32) | Primary key for vendor | `SUP_01` (Aavin), `SUP_03` (TN Agro) |
| `name` | String(128) | Registered vendor legal name | `Aavin Dairy Co-operative` |
| `contact_phone` | String(32) | Commercial contact phone number | `+919444011111` |
| `email` | String(128) | Procurement order intake email | `orders@aavin.tn.gov.in` |
| `lead_time_days` | Integer | Standard transit replenishment lead time | 1 – 4 days |
| `reliability_score` | Numeric(4,3) | Historical on-time full delivery rate | 0.86 – 0.97 |
| `min_order_qty` | Integer | Minimum batch purchase quantity (MOQ) | 20 – 100 units |
| `max_order_qty` | Integer | Supplier batch manufacturing ceiling | 1,500 – 5,000 units |

### 1.4 `store_routes`
Logistics and transfer connectivity between retail branches.

| Field Name | Type | Description | Example |
|---|---|---|---|
| `route_id` | String(64) | Composite route identifier | `RT_CBE_01_SLM_01` |
| `source_store_id` | String(32) | Origin store identifier | `CBE_01` |
| `destination_store_id` | String(32) | Destination store identifier | `SLM_01` |
| `distance_km` | Numeric(8,2) | Road transport distance (kilometers) | `165.00` |
| `transit_time_hours` | Numeric(6,2) | Inter-store transit duration | `3.50` hours |
| `transportation_cost_per_unit` | Numeric(8,2) | Freight transfer cost per unit (INR) | `₹1.80` |

---

## 2. Operations & Inventory Tables

### 2.1 `sales`
Daily store sales transactions (109,500 rows).

| Field Name | Type | Description | Example |
|---|---|---|---|
| `sale_id` | BigInt | Auto-increment primary key | `1`, `2`, ... |
| `store_id` | String(32) | Store where transaction occurred | `SLM_01` |
| `product_id` | String(32) | Sold product item | `MILK_001` |
| `sale_date` | Date | Transaction calendar date | `2026-05-14` |
| `units_sold` | Integer | Actual units transacted at register | `84` |
| `unit_price` | Numeric(10,2) | Price realized per unit | `₹24.00` |
| `promotional_flag` | Boolean | Indicates active discount promotion | `False` |
| `weather_condition` | String(32) | Prevailing meteorological state | `NORMAL`, `HEATWAVE`, `MONSOON` |
| `festival_flag` | Boolean | True if within festival event window | `True` (e.g. Pongal) |
| `stockout_flag` | Boolean | True if stock depleted (censoring indicator) | `True` / `False` |

### 2.2 `inventory`
Real-time stock ledger positions.

| Field Name | Type | Invariant & Logic | Example |
|---|---|---|---|
| `inventory_id` | BigInt | Primary key | `1` |
| `store_id` | String(32) | Store identifier | `CBE_01` |
| `product_id` | String(32) | Product identifier | `MILK_001` |
| `physical_on_hand` | Integer | Physical inventory in stockroom/shelves | `140` |
| `available_stock` | Integer | Available for new sale/transfer: `physical - reserved` | `140` |
| `reserved_stock` | Integer | Earmarked for approved transfers/orders | `0` |
| `incoming_stock` | Integer | In-transit stock from POs or inbound transfers | `20` |
| `safety_stock` | Integer | Buffer threshold preventing stockout | `25` |
| `reorder_point` | Integer | Threshold triggering replenishment recommendation | `55` |
| `days_of_supply` | Numeric(6,2) | `available_stock / average_daily_demand` | `4.2` days |

### 2.3 `inventory_transactions`
Auditable immutable stock movement log.

| Field Name | Type | Description |
|---|---|---|
| `transaction_id` | BigInt | Sequential ledger ID |
| `store_id` | String(32) | Store location |
| `product_id` | String(32) | Transacted item |
| `transaction_type` | String(32) | `SALE`, `PURCHASE_RECEIVED`, `TRANSFER_OUT`, `TRANSFER_IN`, `RESERVATION`, `RESERVATION_RELEASE` |
| `quantity_change` | Integer | Signed delta ($+$ or $-$) |
| `reference_type` | String(32) | `TRANSFER_ORDER`, `PURCHASE_ORDER`, `SALE_ORDER` |
| `previous_quantity` | Integer | Stock count before movement |
| `resulting_quantity` | Integer | Stock count after movement |

---

## 3. Decision Intelligence & Dynamic Replanning Tables

### 3.1 `decision_records` & `decision_versions`
Lifecycle and immutable state snapshots for retail actions.

- **Decision States**: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `REPLANNING`, `CANCELLED`
- **Execution States**: `NOT_STARTED`, `RESERVED`, `DISPATCHED`, `IN_TRANSIT`, `RECEIVED`, `COMPLETED`, `FAILED`
- **Version Tracking**: Version 1 is recorded upon AI recommendation; if pre-dispatch conditions invalidate feasibility, Version 1 is PAUSED and Version 2 is generated for fresh approval.
