"""Decision Communication Agent for RetailMind AI.

Specialized agent managing store manager communications via WhatsApp and Telegram:
- Formats structured, interactive decision proposals with Option 1, 2, 3
- Formats dynamic replanning renewal notifications (v1 -> v2)
- Conversational dialogue handler answering manager questions using grounded DB context
- Zero LLM overhead for routine button clicks (handled deterministically by Approval & Execution services)
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import Store
from backend.app.services.llm.groq_service import groq_llm
from backend.app.core.logging import logger

class DecisionCommunicationAgent:
    def __init__(self, session: Optional[AsyncSession] = None):
        self.session = session

    async def format_whatsapp_proposal(
        self,
        decision_id: Any,
        version: int = 1,
        recommendations: Optional[List[Dict[str, Any]]] = None,
        risk: Optional[Dict[str, Any]] = None,
        store_id: Optional[str] = None
    ) -> Any:
        """Formats an executive WhatsApp decision proposal with interactive options.
        
        Supports being called with an AgentState dict or individual parameters.
        """
        # If called from LangGraph with state dict
        is_state_dict = isinstance(decision_id, dict)
        if is_state_dict:
            state = decision_id
            d_id = state.get("decision_id", "DEC-UNKNOWN")
            v_num = state.get("current_version", 1)
            recs = state.get("recommendations", [])
            r_obj = state.get("detected_risk", {}) or {}
            s_id = state.get("store_id", "SLM_01")
        else:
            d_id = decision_id
            v_num = version
            recs = recommendations or []
            r_obj = risk or {}
            s_id = store_id or "SLM_01"

        store_name = s_id
        if self.session:
            store_res = await self.session.get(Store, s_id)
            if store_res:
                store_name = f"{store_res.name} ({store_res.city})"

        lines = [
            f"🚨 *RETAILMIND AI DECISION ALERT* | {store_name}",
            f"📅 Status: *Action Required* | Decision ID: `{d_id}` (v{v_num})",
            "────────────────────────",
            f"⚠️ *Detected Risk*: {r_obj.get('root_cause', 'Operational inventory disruption detected.')}",
            f"💰 *Potential Financial Loss*: INR {r_obj.get('financial_impact_est', 0):,.2f}",
            "",
            "📋 *Optimized Interventions (Ranked by Profit)*:"
        ]

        options = []
        for idx, r in enumerate(recs[:3], 1):
            action_title = r.get("action_type", "ACTION").replace("_", " ").title()
            qty_str = f"{r.get('quantity', 0)} units" if r.get("quantity") else ""
            lines.append(
                f"*Option {idx}*: {action_title} {qty_str}\n"
                f"   • Net Profit: *INR {r.get('expected_net_profit', 0):,.2f}*\n"
                f"   • Confidence: {int(r.get('confidence_score', 0.9) * 100)}%\n"
                f"   • Rationale: {r.get('explanation', '')[:95]}..."
            )
            options.append({
                "option_id": f"OPT_{d_id}_v{v_num}_{idx}",
                "button_id": f"{d_id}:v{v_num}:{r.get('action_type')}",
                "title": f"Option {idx}: {action_title[:18]}",
                "action_type": r.get("action_type"),
                "data": r
            })

        lines.extend([
            "",
            "Reply *1*, *2*, or *3* to authorize, or *REJECT* to dismiss."
        ])

        message_text = "\n".join(lines)

        if is_state_dict:
            state["manager_notification_text"] = message_text
            return state

        return {
            "decision_id": d_id,
            "version": v_num,
            "message_text": message_text,
            "interactive_options": options
        }

    def format_replanning_alert(
        self,
        decision_id: str,
        new_version: int,
        reason: str,
        dest_city: str,
        transferable_units: int
    ) -> str:
        """Formats the renewed proposal notification when a plan is paused and re-optimized."""
        return (
            f"⚠️ *RETAILMIND DYNAMIC REPLANNING ALERT*\n"
            f"Decision `{decision_id}` (v1) has been *PAUSED* before dispatch.\n"
            f"────────────────────────\n"
            f"🔍 *Reason*: {reason}\n\n"
            f"🔄 *Revised Strategies (Version {new_version})*:\n"
            f"1. *Split Transfer*: Transfer {transferable_units} units from Coimbatore + 40 from Trichy.\n"
            f"2. *Expedited PO*: Order 80 units directly from Supplier.\n"
            f"3. *Partial Allocation*: Transfer {transferable_units} units and adjust {dest_city} buffer.\n\n"
            f"Reply with *1*, *2*, or *3* to authorize Version {new_version}."
        )

    async def answer_manager_query(
        self,
        query: str,
        context_data: Dict[str, Any]
    ) -> str:
        """Uses Groq LLM strictly for conversational synthesis of store manager text questions."""
        return await groq_llm.answer_manager_query(query=query, context_data=context_data)

# Backward compatibility alias
StoreManagerAgent = DecisionCommunicationAgent
