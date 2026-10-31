"""Impact Analysis Agent: Calculates cascading downstream supply chain ripples."""
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.agents.state import AgentState
from backend.app.services.ripple.ripple_service import RippleEffectService
from backend.app.core.logging import logger

class ImpactAnalysisAgent:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.ripple_service = RippleEffectService(session)

    async def run(self, state: AgentState) -> AgentState:
        risk = state.get("detected_risk")
        if not risk:
            logger.info("[ImpactAnalysisAgent] No active risk to analyze.")
            return state

        logger.info(f"[ImpactAnalysisAgent] Tracing ripple effects for Risk: {risk['risk_id']}")
        
        ripple = await self.ripple_service.analyze_ripple_effect(
            event_id=risk["risk_id"],
            disruption_type=risk["risk_type"],
            source_entity_id=state["store_id"],
            affected_product_id=state["product_id"],
            affected_store_id=state["store_id"],
            spike_units=risk.get("affected_quantity", 50)
        )

        state["ripple_impact"] = ripple
        state["structured_explanation"] = ripple["structured_explanation"]
        logger.info(f"[ImpactAnalysisAgent] Ripple impact calculated: Financial exposure INR {ripple['financial_loss_est']:,.2f}")
        return state
