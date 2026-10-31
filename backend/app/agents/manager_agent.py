"""Store Manager Agent: Prepares concise WhatsApp alerts, presents options, and handles responses."""
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.agents.state import AgentState
from backend.app.models import Store
from backend.app.core.logging import logger

class StoreManagerAgent:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def format_whatsapp_proposal(self, state: AgentState) -> AgentState:
        """Formats a structured, human-readable WhatsApp alert with interactive options."""
        decision_id = state.get("decision_id", "DEC-UNKNOWN")
        version = state.get("current_version", 1)
        recs = state.get("recommendations", [])
        risk = state.get("detected_risk", {})

        store_res = await self.session.get(Store, state["store_id"])
        store_name = store_res.name if store_res else state["store_id"]

        lines = [
            f"🚨 *RETAILMIND AI ALERT* | {store_name}",
            f"📅 Status: *Action Required* | Decision ID: `{decision_id}` (v{version})",
            "────────────────────────",
            f"⚠️ *Detected Risk*: {risk.get('root_cause', 'Inventory disruption detected.')}",
            f"💰 *Potential Financial Loss*: INR {risk.get('financial_impact_est', 0):,.2f}",
            "",
            "📋 *AI Recommended Strategies*:"
        ]

        # Present top 3 options
        options = []
        for idx, r in enumerate(recs[:3], 1):
            action_title = r["action_type"].replace("_", " ").title()
            qty_str = f"{r.get('quantity', 0)} units" if r.get("quantity") else ""
            lines.append(
                f"*Option {idx}*: {action_title} {qty_str}\n"
                f"   • Expected Profit: *INR {r.get('expected_net_profit', 0):,.2f}*\n"
                f"   • Confidence: {int(r.get('confidence_score', 0.9) * 100)}%\n"
                f"   • Rationale: {r.get('explanation', '')[:90]}..."
            )
            options.append({
                "option_id": f"OPT_{decision_id}_v{version}_{idx}",
                "title": f"Option {idx}: {action_title[:18]}",
                "action_type": r["action_type"],
                "data": r
            })

        lines.extend([
            "",
            "Reply with *1*, *2*, or *3* to approve, or *REJECT* to dismiss."
        ])

        notification_text = "\n".join(lines)
        state["manager_notification_text"] = notification_text
        logger.info(f"[StoreManagerAgent] Formatted WhatsApp notification for {store_name}")
        return state
