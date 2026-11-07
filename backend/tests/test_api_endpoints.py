"""API integration tests for RetailMind AI REST endpoints."""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "HEALTHY"
        assert data["llm_provider"] == "groq"

@pytest.mark.asyncio
async def test_dashboard_overview_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/dashboard/overview")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_stores"] == 5
        assert data["total_products"] == 88

@pytest.mark.asyncio
async def test_inventory_list_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/inventory?store_id=SLM_01")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        assert data[0]["store_id"] == "SLM_01"

@pytest.mark.asyncio
async def test_forecast_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/forecasts?store_id=SLM_01&product_id=MILK_001&horizon_days=7")
        assert resp.status_code == 200
        data = resp.json()
        assert data["store_id"] == "SLM_01"
        assert len(data["daily_forecasts"]) == 7

@pytest.mark.asyncio
async def test_forecast_compare_models_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/forecasts/compare-models")
        assert resp.status_code == 200
        data = resp.json()
        assert "models_compared" in data
        assert len(data["models_compared"]) == 5

@pytest.mark.asyncio
async def test_copilot_chat_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "message": "Which products are running low in Salem store?",
            "store_id": "SLM_01"
        }
        resp = await ac.post("/api/v1/chat", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_domain_relevant"] is True
        assert len(data["reply"]) > 0

@pytest.mark.asyncio
async def test_simulate_whatsapp_query_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "manager_phone": "+919843123456",
            "query_text": "Which products are running low in my store?"
        }
        resp = await ac.post("/api/v1/whatsapp/simulate-query", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["simulation"] == "SUCCESS"
