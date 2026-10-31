"""What-If Digital Twin Simulation API endpoints for RetailMind AI."""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.models import Inventory, Product
from backend.app.schemas.contracts import RunSimulationRequest
from backend.app.services.simulation.digital_twin import RetailDigitalTwin
from backend.ml.inference.predictor import get_demand_predictor

router = APIRouter(prefix="/simulations", tags=["What-If Digital Twin"])

# In-memory storage for simulated runs
_sim_cache: Dict[str, Any] = {}

@router.post("/run")
async def run_simulation(
    payload: RunSimulationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Runs a discrete-event SimPy What-If simulation comparing multiple scenarios without mutating DB."""
    # Fetch real inventory and product pricing
    inv_stmt = select(Inventory).where(
        Inventory.store_id == payload.store_id,
        Inventory.product_id == payload.product_id
    )
    inv = (await db.execute(inv_stmt)).scalar_one_or_none()
    prod = await db.get(Product, payload.product_id)

    if not prod:
        raise HTTPException(status_code=404, detail=f"Product {payload.product_id} not found")

    predictor = get_demand_predictor()
    fc = predictor.predict(payload.store_id, payload.product_id, horizon_days=7)
    daily_p50 = max(1.0, fc["total_p50_demand"] / 7.0)

    twin = RetailDigitalTwin(
        store_id=payload.store_id,
        product_id=payload.product_id,
        initial_available_stock=inv.available_stock if inv else 20,
        daily_p50_demand=daily_p50,
        unit_cost=float(prod.unit_cost),
        base_price=float(prod.base_price),
        holding_cost_per_day=float(prod.holding_cost_per_day),
        simulation_days=7
    )

    scenario_dicts = [s.model_dump() for s in payload.scenarios]
    sim_result = twin.compare_scenarios(scenario_dicts)

    sim_id = f"SIM_{payload.store_id}_{payload.product_id}_{len(_sim_cache) + 1}"
    sim_result["simulation_id"] = sim_id
    _sim_cache[sim_id] = sim_result

    return sim_result

@router.get("/{simulation_id}")
async def get_simulation(simulation_id: str):
    """Retrieves previous What-If simulation results."""
    if simulation_id not in _sim_cache:
        raise HTTPException(status_code=404, detail=f"Simulation {simulation_id} not found")
    return _sim_cache[simulation_id]
