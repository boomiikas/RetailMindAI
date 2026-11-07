"""Real-time Retail Copilot Chatbot API for RetailMind AI Dashboard.

Powered by RetailIntelligenceAgent (LangGraph + Groq Cloud LLM).
Strict domain guardrails: Only answers retail, inventory, supply-chain, forecasting,
and store operations questions. Politely declines off-topic prompts.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.agents.retail_intelligence_agent import RetailIntelligenceAgent
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

@router.post("", response_model=ChatResponse)
async def chat_with_copilot(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """Processes real-time manager questions through RetailIntelligenceAgent."""
    user_query = payload.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    logger.info(f"[Chatbot] Received query: '{user_query}' (Store context: {payload.store_id})")

    agent = RetailIntelligenceAgent(session=db)
    result = await agent.process_user_query(query=user_query, store_id=payload.store_id or "all")

    return ChatResponse(
        reply=result["reply"],
        intent=result["intent"],
        is_domain_relevant=result["is_domain_relevant"],
        context_used=result.get("context_used")
    )
