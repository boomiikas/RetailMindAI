"""Forecasting API endpoints for RetailMind AI."""
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.schemas.contracts import DemandForecastResponse, ForecastAccuracyResponse
from backend.ml.inference.predictor import get_demand_predictor

router = APIRouter(prefix="/forecasts", tags=["Forecasting"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
METRICS_PATH = BASE_DIR / "ml" / "saved_models" / "model_metrics.json"

@router.get("", response_model=DemandForecastResponse)
async def get_forecast(
    store_id: str = Query("SLM_01", description="Store ID"),
    product_id: str = Query("MILK_001", description="Product ID"),
    horizon_days: int = Query(7, ge=1, le=30, description="Forecast horizon in days"),
    method: Optional[str] = Query(None, description="'statistical' (SDOWF default) or 'hgb' (HistGradientBoosting)")
):
    """Generates P10, P50, and P90 quantile demand forecasts with feature attribution."""
    try:
        predictor = get_demand_predictor()
        fc = predictor.predict(store_id=store_id, product_id=product_id, horizon_days=horizon_days, method=method)
        return fc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stores/{store_id}")
async def get_store_aggregate_forecast(
    store_id: str,
    horizon_days: int = Query(7, ge=1, le=14)
):
    """Returns top product forecasts for a given retail store."""
    predictor = get_demand_predictor()
    sample_products = ["MILK_001", "RICE_001", "PROD_001", "PKG_001", "HOME_001"]
    results = []
    for pid in sample_products:
        fc = predictor.predict(store_id=store_id, product_id=pid, horizon_days=horizon_days)
        results.append({
            "product_id": pid,
            "total_p50_demand": fc["total_p50_demand"],
            "daily_forecasts": fc["daily_forecasts"]
        })
    return {
        "store_id": store_id,
        "horizon_days": horizon_days,
        "forecasts": results
    }

@router.get("/products/{product_id}")
async def get_product_multi_store_forecast(
    product_id: str,
    horizon_days: int = Query(7, ge=1, le=14)
):
    """Returns demand forecast across all 5 stores for a product."""
    predictor = get_demand_predictor()
    stores = ["CHN_01", "CBE_01", "SLM_01", "MDU_01", "TRY_01"]
    store_forecasts = {}
    for sid in stores:
        fc = predictor.predict(store_id=sid, product_id=product_id, horizon_days=horizon_days)
        store_forecasts[sid] = {
            "total_p50_demand": fc["total_p50_demand"],
            "p50_daily": [d["p50"] for d in fc["daily_forecasts"]]
        }
    return {
        "product_id": product_id,
        "horizon_days": horizon_days,
        "stores_forecast": store_forecasts
    }

@router.get("/accuracy", response_model=ForecastAccuracyResponse)
async def get_forecast_accuracy():
    """Returns verified model validation and testing metrics (MAE, RMSE, WAPE, Bias, R2)."""
    if not METRICS_PATH.exists():
        raise HTTPException(status_code=404, detail="Model metrics file not found. Run model training first.")
    with open(METRICS_PATH, "r") as f:
        data = json.load(f)

    return ForecastAccuracyResponse(
        model_name="HistGradientBoostingRegressor",
        model_version="v1.0-hgb-quantile",
        validation_metrics=data.get("validation", {}),
        test_metrics=data.get("test", {}),
        top_drivers=[
            {"feature": k, "weight": v}
            for k, v in data.get("feature_importance", {}).items()
        ][:5]
    )

@router.get("/compare-models")
async def compare_forecasting_models():
    """Returns empirical comparison across statistical baselines (SMA, WMA, SES, SDOWF) vs HistGradientBoosting."""
    predictor = get_demand_predictor()
    return predictor.evaluate_model_benchmarks()
