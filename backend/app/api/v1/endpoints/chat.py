"""Real-time Retail Copilot Chatbot API for RetailMind AI Dashboard.

Powered by Groq (openai/gpt-oss-120b).
Strict domain guardrails: Only answers retail, inventory, supply-chain, forecasting,
and store operations questions. Politely declines off-topic prompts.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.models import Store, Product, Inventory, RiskEvent, DecisionRecord
from backend.app.services.llm.groq_service import groq_llm
from backend.ml.inference.predictor import get_demand_predictor
from backend.app.core.logging import logger

router = APIRouter(prefix="/chat", tags=["AI Copilot Chatbot"])

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., description="User question for the retail copilot")
    store_id: Optional[str] = Field("all", description="Current store filter context")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Recent conversation turns")

class ChatResponse(BaseModel):
    reply: str
    intent: str
    is_domain_relevant: bool
    context_used: Optional[Dict[str, Any]] = None

RETAIL_KEYWORDS = [
    "stock", "inventory", "milk", "rice", "oil", "product", "sku", "store",
    "chennai", "coimbatore", "salem", "madurai", "trichy", "erode", "tiruppur",
    "forecast", "demand", "sales", "shortage", "stockout", "overstock",
    "transfer", "supplier", "lead time", "delivery", "delay", "order",
    "profit", "revenue", "margin", "cost", "price", "discount", "promotion",
    "decision", "approval", "replanning", "safety stock", "turnover", "kpi",
    "service level", "allocation", "aavin", "weather", "festival", "monsoon"
]

def is_retail_related(query: str) -> bool:
    """Checks whether the query is related to retail, supply chain, or inventory operations."""
    q = query.lower()
    # Check for direct retail keywords
    if any(kw in q for kw in RETAIL_KEYWORDS):
        return True
    # Common conversational greetings that proceed to retail tasks
    if q.strip() in ["hi", "hello", "hey", "help", "what can you do", "who are you"]:
        return True
    return False

OFF_TOPIC_RESPONSE = (
    "I am **RetailMind AI Copilot**, specialized strictly in retail operations, "
    "supply-chain decision intelligence, inventory health, and multi-store demand forecasting. "
    "Please ask a question related to store operations, stock levels, demand projections, or supply-chain actions."
)

@router.post("", response_model=ChatResponse)
async def chat_with_copilot(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """Processes real-time manager questions with Groq and live database context."""
    user_query = payload.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    logger.info(f"[Chatbot] Received query: '{user_query}' (Store context: {payload.store_id})")

    # 1. Guardrail check
    if not is_retail_related(user_query):
        return ChatResponse(
            reply=OFF_TOPIC_RESPONSE,
            intent="OFF_TOPIC_DECLINED",
            is_domain_relevant=False
        )

    # 2. Gather verified DB context based on query intent
    q_lower = user_query.lower()
    context: Dict[str, Any] = {
        "store_scope": payload.store_id,
        "region": "Tamil Nadu Retail Network"
    }

    # Low stock / Stockout context
    if any(k in q_lower for k in ["low", "stockout", "shortage", "empty", "critical"]):
        stmt = (
            select(Inventory, Product, Store)
            .join(Product, Inventory.product_id == Product.product_id)
            .join(Store, Inventory.store_id == Store.store_id)
            .where(Inventory.available_stock < Inventory.safety_stock)
            .limit(5)
        )
        if payload.store_id != "all":
            stmt = stmt.where(Store.store_id == payload.store_id)
        rows = (await db.execute(stmt)).all()
        context["critical_shortages"] = [
            {
                "product": p.name,
                "store": s.city,
                "available": i.available_stock,
                "safety_buffer": i.safety_stock,
                "days_supply": float(i.days_of_supply)
            }
            for i, p, s in rows
        ]

    # Forecast context
    elif any(k in q_lower for k in ["forecast", "demand", "tomorrow", "next week", "trend"]):
        predictor = get_demand_predictor()
        target_store = "SLM_01" if payload.store_id == "all" else payload.store_id
        target_prod = "MILK_001" if "milk" in q_lower else ("RICE_001" if "rice" in q_lower else "PROD_001")
        fc = predictor.predict(target_store, target_prod, horizon_days=3)
        context["forecast_snapshot"] = {
            "product_id": target_prod,
            "store_id": target_store,
            "tomorrow_p50": fc["daily_forecasts"][0]["p50"],
            "tomorrow_p10": fc["daily_forecasts"][0]["p10"],
            "tomorrow_p90": fc["daily_forecasts"][0]["p90"],
            "top_driver": fc["feature_attribution"][0]["feature"]
        }

    # Transfer / Surplus context
    elif any(k in q_lower for k in ["transfer", "surplus", "excess", "redistribut", "network"]):
        stmt = (
            select(Inventory, Store, Product)
            .join(Store, Inventory.store_id == Store.store_id)
            .join(Product, Inventory.product_id == Product.product_id)
            .where(Inventory.available_stock > (Inventory.safety_stock * 2))
            .limit(5)
        )
        rows = (await db.execute(stmt)).all()
        context["transferable_surplus"] = [
            {
                "store": s.city,
                "product": p.name,
                "available": i.available_stock,
                "transferable_surplus": max(0, i.available_stock - (i.safety_stock * 2))
            }
            for i, s, p in rows
        ]

    # Active decisions / approvals
    elif any(k in q_lower for k in ["decision", "approval", "pending", "recommend"]):
        dec_stmt = select(DecisionRecord).where(DecisionRecord.decision_status == "PENDING").limit(3)
        decs = (await db.execute(dec_stmt)).scalars().all()
        context["pending_decisions"] = [
            {
                "decision_id": d.decision_id,
                "action": d.original_recommendation_snapshot.get("action_type"),
                "expected_profit": d.original_recommendation_snapshot.get("expected_net_profit")
            }
            for d in decs
        ]

    # General store stats fallback
    else:
        stores = (await db.execute(select(Store.city))).scalars().all()
        context["active_hubs"] = stores

    # 3. Call Groq Cloud API with strict system guardrails
    system_prompt = (
        "You are the RetailMind AI Decision Intelligence Copilot, an enterprise assistant for multi-store supermarket operations. "
        "STRICT GUIDELINES:\n"
        "1. ONLY answer questions regarding retail inventory, supply-chain logistics, demand forecasts, stockout risks, transfers, markdowns, and store margins.\n"
        "2. Keep responses concise, direct, and actionable (under 75 words unless detailed analysis is explicitly requested).\n"
        "3. NEVER fabricate numbers, stock counts, or store names. Rely strictly on the verified context provided.\n"
        "4. Format key metrics with bold text or bullet points for fast scanning by retail managers.\n"
        "5. If asked general trivia or non-retail topics, refuse politely and refocus on retail operations."
    )

    user_prompt = (
        f"Verified Database Context:\n{context}\n\n"
        f"Store Manager Question: '{user_query}'"
    )

    reply_text = await groq_llm.generate_completion(
        prompt=user_prompt,
        system_prompt=system_prompt,
        max_tokens=220
    )

    return ChatResponse(
        reply=reply_text,
        intent="RETAIL_QUERY_RESOLVED",
        is_domain_relevant=True,
        context_used=context
    )
