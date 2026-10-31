"""Main FastAPI Application Entrypoint for RetailMind AI.

Explainable, Adaptive Multi-Agent Retail Decision Intelligence Platform.
Provides documented REST APIs, WebSocket real-time event streaming, and Groq LLM integration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.core.logging import setup_logging, logger
from backend.app.database.init_db import init_db
from backend.app.api.v1.router import api_router
from backend.app.websocket.connection_manager import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    logger.info("Starting RetailMind AI Backend...")
    logger.info(f"Environment: {settings.APP_ENV} | Debug: {settings.DEBUG}")
    logger.info(f"LLM Provider: {settings.LLM_PROVIDER} ({settings.GROQ_MODEL})")
    
    # Initialize DB tables
    await init_db()
    logger.info("RetailMind AI Backend initialized and ready for requests.")
    yield
    # Shutdown
    logger.info("Shutting down RetailMind AI Backend...")

app = FastAPI(
    title="RetailMind AI API",
    description=(
        "Explainable, Adaptive Multi-Agent Retail Decision Intelligence Platform Backend. "
        "Integrates demand forecasting, inventory health, ripple effect DAGs, Pyomo MILP optimization, "
        "What-If digital twins, WhatsApp manager assistant, and dynamic replanning."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

# Configure CORS for React + Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST Routers
app.include_router(api_router)

# Real-Time WebSocket Endpoint
@app.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(websocket: WebSocket):
    """Real-time event stream for the React dashboard frontend."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; clients can send ping or subscribe messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)

@app.get("/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "HEALTHY",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "model": settings.GROQ_MODEL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
