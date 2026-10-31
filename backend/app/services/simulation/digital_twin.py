"""What-If Digital Twin Simulation Engine for RetailMind AI.

Simulates multi-scenario business interventions using SimPy and NumPy without
modifying actual operational database records. Compares alternative decisions
under identical starting conditions and demand assumptions.
"""

from typing import Dict, List, Any, Optional
import numpy as np
import simpy

class RetailDigitalTwin:
    def __init__(
        self,
        store_id: str,
        product_id: str,
        initial_available_stock: int,
        daily_p50_demand: float,
        unit_cost: float,
        base_price: float,
        holding_cost_per_day: float = 0.05,
        lost_sales_penalty_per_unit: float = 5.0,
        simulation_days: int = 7
    ):
        self.store_id = store_id
        self.product_id = product_id
        self.initial_stock = initial_available_stock
        self.daily_demand = daily_p50_demand
        self.unit_cost = unit_cost
        self.base_price = base_price
        self.holding_cost = holding_cost_per_day
        self.penalty = lost_sales_penalty_per_unit
        self.days = simulation_days

    def simulate_scenario(
        self,
        scenario_name: str,
        action_type: str,
        quantity: int = 0,
        inflow_day: int = 1,
        transfer_cost_per_unit: float = 2.0,
        discount_pct: float = 0.0,
        price_elasticity: float = 1.3
    ) -> Dict[str, Any]:
        """Runs a discrete-event simulation of a specific intervention scenario."""
        env = simpy.Environment()

        # State tracking
        current_stock = [self.initial_stock]
        total_demand = 0
        total_sales = 0
        stockout_units = 0
        holding_cost_acc = 0.0
        operational_cost = 0.0

        effective_price = self.base_price * (1.0 - (discount_pct / 100.0))
        # Price elasticity effect: lower price increases demand
        demand_factor = 1.0 + ((discount_pct / 100.0) * price_elasticity)

        # Operational costs for specific actions
        if action_type == "REPLENISH_SUPPLIER":
            operational_cost += quantity * self.unit_cost
        elif action_type == "INTER_STORE_TRANSFER":
            operational_cost += quantity * transfer_cost_per_unit
        elif action_type == "APPLY_MARKDOWN":
            # Markdown loss per unit compared to base price
            operational_cost += 0.0 # accounted for in lower revenue

        def retail_process(env):
            nonlocal total_demand, total_sales, stockout_units, holding_cost_acc
            for day in range(1, self.days + 1):
                # 1. Check for incoming shipment arrival
                if day == inflow_day and quantity > 0:
                    current_stock[0] += quantity

                # 2. Daily demand realization
                expected_day_demand = max(1.0, self.daily_demand * demand_factor)
                # Deterministic noise with seed
                noise = np.sin(day) * (expected_day_demand * 0.08)
                day_demand = int(round(expected_day_demand + noise))
                total_demand += day_demand

                # 3. Fulfill sales from current stock
                if current_stock[0] >= day_demand:
                    fulfilled = day_demand
                    current_stock[0] -= fulfilled
                else:
                    fulfilled = current_stock[0]
                    shortfall = day_demand - current_stock[0]
                    stockout_units += shortfall
                    current_stock[0] = 0

                total_sales += fulfilled
                # Daily holding cost on remaining stock
                holding_cost_acc += current_stock[0] * self.holding_cost

                # Advance 1 day
                yield env.timeout(1)

        env.process(retail_process(env))
        env.run(until=self.days)

        # Financial Calculations
        gross_revenue = round(total_sales * effective_price, 2)
        lost_sales_units = stockout_units
        lost_sales_revenue = round(lost_sales_units * self.base_price, 2)
        lost_sales_penalty = round(lost_sales_units * self.penalty, 2)
        cogs = round(total_sales * self.unit_cost, 2) if action_type != "REPLENISH_SUPPLIER" else 0.0
        
        # Expected net profit: Revenue - Procurement/Transfer Cost - COGS - Holding Cost - Penalty
        net_profit = round(gross_revenue - operational_cost - cogs - holding_cost_acc - lost_sales_penalty, 2)
        service_level = round(float(total_sales / total_demand), 4) if total_demand > 0 else 1.0

        return {
            "scenario_name": scenario_name,
            "action_type": action_type,
            "quantity_applied": quantity,
            "expected_demand_units": total_demand,
            "available_stock_initial": self.initial_stock,
            "ending_stock_units": current_stock[0],
            "units_sold": total_sales,
            "stockout_units": stockout_units,
            "service_level": service_level,
            "lost_sales_units": lost_sales_units,
            "lost_sales_revenue": lost_sales_revenue,
            "operational_cost": round(operational_cost, 2),
            "holding_cost": round(holding_cost_acc, 2),
            "expected_revenue": gross_revenue,
            "expected_net_profit": net_profit,
            "is_simulated_estimate": True
        }

    def compare_scenarios(self, scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compares multiple simulation scenarios side by side."""
        results = []
        for sc in scenarios:
            res = self.simulate_scenario(
                scenario_name=sc.get("scenario_name", sc.get("action_type", "SCENARIO")),
                action_type=sc.get("action_type", "NO_ACTION"),
                quantity=sc.get("quantity", 0),
                inflow_day=sc.get("inflow_day", 1),
                transfer_cost_per_unit=sc.get("transfer_cost_per_unit", 2.0),
                discount_pct=sc.get("discount_pct", 0.0)
            )
            results.append(res)

        # Sort by expected net profit descending
        ranked_results = sorted(results, key=lambda x: x["expected_net_profit"], reverse=True)
        best_scenario = ranked_results[0] if ranked_results else None

        return {
            "store_id": self.store_id,
            "product_id": self.product_id,
            "horizon_days": self.days,
            "scenarios_evaluated": len(ranked_results),
            "best_recommended_scenario": best_scenario["scenario_name"] if best_scenario else "NO_ACTION",
            "profit_improvement_over_baseline": round(
                best_scenario["expected_net_profit"] - ranked_results[-1]["expected_net_profit"], 2
            ) if len(ranked_results) > 1 else 0.0,
            "scenarios": ranked_results
        }
