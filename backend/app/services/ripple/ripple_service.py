"""Ripple Effect Intelligence Service using NetworkX for RetailMind AI.

Constructs an operational dependency DAG connecting Suppliers, Stores, Products,
Inventory, Demand, Revenue, and Profit. Traverses downstream paths to compute
mathematical cascading financial loss, affected nodes, and structured rationale.
"""

from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import networkx as nx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import (
    Store, Product, Supplier, SupplierProduct, StoreRoute, Inventory, RippleImpact
)
from backend.app.core.logging import logger

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class RippleEffectService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.graph = nx.DiGraph()

    async def build_dependency_graph(self):
        """Constructs the retail operational DAG."""
        self.graph.clear()

        # Load master entities
        stores_res = await self.session.execute(select(Store))
        stores = stores_res.scalars().all()

        prods_res = await self.session.execute(select(Product))
        products = prods_res.scalars().all()

        sups_res = await self.session.execute(select(Supplier))
        suppliers = sups_res.scalars().all()

        sup_prod_res = await self.session.execute(select(SupplierProduct))
        sup_products = sup_prod_res.scalars().all()

        routes_res = await self.session.execute(select(StoreRoute))
        routes = routes_res.scalars().all()

        # 1. Add Nodes
        for sup in suppliers:
            self.graph.add_node(
                f"SUPPLIER_{sup.supplier_id}",
                label=sup.name,
                type="SUPPLIER",
                lead_time=sup.lead_time_days,
                reliability=float(sup.reliability_score)
            )

        for store in stores:
            self.graph.add_node(
                f"STORE_{store.store_id}",
                label=store.name,
                type="STORE",
                city=store.city
            )
            # Add Financial nodes per store
            self.graph.add_node(f"REVENUE_{store.store_id}", label=f"{store.city} Revenue", type="FINANCIAL")
            self.graph.add_node(f"PROFIT_{store.store_id}", label=f"{store.city} Net Profit", type="FINANCIAL")
            self.graph.add_edge(f"REVENUE_{store.store_id}", f"PROFIT_{store.store_id}", relationship="CONTRIBUTES_TO")

        for prod in products:
            self.graph.add_node(
                f"PRODUCT_{prod.product_id}",
                label=prod.name,
                type="PRODUCT",
                category=prod.category,
                unit_cost=float(prod.unit_cost),
                base_price=float(prod.base_price)
            )

        # 2. Add Supplier -> Product Edges
        for sp in sup_products:
            self.graph.add_edge(
                f"SUPPLIER_{sp.supplier_id}",
                f"PRODUCT_{sp.product_id}",
                relationship="SUPPLIES",
                lead_time=sp.lead_time_days
            )

        # 3. Add Store - Product Inventory Nodes & Edges
        for store in stores:
            for prod in products:
                inv_node = f"INV_{store.store_id}_{prod.product_id}"
                self.graph.add_node(
                    inv_node,
                    label=f"{store.city} {prod.name} Stock",
                    type="INVENTORY",
                    store_id=store.store_id,
                    product_id=prod.product_id
                )
                self.graph.add_edge(f"PRODUCT_{prod.product_id}", inv_node, relationship="STOCKED_AT")
                self.graph.add_edge(inv_node, f"STORE_{store.store_id}", relationship="FULFILLS_SALES")
                self.graph.add_edge(f"STORE_{store.store_id}", f"REVENUE_{store.store_id}", relationship="GENERATES_REVENUE")

        # 4. Add Inter-store Logistics Edges
        for r in routes:
            self.graph.add_edge(
                f"STORE_{r.source_store_id}",
                f"STORE_{r.destination_store_id}",
                relationship="LOGISTICS_ROUTE",
                distance_km=float(r.distance_km),
                transit_hours=float(r.transit_time_hours),
                cost_per_unit=float(r.transportation_cost_per_unit)
            )

    async def analyze_ripple_effect(
        self,
        event_id: str,
        disruption_type: str, # SUPPLIER_DELAY, DEMAND_SPIKE, COMPETITOR_PRICE_DROP
        source_entity_id: str, # e.g. "SUP_01", "CBE_01", "MILK_001"
        affected_product_id: str,
        affected_store_id: str,
        delay_days: int = 0,
        spike_units: int = 0
    ) -> Dict[str, Any]:
        """Calculates downstream cascading impacts and mathematical financial exposure."""
        if self.graph.number_of_nodes() == 0:
            await self.build_dependency_graph()

        # Retrieve current inventory and pricing
        inv_stmt = select(Inventory).where(
            Inventory.store_id == affected_store_id,
            Inventory.product_id == affected_product_id
        )
        inv_res = await self.session.execute(inv_stmt)
        inv = inv_res.scalar_one_or_none()

        prod_stmt = select(Product).where(Product.product_id == affected_product_id)
        prod_res = await self.session.execute(prod_stmt)
        prod = prod_res.scalar_one_or_none()

        store_stmt = select(Store).where(Store.store_id == affected_store_id)
        store_res = await self.session.execute(store_stmt)
        store = store_res.scalar_one_or_none()

        unit_cost = float(prod.unit_cost) if prod else 20.0
        base_price = float(prod.base_price) if prod else 25.0
        unit_margin = base_price - unit_cost
        curr_avail = inv.available_stock if inv else 15
        safety_stock = inv.safety_stock if inv else 20

        # Construct specific trajectory
        nodes = []
        edges = []
        path_nodes = []

        if disruption_type == "SUPPLIER_DELAY":
            sup_node = f"SUPPLIER_{source_entity_id}"
            inv_node = f"INV_{affected_store_id}_{affected_product_id}"
            store_node = f"STORE_{affected_store_id}"
            rev_node = f"REVENUE_{affected_store_id}"
            prof_node = f"PROFIT_{affected_store_id}"

            path_nodes = [sup_node, inv_node, store_node, rev_node, prof_node]

            # Mathematical impact calculation
            daily_burn_rate = 60 # approx daily consumption units
            shortage_days = max(1, delay_days)
            lost_sales_units = max(0, (shortage_days * daily_burn_rate) - curr_avail)
            financial_loss = round(lost_sales_units * unit_margin, 2)
            holding_cost_est = 0.0
            markdown_risk_est = 0.0

            explanation = (
                f"Disruption detected at supplier {source_entity_id}: Delivery delayed by {delay_days} days. "
                f"Incoming stock is halted while daily consumption at {store.city if store else affected_store_id} "
                f"depletes current stock ({curr_avail} units). Downstream stockout expected in "
                f"{max(0.5, curr_avail / daily_burn_rate):.1f} days, projecting {lost_sales_units} unfulfilled units "
                f"and INR {financial_loss:,.2f} lost gross margin."
            )

        elif disruption_type == "DEMAND_SPIKE":
            store_node = f"STORE_{affected_store_id}"
            inv_node = f"INV_{affected_store_id}_{affected_product_id}"
            rev_node = f"REVENUE_{affected_store_id}"
            prof_node = f"PROFIT_{affected_store_id}"

            path_nodes = [store_node, inv_node, rev_node, prof_node]

            lost_sales_units = max(0, spike_units - curr_avail)
            financial_loss = round(lost_sales_units * unit_margin, 2)
            holding_cost_est = 0.0
            markdown_risk_est = 0.0

            explanation = (
                f"Sudden local demand spike of {spike_units} units at {store.city if store else affected_store_id}. "
                f"Available inventory ({curr_avail} units) falls below required consumption and safety buffer. "
                f"Local safety stock is breached, creating an immediate ripple shortage."
            )
        else: # OVERSTOCK / COMPETITOR PRICE DROP
            inv_node = f"INV_{affected_store_id}_{affected_product_id}"
            store_node = f"STORE_{affected_store_id}"
            prof_node = f"PROFIT_{affected_store_id}"

            path_nodes = [inv_node, store_node, prof_node]
            lost_sales_units = 0
            excess_units = max(20, curr_avail - (safety_stock * 2))
            holding_cost_est = round(excess_units * float(prod.holding_cost_per_day if prod else 0.05) * 30, 2)
            markdown_risk_est = round(excess_units * unit_cost * 0.20, 2) # 20% markdown liability
            financial_loss = round(holding_cost_est + markdown_risk_est, 2)

            explanation = (
                f"Excess inventory accumulation of {excess_units} units at {store.city if store else affected_store_id}. "
                f"Carrying cost compounds at INR {holding_cost_est:,.2f} per month with an estimated markdown risk "
                f"of INR {markdown_risk_est:,.2f} if inventory is not transferred or discounted."
            )

        # Assemble graph nodes & edges for frontend React visualization
        for p in path_nodes:
            label = self.graph.nodes[p].get("label", p) if p in self.graph else p
            n_type = self.graph.nodes[p].get("type", "NODE") if p in self.graph else "SYSTEM"
            nodes.append({"id": p, "label": label, "type": n_type})

        for i in range(len(path_nodes) - 1):
            src, tgt = path_nodes[i], path_nodes[i + 1]
            edges.append({
                "source": src,
                "target": tgt,
                "relationship": "DOWNSTREAM_DISRUPTION"
            })

        affected_nodes_dict = {
            n["id"]: {"type": n["type"], "status": "IMPACTED"}
            for n in nodes
        }

        # Save or update RippleImpact record
        impact_id = f"RPL_{event_id}"
        existing_impact = await self.session.get(RippleImpact, impact_id)
        if not existing_impact:
            rpl_obj = RippleImpact(
                impact_id=impact_id,
                risk_id=event_id,
                root_disruption_node=path_nodes[0] if path_nodes else "UNKNOWN",
                affected_nodes=affected_nodes_dict,
                dependency_path=path_nodes,
                potential_lost_sales_units=lost_sales_units,
                financial_loss_est=financial_loss,
                markdown_risk_est=markdown_risk_est,
                holding_cost_est=holding_cost_est,
                structured_explanation=explanation,
                calculated_at=utc_now()
            )
            self.session.add(rpl_obj)
            await self.session.commit()

        return {
            "event_id": event_id,
            "disruption_type": disruption_type,
            "root_disruption_node": path_nodes[0] if path_nodes else "UNKNOWN",
            "affected_store_id": affected_store_id,
            "affected_product_id": affected_product_id,
            "nodes": nodes,
            "edges": edges,
            "dependency_path": path_nodes,
            "potential_lost_sales_units": lost_sales_units,
            "financial_loss_est": financial_loss,
            "holding_cost_est": holding_cost_est,
            "markdown_risk_est": markdown_risk_est,
            "structured_explanation": explanation
        }
