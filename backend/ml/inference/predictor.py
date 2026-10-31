"""Inference predictor for RetailMind AI demand forecasting.

Generates P10, P50, and P90 quantile demand forecasts for any store-product pair
over arbitrary forecast horizons with SHAP feature attribution.
"""

from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "ml" / "saved_models" / "retailmind_forecast_models.joblib"
DATA_RAW = BASE_DIR / "data" / "raw"

class DemandPredictor:
    def __init__(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Trained model artifact not found at {MODEL_PATH}. Run train_forecasting.py first.")
        self.artifacts = joblib.load(MODEL_PATH)
        self.hgb_p50 = self.artifacts["model_p50"]
        self.hgb_p10 = self.artifacts["model_p10"]
        self.hgb_p90 = self.artifacts["model_p90"]
        self.encoder = self.artifacts["encoder"]
        self.feature_columns = self.artifacts["feature_columns"]
        self.model_version = self.artifacts["model_version"]
        self.feature_importance = self.artifacts["evaluation"].get("feature_importance", {})

        # Load product and sales reference for pricing & recent baseline
        self.products_df = pd.read_csv(DATA_RAW / "products.csv").set_index("product_id")
        self.sales_df = pd.read_csv(DATA_RAW / "sales.csv")
        self.sales_df["sale_date"] = pd.to_datetime(self.sales_df["sale_date"])

    def predict(
        self,
        store_id: str,
        product_id: str,
        start_date: Optional[date] = None,
        horizon_days: int = 7
    ) -> Dict[str, Any]:
        """Generates P10, P50, P90 forecast for a store-product over horizon."""
        if start_date is None:
            # Forecast begins day after last historical sale date
            last_date = self.sales_df["sale_date"].max().date()
            start_date = last_date + timedelta(days=1)

        # Get recent sales for lags
        hist_slice = self.sales_df[
            (self.sales_df["store_id"] == store_id) &
            (self.sales_df["product_id"] == product_id)
        ].sort_values("sale_date")

        recent_sales = hist_slice["units_sold"].tail(30).values
        if len(recent_sales) == 0:
            rolling_7 = 50.0
            rolling_14 = 50.0
            rolling_std = 5.0
            lag_1 = 50.0
            lag_7 = 50.0
            lag_14 = 50.0
        else:
            rolling_7 = float(np.mean(recent_sales[-7:])) if len(recent_sales) >= 7 else float(np.mean(recent_sales))
            rolling_14 = float(np.mean(recent_sales[-14:])) if len(recent_sales) >= 14 else float(np.mean(recent_sales))
            rolling_std = float(np.std(recent_sales[-7:])) if len(recent_sales) >= 7 else 4.0
            lag_1 = float(recent_sales[-1])
            lag_7 = float(recent_sales[-7]) if len(recent_sales) >= 7 else lag_1
            lag_14 = float(recent_sales[-14]) if len(recent_sales) >= 14 else lag_7

        unit_price = float(self.products_df.loc[product_id, "base_price"]) if product_id in self.products_df.index else 100.0

        # Encode store and product
        try:
            enc_input = pd.DataFrame([[store_id, product_id]], columns=["store_id", "product_id"])
            enc_vals = self.encoder.transform(enc_input)
            store_enc, prod_enc = enc_vals[0][0], enc_vals[0][1]
        except Exception:
            store_enc, prod_enc = 0.0, 0.0

        daily_forecasts = []
        curr_d = start_date

        for h in range(horizon_days):
            dow = curr_d.weekday()
            dom = curr_d.day
            month = curr_d.month
            is_weekend = 1 if dow in (5, 6) else 0

            # Festival indicator (Pongal mid-Jan, Tamil New Year mid-Apr, Deepavali late Oct/Nov)
            festival = 0
            if (month == 1 and 13 <= dom <= 17) or (month == 4 and 13 <= dom <= 15) or (month == 10 and dom >= 28) or (month == 11 and dom <= 2):
                festival = 1

            feature_dict = {
                "store_id_enc": store_enc,
                "product_id_enc": prod_enc,
                "day_of_week": dow,
                "day_of_month": dom,
                "month": month,
                "is_weekend": is_weekend,
                "promotional_flag": 0,
                "festival_flag": festival,
                "unit_price": unit_price,
                "sales_lag_1": lag_1,
                "sales_lag_7": lag_7,
                "sales_lag_14": lag_14,
                "rolling_mean_7": rolling_7,
                "rolling_std_7": max(1.0, rolling_std),
                "rolling_mean_14": rolling_14,
            }

            row_df = pd.DataFrame([feature_dict])[self.feature_columns]

            p50_val = max(1.0, float(self.hgb_p50.predict(row_df)[0]))
            p10_val = max(0.5, float(self.hgb_p10.predict(row_df)[0]))
            p90_val = max(p50_val, float(self.hgb_p90.predict(row_df)[0]))

            daily_forecasts.append({
                "forecast_date": curr_d.isoformat(),
                "p10": round(p10_val, 1),
                "p50": round(p50_val, 1),
                "p90": round(p90_val, 1),
                "uncertainty_spread": round(p90_val - p10_val, 1)
            })

            # Roll forward lags for multi-step autoregressive projection
            lag_14 = lag_7
            lag_7 = lag_1
            lag_1 = p50_val
            rolling_7 = (rolling_7 * 6 + p50_val) / 7.0
            curr_d += timedelta(days=1)

        # Top SHAP drivers
        top_drivers = [
            {"feature": k, "shap_weight": v}
            for k, v in sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        return {
            "store_id": store_id,
            "product_id": product_id,
            "horizon_days": horizon_days,
            "forecast_start_date": start_date.isoformat(),
            "model_version": self.model_version,
            "daily_forecasts": daily_forecasts,
            "total_p50_demand": round(sum(d["p50"] for d in daily_forecasts), 1),
            "feature_attribution": top_drivers
        }

_predictor_instance = None

def get_demand_predictor() -> DemandPredictor:
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = DemandPredictor()
    return _predictor_instance
