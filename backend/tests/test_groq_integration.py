"""Integration tests for Groq Cloud LLM Service."""
import pytest
from backend.app.config import settings
from backend.app.services.llm.groq_service import groq_llm

@pytest.mark.asyncio
async def test_groq_direct_completion():
    """Verify that Groq Cloud API generates text using the provided Groq API key."""
    assert settings.LLM_PROVIDER == "groq"
    assert settings.GROQ_MODEL == "openai/gpt-oss-120b"
    assert settings.GROQ_API_KEY.startswith("gsk_")

    prompt = "In 10 words or fewer, what is inventory turnover?"
    response = await groq_llm.generate_completion(prompt, max_tokens=100)
    assert response is not None
    assert len(response.strip()) > 0
    print("\n[Groq Response]:", response.encode("ascii", "ignore").decode())

@pytest.mark.asyncio
async def test_groq_decision_explanation():
    """Verify that Groq synthesizes a structured decision explanation from optimization output."""
    explanation = await groq_llm.explain_recommendation(
        problem_detected="Critical stockout risk at Salem Junction for Fresh Milk",
        affected_store="RetailMind Salem Central",
        affected_product="Aavin Toned Fresh Milk 500ml",
        recommended_action="INTER_STORE_TRANSFER",
        quantity=80,
        expected_profit=892.50,
        alternatives=[
            {"action_type": "REPLENISH_SUPPLIER", "expected_net_profit": 3676.0},
            {"action_type": "NO_ACTION", "expected_net_profit": -10668.0}
        ],
        shap_drivers=[
            {"feature": "rolling_mean_7", "shap_weight": 9.7124},
            {"feature": "festival_flag", "shap_weight": 6.5117}
        ]
    )
    assert explanation is not None
    assert len(explanation) > 50
    assert "transfer" in explanation.lower() or "salem" in explanation.lower() or "profit" in explanation.lower()
    print("\n[Groq Explanation]:\n", explanation.encode("ascii", "ignore").decode())
