"""Monitoring Agent (Backward Compatibility Wrapper).

Wraps deterministic RiskDetectionService.
"""
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.agents.state import AgentState
from backend.app.services.risk.risk_service import RiskDetectionService
from backend.app.core.logging import logger

class MonitoringAgent:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.risk_service = RiskDetectionService(session)

    async def run(self, state: AgentState) -> AgentState:
        logger.info(f"[MonitoringAgent] Checking telemetry for Store: {state['store_id']}, Product: {state['product_id']}")
        risks = await self.risk_service.scan_and_detect_risks(store_id=state["store_id"])
        matching_risk = next(
            (r for r in risks if r["product_id"] == state["product_id"]),
            None
        )
        if matching_risk:
            state["detected_risk"] = matching_risk
            state["disruption_type"] = matching_risk["risk_type"]
        else:
            state["disruption_type"] = "NORMAL"
        return state
