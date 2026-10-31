"""Demand Forecasting Model Training & Quantile Estimation for RetailMind AI.

Trains HistGradientBoosting Regressors for P10, P50 (median), and P90 demand.
Computes evaluation metrics (MAE, RMSE, WAPE, Bias, R2), extracts SHAP explanations,
and serializes model artifacts.
"""

import json
from datetime import date
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OrdinalEncoder

from backend.ml.preprocessing.features import (
    build_forecasting_features, FEATURE_COLUMNS
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PROCESSED = BASE_DIR / "data" / "processed"
MODEL_DIR = BASE_DIR / "ml" / "saved_models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def train_and_evaluate():
    print("=" * 70)
    print(" RetailMind AI: Demand Forecasting Pipeline (Quantile HGB)")
    print("=" * 70)

    # 1. Load Chronological Datasets
    print("Loading chronological datasets...")
    df_train_raw = pd.read_csv(DATA_PROCESSED / "sales_train.csv")
    df_val_raw = pd.read_csv(DATA_PROCESSED / "sales_val.csv")
    df_test_raw = pd.read_csv(DATA_PROCESSED / "sales_test.csv")

    # Combine for seamless lag computation across split boundaries
    df_full = pd.concat([df_train_raw, df_val_raw, df_test_raw], axis=0).reset_index(drop=True)
    df_features = build_forecasting_features(df_full)

    # 2. Encode Categoricals
    print("Fitting categorical encoders...")
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    df_features[["store_id_enc", "product_id_enc"]] = encoder.fit_transform(
        df_features[["store_id", "product_id"]]
    )

    # Split back chronologically
    train_max_date = pd.to_datetime(df_train_raw["sale_date"]).max()
    val_max_date = pd.to_datetime(df_val_raw["sale_date"]).max()

    train_mask = df_features["sale_date"] <= train_max_date
    val_mask = (df_features["sale_date"] > train_max_date) & (df_features["sale_date"] <= val_max_date)
    test_mask = df_features["sale_date"] > val_max_date

    X_train = df_features.loc[train_mask, FEATURE_COLUMNS]
    y_train = df_features.loc[train_mask, "demand_target"]

    X_val = df_features.loc[val_mask, FEATURE_COLUMNS]
    y_val = df_features.loc[val_mask, "demand_target"]

    X_test = df_features.loc[test_mask, FEATURE_COLUMNS]
    y_test = df_features.loc[test_mask, "demand_target"]

    print(f"Features: {FEATURE_COLUMNS}")
    print(f"X_train shape: {X_train.shape}, X_val shape: {X_val.shape}, X_test shape: {X_test.shape}")

    # 3. Train HistGradientBoosting Quantile Regressors (P10, P50, P90)
    print("\nTraining HistGradientBoosting P50 (Median Demand)...")
    hgb_p50 = HistGradientBoostingRegressor(
        loss="quantile",
        quantile=0.50,
        max_iter=120,
        learning_rate=0.08,
        min_samples_leaf=20,
        random_state=42
    )
    hgb_p50.fit(X_train, y_train)

    print("Training HistGradientBoosting P10 (Pessimistic Demand)...")
    hgb_p10 = HistGradientBoostingRegressor(
        loss="quantile",
        quantile=0.10,
        max_iter=120,
        learning_rate=0.08,
        min_samples_leaf=20,
        random_state=42
    )
    hgb_p10.fit(X_train, y_train)

    print("Training HistGradientBoosting P90 (Optimistic / Buffer Demand)...")
    hgb_p90 = HistGradientBoostingRegressor(
        loss="quantile",
        quantile=0.90,
        max_iter=120,
        learning_rate=0.08,
        min_samples_leaf=20,
        random_state=42
    )
    hgb_p90.fit(X_train, y_train)

    # 4. Evaluation Metrics
    def calc_metrics(y_true, y_pred) -> dict:
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        total_y = float(np.sum(y_true))
        wape = float((np.sum(np.abs(y_true - y_pred)) / total_y) * 100) if total_y > 0 else 0.0
        bias = float((np.sum(y_pred - y_true) / total_y) * 100) if total_y > 0 else 0.0
        r2 = float(r2_score(y_true, y_pred))
        return {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "wape": round(wape, 4),
            "forecast_bias": round(bias, 4),
            "r2_score": round(r2, 4)
        }

    val_preds_p50 = hgb_p50.predict(X_val)
    test_preds_p50 = hgb_p50.predict(X_test)

    val_metrics = calc_metrics(y_val, val_preds_p50)
    test_metrics = calc_metrics(y_test, test_preds_p50)

    print("\n--- Validation Performance (Months 10-11) ---")
    print(f" MAE:   {val_metrics['mae']:.2f} units")
    print(f" RMSE:  {val_metrics['rmse']:.2f} units")
    print(f" WAPE:  {val_metrics['wape']:.2f}%")
    print(f" Bias:  {val_metrics['forecast_bias']:+.2f}%")
    print(f" R²:    {val_metrics['r2_score']:.3f}")

    print("\n--- Test Performance (Month 12) ---")
    print(f" MAE:   {test_metrics['mae']:.2f} units")
    print(f" RMSE:  {test_metrics['rmse']:.2f} units")
    print(f" WAPE:  {test_metrics['wape']:.2f}%")
    print(f" Bias:  {test_metrics['forecast_bias']:+.2f}%")
    print(f" R²:    {test_metrics['r2_score']:.3f}")

    # 5. Explainability (Feature Importance / Attribution)
    # HistGradientBoosting doesn't expose feature_importances_ directly in standard form,
    # but we can use permutation importance or SHAP TreeExplainer.
    # We compute sample SHAP weights for fast inference explanations.
    try:
        import shap
        print("\nComputing SHAP feature attributions on sample test slice...")
        sample_X = X_test.sample(min(200, len(X_test)), random_state=42)
        explainer = shap.Explainer(hgb_p50.predict, sample_X)
        shap_values = explainer(sample_X)
        mean_abs_shap = np.abs(shap_values.values).mean(axis=0)
        shap_feature_importance = {
            feat: round(float(weight), 4)
            for feat, weight in zip(FEATURE_COLUMNS, mean_abs_shap)
        }
        shap_sorted = sorted(shap_feature_importance.items(), key=lambda x: x[1], reverse=True)
        print(" Top 5 Demand Drivers (SHAP Weights):")
        for f, w in shap_sorted[:5]:
            print(f"   • {f}: {w:.4f}")
    except Exception as e:
        print(f"[WARN] SHAP sample calculation skipped: {e}")
        shap_feature_importance = {f: 0.1 for f in FEATURE_COLUMNS}

    # 6. Save Artifacts
    artifacts = {
        "model_p50": hgb_p50,
        "model_p10": hgb_p10,
        "model_p90": hgb_p90,
        "encoder": encoder,
        "feature_columns": FEATURE_COLUMNS,
        "model_version": "v1.0-hgb-quantile",
        "evaluation": {
            "validation": val_metrics,
            "test": test_metrics,
            "feature_importance": shap_feature_importance,
        }
    }
    joblib.dump(artifacts, MODEL_DIR / "retailmind_forecast_models.joblib")
    with open(MODEL_DIR / "model_metrics.json", "w") as f:
        json.dump(artifacts["evaluation"], f, indent=2)

    print(f"\n[OK] Models & Metadata successfully saved to {MODEL_DIR / 'retailmind_forecast_models.joblib'}")
    print("=" * 70)
    return artifacts

if __name__ == "__main__":
    train_and_evaluate()
