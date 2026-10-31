"""Decision Optimization Agent: Solves Pyomo MILP and ranks actionable interventions."""
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.agents.state import AgentState
from backend.app.services.optimization.optimizer import RetailOptimizer
from backend.app.models import DecisionRecord, DecisionVersion, Recommendation
from backend.app.core.logging import logger

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class DecisionOptimizationAgent:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.optimizer = RetailOptimizer(session)

    async def run(self, state: AgentState) -> AgentState:
        logger.info(f"[DecisionOptimizationAgent] Solving MILP for Store: {state['store_id']}, Product: {state['product_id']}")

        recs = await self.optimizer.optimize_inventory_decisions(
            dest_store_id=state["store_id"],
            product_id=state["product_id"],
            risk_id=state.get("detected_risk", {}).get("risk_id")
        )

        state["recommendations"] = recs
        if not recs:
            logger.warning("[DecisionOptimizationAgent] No feasible recommendations found.")
            return state

        # Top recommendation is primary recommendation
        primary = recs[0]
        state["chosen_recommendation"] = primary
        
        # Create decision record
        decision_id = f"DEC_{state['store_id']}_{state['product_id']}_{int(datetime.now().timestamp())}"
        state["decision_id"] = decision_id
        state["current_version"] = 1
        state["decision_status"] = "PENDING"
        state["execution_status"] = "NOT_STARTED"

        # Persist Decision and Version 1 to DB
        dec_obj = DecisionRecord(
            decision_id=decision_id,
            risk_id=state.get("detected_risk", {}).get("risk_id"),
            current_version=1,
            decision_status="PENDING",
            execution_status="NOT_STARTED",
            original_recommendation_snapshot=primary,
            created_at=utc_now(),
            updated_at=utc_now()
        )
        self.session.add(dec_obj)

        version_obj = DecisionVersion(
            version_id=f"VER_{decision_id}_v1",
            decision_id=decision_id,
            version_number=1,
            recommendation_data=primary,
            replanning_reason="Initial optimal intervention proposal",
            created_at=utc_now()
        )
        self.session.add(version_obj)
        await self.session.commit()

        logger.info(f"[DecisionOptimizationAgent] Decision {decision_id} (v1) created. Recommended: {primary['action_type']}")
        return state
