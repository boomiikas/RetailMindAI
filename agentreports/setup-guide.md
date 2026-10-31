# RetailMind AI: Local Development & Setup Guide

This guide provides clear terminal commands to run RetailMind AI locally from scratch.

---

## 1. Prerequisites

- Python 3.10+ (tested on Python 3.13)
- Docker Desktop (optional, for running PostgreSQL 16 & Redis 7 in containers)
- Groq API Key: configured in `.env` (`GROQ_API_KEY=gsk_...`)

---

## 2. Environment Configuration

### 2.1 Activate Virtual Environment & Install Dependencies
```bash
# In the project root (D:\Project\tcs26)
.venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt
```

### 2.2 Configure `.env`
Ensure your `.env` file contains your Groq API key and database connection settings:
```ini
APP_ENV=development
DEBUG=true
PORT=8000
HOST=0.0.0.0

# Database Configuration:
# For local SQLite offline dev: sqlite+aiosqlite:///./retailmind.db
# For PostgreSQL: postgresql+asyncpg://postgres:postgres@localhost:5432/retailmind
DATABASE_URL=sqlite+aiosqlite:///./retailmind.db
SYNC_DATABASE_URL=sqlite:///./retailmind.db

# Groq LLM Configuration (Direct Integration - No Ollama)
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=openai/gpt-oss-120b
LLM_PROVIDER=groq
LLM_TEMPERATURE=0.1

# WhatsApp Integration (Mock mode active for local offline development)
USE_MOCK_WHATSAPP=true
```

---

## 3. (Optional) Start Infrastructure with Docker Compose

If using Docker for PostgreSQL 16 and Redis 7:
```bash
docker-compose -f infrastructure/docker-compose.yml up -d
```
*Note: If running standalone without Docker, RetailMind AI defaults to SQLite (`retailmind.db`) with full async support.*

---

## 4. Synthetic Data Generation & Database Ingestion

Run the synthetic data generation pipeline to generate 109,500 sales records and populate the database:

```bash
# 1. Generate 12 months of sales across 5 Tamil Nadu stores (seed 42)
python -m backend.app.data_generation.generate_retail_data

# 2. Validate data consistency and invariants
python -m backend.app.data_generation.validate_dataset

# 3. Ingest records into the database
python -m backend.app.data_generation.import_to_postgres
```

---

## 5. Train Demand Forecasting Models

Train the HistGradientBoosting Quantile Regressors (P10, P50, P90) and compute SHAP explainability weights:

```bash
python -m backend.ml.training.train_forecasting
```
*Output: Serialized models and evaluation metrics saved to `backend/ml/saved_models/retailmind_forecast_models.joblib`.*

---

## 6. Launch the FastAPI Backend Server

Start the FastAPI application with live hot-reload:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **WebSocket Stream**: `ws://localhost:8000/ws/dashboard`

---

## 7. Run Automated Pytest Suite

Run the full automated test suite covering all 8 operational scenarios and REST APIs:

```bash
pytest backend/tests/ -v
```
*Expected Result: 13 passed in under 10 seconds.*

---

## 8. Simulate End-to-End Operational Scenarios

### 8.1 Simulate Natural-Language WhatsApp Manager Query
```bash
curl -X POST "http://localhost:8000/api/v1/whatsapp/simulate-query" \
     -H "Content-Type: application/json" \
     -d '{"manager_phone": "+919843123456", "query_text": "Which products are running low in my store?"}'
```

### 8.2 Simulate WhatsApp Button Approval
```bash
curl -X POST "http://localhost:8000/api/v1/whatsapp/simulate-approval" \
     -H "Content-Type: application/json" \
     -d '{"manager_phone": "+919843123456", "decision_id": "DEC_SLM_01_MILK_001", "version": 1, "option_chosen": "INTER_STORE_TRANSFER"}'
```

### 8.3 Trigger Dynamic Replanning (Coimbatore Demand Spike)
```bash
curl -X POST "http://localhost:8000/api/v1/replanning/DEC_SLM_01_MILK_001/trigger" \
     -H "Content-Type: application/json" \
     -d '{"disruption_type": "DEMAND_SPIKE", "spike_units": 45, "notes": "Coimbatore local demand surge"}'
```
