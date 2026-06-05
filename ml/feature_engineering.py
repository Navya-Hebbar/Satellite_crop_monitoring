"""
Feature engineering — per-location lags, rolling stats, cyclical seasonality.
"""
import math

import numpy as np
import pandas as pd

from config import FEATURE_COLUMNS, TARGET_COLUMN

LAG_MONTHS = (2, 3, 6, 12)
ROLL_WINDOWS = (3, 6, 12)


def add_seasonal_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["month_sin"] = np.sin(2 * np.pi * out["month"] / 12)
    out["month_cos"] = np.cos(2 * np.pi * out["month"] / 12)
    return out


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy().sort_values(["location", "date"])
    for lag in LAG_MONTHS:
        out[f"ndvi_t_minus_{lag}"] = out.groupby("location", sort=False)["ndvi"].shift(lag)
    return out


def add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy().sort_values(["location", "date"])

    # Forward-fill weather gaps before rolling (ERA5 should be complete after re-export)
    for col in ("rainfall", "temperature"):
        if col in out.columns:
            out[col] = out.groupby("location", sort=False)[col].transform(
                lambda s: s.ffill().bfill()
            )

    specs = [
        ("ndvi", "ndvi"),
        ("rainfall", "rainfall"),
        ("temperature", "temperature"),
    ]
    for col, prefix in specs:
        for w in ROLL_WINDOWS:
            out[f"{prefix}_{w}month_avg"] = (
                out.groupby("location", sort=False)[col]
                .transform(lambda s, window=w: s.rolling(window=window, min_periods=window).mean())
            )
    return out


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["date"] = out["date"].astype(str)
    out = add_lag_features(out)
    out = add_rolling_features(out)
    out = add_seasonal_features(out)
    return out


def drop_incomplete_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    required = [c for c in FEATURE_COLUMNS if c != "location_encoded"] + [
        TARGET_COLUMN,
        "location",
        "date",
    ]
    before = len(df)
    cleaned = df.dropna(subset=required)
    return cleaned, before - len(cleaned)


def compute_api_derived_features(clean: dict) -> dict:
    month = int(clean["month"])
    month_sin = math.sin(2 * math.pi * month / 12)
    month_cos = math.cos(2 * math.pi * month / 12)

    ndvi = clean["ndvi"]
    prev = clean["prev_ndvi"]
    t2 = clean["ndvi_t_minus_2"]
    t3 = clean["ndvi_t_minus_3"]
    t6 = clean["ndvi_t_minus_6"]
    t12 = clean["ndvi_t_minus_12"]

    def avg(*vals):
        return sum(vals) / len(vals)

    return {
        **clean,
        "ndvi_3month_avg": avg(ndvi, prev, t2),
        "ndvi_6month_avg": avg(ndvi, prev, t2, t3, t6),
        "ndvi_12month_avg": clean.get(
            "ndvi_12month_avg",
            avg(ndvi, prev, t2, t3, t6, t12),
        ),
        "rainfall_3month_avg": clean.get("rainfall_3month_avg", clean["rainfall"]),
        "rainfall_6month_avg": clean.get("rainfall_6month_avg", clean["rainfall"]),
        "rainfall_12month_avg": clean.get("rainfall_12month_avg", clean["rainfall"]),
        "temperature_3month_avg": clean.get("temperature_3month_avg", clean["temperature"]),
        "temperature_6month_avg": clean.get("temperature_6month_avg", clean["temperature"]),
        "temperature_12month_avg": clean.get("temperature_12month_avg", clean["temperature"]),
        "month_sin": month_sin,
        "month_cos": month_cos,
    }
