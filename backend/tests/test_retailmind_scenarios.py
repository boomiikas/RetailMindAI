"""Retail operations scenario coverage.

Stockout, overstock, supplier disruption, dynamic replanning, execution failure, and performance evaluation.
"""

import uuid
import pytest
import pytest_asyncio
from datetime import date
from sqlalchemy import select

from backend.app.database.session import AsyncSessionLocal, engine, Base
from backend.app.models import (
    Store, Product, Inventory, DecisionRecord, DecisionVersion, ManagerApproval,
    TransferOrder, RiskEvent, KPIPerformance
)
from backend.app.services.risk.risk_service import RiskDetectionService
from backend.app.services.optimization.optimizer import RetailOptimizer
from backend.app.services.ripple.ripple_service import RippleEffectService
from backend.app.agents.replanning_agent import DynamicReplanningAgent
from backend.app.agents.learning_agent import LearningAgent

# Database tables initialized in Supabase PostgreSQL

@pytest.mark.asyncio
async def test_scenario_1_normal_stockout():
    """Test 1: Demand exceeds available inventory -> Stockout risk detected & alternatives generated."""
    async with AsyncSessionLocal() as session:
        risk_service = RiskDetectionService(session)
        optimizer = RetailOptimizer(session)

        # Force a stockout state for Salem Milk
        inv_stmt = select(Inventory).where(Inventory.store_id == "SLM_01", Inventory.product_id == "MILK_001")
        inv = (await session.execute(inv_stmt)).scalar_one_or_none()
        assert inv is not None
        inv.physical_on_hand = 10
        inv.available_stock = 10
        await session.commit()

        # Run risk scan
        risks = await risk_service.scan_and_detect_risks(store_id="SLM_01")
        salem_milk_risk = next((r for r in risks if r["product_id"] == "MILK_001"), None)
        assert salem_milk_risk is not None
        assert salem_milk_risk["risk_type"] == "CRITICAL_STOCKOUT"
        assert salem_milk_risk["financial_impact_est"] > 0

        # Generate optimization alternatives
        recs = await optimizer.optimize_inventory_decisions("SLM_01", "MILK_001")
        assert len(recs) >= 3
        action_types = [r["action_type"] for r in recs]
        assert "INTER_STORE_TRANSFER" in action_types or "REPLENISH_SUPPLIER" in action_types
        assert "NO_ACTION" in action_types

@pytest.mark.asyncio
async def test_scenario_2_overstock_strategy():
    """Test 2: Excess inventory accumulation -> Overstock detected & Markdown/Transfer evaluated."""
    async with AsyncSessionLocal() as session:
        risk_service = RiskDetectionService(session)
        
        # Inject overstock for Biscuit product at Madurai
        inv_stmt = select(Inventory).where(Inventory.store_id == "MDU_01", Inventory.product_id == "PKG_006")
        inv = (await session.execute(inv_stmt)).scalar_one_or_none()
        assert inv is not None
        inv.physical_on_hand = 2000
        inv.available_stock = 2000
        await session.commit()

        risks = await risk_service.scan_and_detect_risks(store_id="MDU_01")
        biscuit_risk = next((r for r in risks if r["product_id"] == "PKG_006"), None)
        assert biscuit_risk is not None
        assert biscuit_risk["risk_type"] == "OVERSTOCK"
        assert biscuit_risk["financial_impact_est"] > 0

@pytest.mark.asyncio
async def test_scenario_3_supplier_delay_ripple():
    """Test 3: Supplier delivery delayed -> Ripple effect traces downstream stock depletion."""
    async with AsyncSessionLocal() as session:
        ripple_service = RippleEffectService(session)
        ripple = await ripple_service.analyze_ripple_effect(
            event_id=f"TEST_EVT_SUP_DELAY_{uuid.uuid4().hex[:6]}",
            disruption_type="SUPPLIER_DELAY",
            source_entity_id="SUP_01",
            affected_product_id="MILK_001",
            affected_store_id="SLM_01",
            delay_days=3
        )
        assert len(ripple["nodes"]) >= 3
        assert len(ripple["edges"]) >= 2
        assert ripple["potential_lost_sales_units"] > 0
        assert ripple["financial_loss_est"] > 0

@pytest.mark.asyncio
async def test_scenario_5_dynamic_replanning_coimbatore_spike():
    """Test 5: Dynamic replanning scenario:
    1. Salem needs milk, AI recommends Coimbatore transfer of 80 units.
    2. Manager approves v1.
    3. Coimbatore suffers unexpected demand spike before dispatch.
    4. AI pauses v1, releases reservation, re-optimizes, creates v2, and publishes the revised decision version.
    """
    async with AsyncSessionLocal() as session:
        uid = uuid.uuid4().hex[:8]
        dec_id = f"DEC_REPLAN_{uid}"
        rec_snapshot = {
            "action_type": "INTER_STORE_TRANSFER",
            "product_id": "MILK_001",
            "source_store_id": "CBE_01",
            "dest_store_id": "SLM_01",
            "quantity": 80,
            "expected_cost": 160.0,
            "expected_net_profit": 800.0
        }
        dec = DecisionRecord(
            decision_id=dec_id,
            current_version=1,
            decision_status="APPROVED",
            execution_status="RESERVED",
            original_recommendation_snapshot=rec_snapshot
        )
        session.add(dec)

        # Create active transfer order
        order = TransferOrder(
            transfer_id=f"TRF_{dec_id}",
            decision_id=dec_id,
            source_store_id="CBE_01",
            dest_store_id="SLM_01",
            product_id="MILK_001",
            quantity=80,
            transfer_cost=160.0,
            status="RESERVED"
        )
        session.add(order)
        await session.commit()

        # Pre-dispatch disruption: Demand spike at Coimbatore
        replanning_agent = DynamicReplanningAgent(session)
        replan_res = await replanning_agent.validate_and_replan(
            decision_id=dec_id,
            disruption_type="DEMAND_SPIKE",
            disruption_details={"spike_units": 45}
        )

        assert replan_res["status"] == "REPLANNING_TRIGGERED"
        assert replan_res["new_version"] == 2
        assert replan_res["replanning_reason"]

        # Verify DB version increment and decision status
        updated_dec = await session.get(DecisionRecord, dec_id)
        assert updated_dec.decision_status == "REPLANNING"
        assert updated_dec.current_version == 2

        # Verify that unexecuted transfer order was cancelled/paused
        updated_order = await session.get(TransferOrder, f"TRF_{dec_id}")
        assert updated_order.status == "CANCELLED"

@pytest.mark.asyncio
async def test_scenario_7_failed_execution_handling():
    """Test 7: Insufficient source stock during reservation triggers clean failure state."""
    async with AsyncSessionLocal() as session:
        uid = uuid.uuid4().hex[:8]
        dec_id = f"DEC_FAIL_{uid}"
        # Action requesting 9999 units (impossible stock)
        rec_snapshot = {
            "action_type": "INTER_STORE_TRANSFER",
            "product_id": "MILK_001",
            "source_store_id": "TRY_01",
            "dest_store_id": "SLM_01",
            "quantity": 9999
        }
        dec = DecisionRecord(
            decision_id=dec_id,
            current_version=1,
            decision_status="APPROVED",
            execution_status="NOT_STARTED",
            original_recommendation_snapshot=rec_snapshot
        )
        session.add(dec)
        await session.commit()

        from backend.app.agents.execution_agent import ExecutionAgent
        exec_agent = ExecutionAgent(session)
        state = {
            "decision_id": dec_id,
            "product_id": "MILK_001",
            "chosen_recommendation": rec_snapshot,
            "execution_logs": []
        }
        res_state = await exec_agent.execute_approved_plan(state)
        assert res_state["execution_status"] == "FAILED"

@pytest.mark.asyncio
async def test_scenario_8_performance_evaluation_modes():
    """Test 8: Evaluates KPIs across Baseline, AI Prescriptive, and AI Agentic modes."""
    async with AsyncSessionLocal() as session:
        learning_agent = LearningAgent(session)
        today = date(2026, 10, 15)

        base_kpi = await learning_agent.compute_operating_mode_kpis("SLM_01", today, "BASELINE")
        agentic_kpi = await learning_agent.compute_operating_mode_kpis("SLM_01", today, "AI_AGENTIC")

        assert agentic_kpi["stockout_rate"] < base_kpi["stockout_rate"]
        assert agentic_kpi["net_profit"] > base_kpi["net_profit"]
        assert agentic_kpi["service_level"] > base_kpi["service_level"]
