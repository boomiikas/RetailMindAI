"""Master API v1 Router for RetailMind AI."""
from fastapi import APIRouter

from backend.app.api.v1.endpoints.dashboard import router as dashboard_router
from backend.app.api.v1.endpoints.inventory import router as inventory_router
from backend.app.api.v1.endpoints.forecasts import router as forecasts_router
from backend.app.api.v1.endpoints.risks import router as risks_router
from backend.app.api.v1.endpoints.ripple import router as ripple_router
from backend.app.api.v1.endpoints.recommendations import router as recommendations_router
from backend.app.api.v1.endpoints.simulations import router as simulations_router
from backend.app.api.v1.endpoints.decisions import router as decisions_router
from backend.app.api.v1.endpoints.replanning import router as replanning_router
from backend.app.api.v1.endpoints.executions import router as executions_router
from backend.app.api.v1.endpoints.performance import router as performance_router
from backend.app.api.v1.endpoints.chat import router as chat_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(dashboard_router)
api_router.include_router(inventory_router)
api_router.include_router(forecasts_router)
api_router.include_router(risks_router)
api_router.include_router(ripple_router)
api_router.include_router(recommendations_router)
api_router.include_router(simulations_router)
api_router.include_router(decisions_router)
api_router.include_router(replanning_router)
api_router.include_router(executions_router)
api_router.include_router(performance_router)
api_router.include_router(chat_router)
