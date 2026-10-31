"""Feature engineering and preprocessing pipeline for RetailMind AI.

Builds temporal features, lag variables, rolling statistics, festival/weather encodings,
and corrects for stockout-censored sales observations.
"""

from typing import Tuple, List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import OrdinalEncoder

CATEGORICAL_COLS = ["store_id", "product_id", "weather_condition"]

def correct_stockout_censoring(df: pd.DataFrame) -> pd.DataFrame:
    """Correct for stockout-censored observations.
    
    When stockout_flag is True, observed sales are strictly less than or equal
    to unconstrained customer demand. We use a rolling mean of non-stockout
    sales for the same (store, product, day_of_week) to estimate true latent demand.
    """
    df = df.copy()
    if "stockout_flag" not in df.columns:
        return df

    # Compute unconstrained baseline per store, product, day_of_week
    df["dow"] = pd.to_datetime(df["sale_date"]).dt.dayofweek
    unconstrained = df[~df["stockout_flag"]]
    baseline_lookup = (
        unconstrained.groupby(["store_id", "product_id", "dow"])["units_sold"]
        .mean()
        .to_dict()
    )

    adjusted_demand = []
    for _, row in df.iterrows():
        sold = row["units_sold"]
        if row["stockout_flag"]:
            key = (row["store_id"], row["product_id"], row["dow"])
            imputed = baseline_lookup.get(key, sold * 1.35)
            # Imputed latent demand should be at least observed sold + 15%
            adjusted_demand.append(max(float(sold), float(imputed)))
        else:
            adjusted_demand.append(float(sold))

    df["demand_target"] = adjusted_demand
    return df

def build_forecasting_features(df_sales: pd.DataFrame) -> pd.DataFrame:
    """Builds lag features, rolling statistics, calendar indicators, and encodings."""
    df = df_sales.copy()
    df["sale_date"] = pd.to_datetime(df["sale_date"])
    df = df.sort_values(by=["store_id", "product_id", "sale_date"]).reset_index(drop=True)

    # Correct for stockout censoring
    df = correct_stockout_censoring(df)

    # Calendar features
    df["day_of_week"] = df["sale_date"].dt.dayofweek
    df["day_of_month"] = df["sale_date"].dt.day
    df["month"] = df["sale_date"].dt.month
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["promotional_flag"] = df["promotional_flag"].astype(int)
    df["festival_flag"] = df["festival_flag"].astype(int)

    # Lag features per (store_id, product_id)
    # Lags: 1 day, 7 days, 14 days
    df["sales_lag_1"] = df.groupby(["store_id", "product_id"])["demand_target"].shift(1)
    df["sales_lag_7"] = df.groupby(["store_id", "product_id"])["demand_target"].shift(7)
    df["sales_lag_14"] = df.groupby(["store_id", "product_id"])["demand_target"].shift(14)

    # Rolling window features (shifted by 1 day to prevent data leakage)
    rolling_7 = (
        df.groupby(["store_id", "product_id"])["demand_target"]
        .apply(lambda x: x.shift(1).rolling(7, min_periods=1).mean())
        .reset_index(level=[0, 1], drop=True)
    )
    rolling_std_7 = (
        df.groupby(["store_id", "product_id"])["demand_target"]
        .apply(lambda x: x.shift(1).rolling(7, min_periods=1).std().fillna(1.0))
        .reset_index(level=[0, 1], drop=True)
    )
    rolling_14 = (
        df.groupby(["store_id", "product_id"])["demand_target"]
        .apply(lambda x: x.shift(1).rolling(14, min_periods=1).mean())
        .reset_index(level=[0, 1], drop=True)
    )

    df["rolling_mean_7"] = rolling_7
    df["rolling_std_7"] = rolling_std_7
    df["rolling_mean_14"] = rolling_14

    # Backfill earliest days lags with rolling mean or target
    df["sales_lag_1"] = df["sales_lag_1"].fillna(df["demand_target"])
    df["sales_lag_7"] = df["sales_lag_7"].fillna(df["sales_lag_1"])
    df["sales_lag_14"] = df["sales_lag_14"].fillna(df["sales_lag_7"])
    df["rolling_mean_7"] = df["rolling_mean_7"].fillna(df["demand_target"])
    df["rolling_std_7"] = df["rolling_std_7"].fillna(1.0)
    df["rolling_mean_14"] = df["rolling_mean_14"].fillna(df["rolling_mean_7"])

    return df

FEATURE_COLUMNS = [
    "store_id_enc",
    "product_id_enc",
    "day_of_week",
    "day_of_month",
    "month",
    "is_weekend",
    "promotional_flag",
    "festival_flag",
    "unit_price",
    "sales_lag_1",
    "sales_lag_7",
    "sales_lag_14",
    "rolling_mean_7",
    "rolling_std_7",
    "rolling_mean_14",
]
