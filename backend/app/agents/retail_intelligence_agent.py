"""Retail Intelligence Agent for RetailMind AI.

The central cognitive agent coordinating analytical workflows:
- Natural Language Understanding (NLU) with strict retail domain guardrails
- Analytical Tool Calling through LangGraph (Forecasting, Risk Scanner, Ripple DAG, Optimizer)
- Explains prescriptive recommendations and SHAP feature importance
- Powered by Groq Cloud LLM (openai/gpt-oss-120b)
"""

from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import Store, Product, Inventory, RiskEvent, DecisionRecord
from backend.app.services.llm.groq_service import groq_llm
from backend.ml.inference.predictor import get_demand_predictor
from backend.app.core.logging import logger

RETAIL_KEYWORDS = [
    "stock", "inventory", "milk", "rice", "oil", "product", "sku", "store",
    "chennai", "coimbatore", "salem", "madurai", "trichy", "erode", "tiruppur",
    "forecast", "demand", "sales", "shortage", "stockout", "overstock",
    "transfer", "supplier", "lead time", "delivery", "delay", "order",
    "profit", "revenue", "margin", "cost", "price", "discount", "promotion",
    "decision", "approval", "replanning", "safety stock", "turnover", "kpi",
    "service level", "allocation", "aavin", "weather", "festival", "monsoon"
]

OFF_TOPIC_REPLY = (
    "I am **RetailMind AI Copilot**, specialized strictly in supermarket operations, "
    "supply-chain decision intelligence, inventory health, and multi-store demand forecasting. "
    "Please ask a question related to store operations, stock levels, demand projections, or supply-chain actions."
)

class RetailIntelligenceState(TypedDict):
    query: str
    store_id: str
    is_domain_relevant: bool
    intent: str
    context: Dict[str, Any]
    reply: str

class RetailIntelligenceAgent:
    def __init__(self, session: Optional[AsyncSession] = None):
        self.session = session
        self.predictor = get_demand_predictor()
        self.memory = MemorySaver()
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(RetailIntelligenceState)

        # 1. Guardrail & Intent Detection Node
        async def guardrail_node(state: RetailIntelligenceState) -> RetailIntelligenceState:
            q = state["query"].lower().strip()
            is_relevant = any(kw in q for kw in RETAIL_KEYWORDS) or q in [
                "hi", "hello", "hey", "help", "what can you do", "who are you"
            ]
            state["is_domain_relevant"] = is_relevant
            if not is_relevant:
                state["intent"] = "OFF_TOPIC"
                state["reply"] = OFF_TOPIC_REPLY
            else:
                # Classify intent
                if any(k in q for k in ["low", "stockout", "shortage", "empty", "critical"]):
                    state["intent"] = "INVENTORY_SHORTAGE"
                elif any(k in q for k in ["forecast", "demand", "tomorrow", "next week", "trend"]):
                    state["intent"] = "DEMAND_FORECAST"
                elif any(k in q for k in ["transfer", "surplus", "excess", "redistribut", "network"]):
                    state["intent"] = "SURPLUS_TRANSFER"
                elif any(k in q for k in ["decision", "approval", "pending", "recommend"]):
                    state["intent"] = "PENDING_DECISIONS"
                else:
                    state["intent"] = "GENERAL_RETAIL_QUERY"
            return state

        # 2. Deterministic Context Retrieval Node
        async def tool_context_node(state: RetailIntelligenceState) -> RetailIntelligenceState:
            if not state["is_domain_relevant"]:
                return state

            q = state["query"].lower()
            store_scope = state.get("store_id", "all")
            ctx: Dict[str, Any] = {
                "store_scope": store_scope,
                "region": "Tamil Nadu Supermarket Network"
            }

            if state["intent"] == "INVENTORY_SHORTAGE" and self.session:
                stmt = (
                    select(Inventory, Product, Store)
                    .join(Product, Inventory.product_id == Product.product_id)
                    .join(Store, Inventory.store_id == Store.store_id)
                    .where(Inventory.available_stock < Inventory.safety_stock)
                    .limit(5)
                )
                if store_scope != "all":
                    stmt = stmt.where(Store.store_id == store_scope)
                rows = (await self.session.execute(stmt)).all()
                ctx["critical_shortages"] = [
                    {
                        "product": p.name,
                        "store": s.city,
                        "available": i.available_stock,
                        "safety_buffer": i.safety_stock,
                        "days_supply": float(i.days_of_supply)
                    }
                    for i, p, s in rows
                ]

            elif state["intent"] == "DEMAND_FORECAST":
                target_store = "SLM_01" if store_scope == "all" else store_scope
                target_prod = "MILK_001" if "milk" in q else ("RICE_001" if "rice" in q else "PROD_001")
                fc = self.predictor.predict(target_store, target_prod, horizon_days=3)
                ctx["forecast_snapshot"] = {
                    "product_id": target_prod,
                    "store_id": target_store,
                    "model_method": fc.get("forecast_method", "statistical_sdowf"),
                    "tomorrow_p50": fc["daily_forecasts"][0]["p50"],
                    "tomorrow_p10": fc["daily_forecasts"][0]["p10"],
                    "tomorrow_p90": fc["daily_forecasts"][0]["p90"],
                    "top_driver": fc["feature_attribution"][0]["feature"]
                }

            elif state["intent"] == "SURPLUS_TRANSFER" and self.session:
                stmt = (
                    select(Inventory, Store, Product)
                    .join(Store, Inventory.store_id == Store.store_id)
                    .join(Product, Inventory.product_id == Product.product_id)
                    .where(Inventory.available_stock > (Inventory.safety_stock * 2))
                    .limit(5)
                )
                rows = (await self.session.execute(stmt)).all()
                ctx["transferable_surplus"] = [
                    {
                        "store": s.city,
                        "product": p.name,
                        "available": i.available_stock,
                        "transferable_surplus": max(0, i.available_stock - (i.safety_stock * 2))
                    }
                    for i, s, p in rows
                ]

            elif state["intent"] == "PENDING_DECISIONS" and self.session:
                dec_stmt = select(DecisionRecord).where(DecisionRecord.decision_status == "PENDING").limit(3)
                decs = (await self.session.execute(dec_stmt)).scalars().all()
                ctx["pending_decisions"] = [
                    {
                        "decision_id": d.decision_id,
                        "action": d.original_recommendation_snapshot.get("action_type"),
                        "expected_profit": d.original_recommendation_snapshot.get("expected_net_profit")
                    }
                    for d in decs
                ]
            else:
                ctx["active_hubs"] = ["Chennai", "Coimbatore", "Salem", "Madurai", "Trichy"]

            state["context"] = ctx
            return state

        # 3. LLM Synthesis Node (Only called if domain relevant)
        async def synthesis_node(state: RetailIntelligenceState) -> RetailIntelligenceState:
            if not state["is_domain_relevant"]:
                return state

            system_prompt = (
                "You are the RetailMind AI Decision Intelligence Copilot, an enterprise assistant for multi-store retail operations. "
                "STRICT GUIDELINES:\n"
                "1. ONLY answer questions regarding retail inventory, supply chain, demand forecasts, stockout risks, transfers, markdowns, and store margins.\n"
                "2. Keep responses concise, direct, and actionable (under 75 words unless detailed analysis is requested).\n"
                "3. NEVER fabricate numbers, stock counts, or store names. Rely strictly on the verified context provided.\n"
                "4. Format key metrics with bold text or bullet points for fast scanning by retail managers."
            )

            user_prompt = (
                f"Verified Operational Context:\n{state['context']}\n\n"
                f"Store Manager Question: '{state['query']}'"
            )

            reply = await groq_llm.generate_completion(
                prompt=user_prompt,
                system_prompt=system_prompt,
                max_tokens=220
            )
            state["reply"] = reply
            return state

        workflow.add_node("guardrail", guardrail_node)
        workflow.add_node("retrieve_context", tool_context_node)
        workflow.add_node("synthesis", synthesis_node)

        workflow.set_entry_point("guardrail")

        def route_after_guardrail(state: RetailIntelligenceState) -> str:
            if not state["is_domain_relevant"]:
                return END
            return "retrieve_context"

        workflow.add_conditional_edges("guardrail", route_after_guardrail, {END: END, "retrieve_context": "retrieve_context"})
        workflow.add_edge("retrieve_context", "synthesis")
        workflow.add_edge("synthesis", END)

        return workflow.compile(checkpointer=self.memory)

    async def process_user_query(
        self,
        query: str,
        store_id: str = "all"
    ) -> Dict[str, Any]:
        """Runs the LangGraph analytical intelligence workflow."""
        initial_state: RetailIntelligenceState = {
            "query": query,
            "store_id": store_id,
            "is_domain_relevant": False,
            "intent": "UNKNOWN",
            "context": {},
            "reply": ""
        }
        config = {"configurable": {"thread_id": f"retail_copilot_{store_id}"}}
        result = await self.graph.ainvoke(initial_state, config=config)
        return {
            "reply": result["reply"],
            "intent": result["intent"],
            "is_domain_relevant": result["is_domain_relevant"],
            "context_used": result["context"]
        }

    async def explain_recommendation(
        self,
        problem_detected: str,
        affected_store: str,
        affected_product: str,
        recommended_action: str,
        quantity: int,
        expected_profit: float,
        alternatives: List[Dict[str, Any]],
        shap_drivers: List[Dict[str, Any]]
    ) -> str:
        """Translates optimal decision and feature attribution into concise executive prose."""
        return await groq_llm.explain_recommendation(
            problem_detected=problem_detected,
            affected_store=affected_store,
            affected_product=affected_product,
            recommended_action=recommended_action,
            quantity=quantity,
            expected_profit=expected_profit,
            alternatives=alternatives,
            shap_drivers=shap_drivers
        )
