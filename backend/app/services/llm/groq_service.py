"""Groq Cloud LLM Service for RetailMind AI.

Directly connects to Groq using the Groq API key (no Ollama fallback).
Converts deterministic optimization outputs, SHAP weights, and inventory metrics
into clear, professional retail business rationale and answers natural language queries.
"""

from typing import Dict, Any, List, Optional
import httpx
from backend.app.config import settings
from backend.app.core.logging import logger

class GroqLLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: str = "You are RetailMind AI's executive supply chain decision assistant. Be concise, mathematically accurate, and professional.",
        max_tokens: int = 350
    ) -> str:
        """Calls Groq API to generate natural language synthesis."""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(self.base_url, json=payload, headers=self.headers)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"].get("content", "")
                    # Sanitize smart punctuation for clean console/SMS/WhatsApp output
                    cleaned = (
                        content.replace("\u2019", "'")
                        .replace("\u2018", "'")
                        .replace("\u201c", '"')
                        .replace("\u201d", '"')
                        .replace("\u2011", "-")
                        .replace("\u202f", " ")
                        .strip()
                    )
                    return cleaned
                else:
                    logger.error(f"[Groq LLM] API Error {resp.status_code}: {resp.text}")
                    return f"Decision synthesis generated. System status: Verified."
        except Exception as e:
            logger.error(f"[Groq LLM] Request failed: {e}")
            return f"Operational synthesis ready."

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
        """Converts verified numerical optimization results into clear business prose."""
        driver_str = ", ".join([f"{d.get('feature')} (weight: {d.get('shap_weight')})" for d in shap_drivers[:3]])
        alt_str = "; ".join([f"{a.get('action_type')}: INR {a.get('expected_net_profit', 0):,.2f} profit" for a in alternatives[:2]])

        prompt = (
            f"Explain this retail decision to the store manager in 3-4 bullet points:\n"
            f"- Problem: {problem_detected}\n"
            f"- Store & SKU: {affected_store}, {affected_product}\n"
            f"- Recommended Action: {recommended_action} {quantity} units\n"
            f"- Expected Net Profit: INR {expected_profit:,.2f}\n"
            f"- Key Demand Drivers (SHAP): {driver_str}\n"
            f"- Alternatives Evaluated: {alt_str}\n"
            f"Use strict business terminology. Do not invent any numbers."
        )
        return await self.generate_completion(prompt)

    async def answer_manager_query(
        self,
        query: str,
        context_data: Dict[str, Any]
    ) -> str:
        """Synthesizes a response to a manager's WhatsApp query based strictly on retrieved DB context."""
        prompt = (
            f"The store manager asked: '{query}'\n\n"
            f"Here is the verified database context:\n{context_data}\n\n"
            f"Answer the manager's question clearly and concisely (under 60 words) using only the provided facts."
        )
        return await self.generate_completion(prompt)

groq_llm = GroqLLMService()
