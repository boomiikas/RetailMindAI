"""Monitoring Agent: Observes retail telemetry, detects stockout and supplier disruptions."""
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
        
        # Scan active risks
        risks = await self.risk_service.scan_and_detect_risks(store_id=state["store_id"])
        matching_risk = next(
            (r for r in risks if r["product_id"] == state["product_id"]),
            None
        )

        if matching_risk:
            state["detected_risk"] = matching_risk
            state["disruption_type"] = matching_risk["risk_type"]
            logger.info(f"[MonitoringAgent] Disruption detected: {matching_risk['risk_type']} ({matching_risk['severity']})")
        else:
            state["disruption_type"] = "NORMAL"
            logger.info("[MonitoringAgent] Operations within normal thresholds.")

        return state
