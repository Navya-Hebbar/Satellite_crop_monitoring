"""Load best RandomForest bundle and predict next month NDVI."""
import argparse
import json
import sys

import joblib
import pandas as pd

from config import BEST_MODEL_PATH, ENCODER_PATH, FEATURE_COLUMNS
from feature_engineering import compute_api_derived_features
from rf_trainer import tree_prediction_std
from validation import ValidationError, validate_prediction_input


def load_artifacts():
    if not BEST_MODEL_PATH.exists():
        raise FileNotFoundError(f"Run python train.py first ({BEST_MODEL_PATH})")
    bundle = joblib.load(BEST_MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    if isinstance(bundle, dict):
        return bundle["model"], encoder, bundle
    return bundle, encoder, {"model_name": "RandomForestRegressor", "feature_columns": FEATURE_COLUMNS}


def build_feature_row(clean, encoder, feature_columns):
    derived = compute_api_derived_features(clean)
    row = {"location_encoded": encoder.transform_one(derived["location"])}
    for col in feature_columns:
        if col != "location_encoded":
            row[col] = derived[col]
    return pd.DataFrame([row], columns=feature_columns)


def build_feature_row_from_engineered(last_row, location: str, encoder, feature_columns):
    """Build model input from an engineered DataFrame row (matches training pipeline)."""
    row = {"location_encoded": encoder.transform_one(location)}
    for col in feature_columns:
        if col == "location_encoded":
            continue
        if col not in last_row.index:
            raise ValueError(f"Missing engineered feature '{col}'")
        val = last_row[col]
        if pd.isna(val):
            raise ValueError(
                f"Incomplete feature '{col}' — need a longer history window for lags/rolling stats"
            )
        row[col] = float(val)
    return pd.DataFrame([row], columns=feature_columns)


def predict_next_ndvi(payload: dict) -> dict:
    model, encoder, meta = load_artifacts()
    cols = meta.get("feature_columns", FEATURE_COLUMNS)
    clean = validate_prediction_input(payload, list(encoder.classes_))
    features = build_feature_row(clean, encoder, cols)
    pred = float(model.predict(features)[0])
    std = tree_prediction_std(model, features)
    confidence = round(max(0.0, min(1.0, 1.0 - std * 8)), 4)
    return {
        "predicted_ndvi": round(pred, 4),
        "model_used": meta.get("model_name", "RandomForestRegressor"),
        "confidence_estimate": confidence,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", type=str, default=None)
    args = parser.parse_args()

    default = {
        "location": "Bangalore",
        "ndvi": 0.32,
        "prev_ndvi": 0.28,
        "ndvi_change": 0.04,
        "ndvi_t_minus_2": 0.26,
        "ndvi_t_minus_3": 0.24,
        "ndvi_t_minus_6": 0.22,
        "ndvi_t_minus_12": 0.20,
        "temperature": 27,
        "rainfall": 120,
        "month": 6,
    }
    payload = json.loads(args.json) if args.json else default

    try:
        r = predict_next_ndvi(payload)
        print(f"Predicted Next NDVI: {r['predicted_ndvi']}")
        print(f"Model: {r['model_used']}, Confidence: {r['confidence_estimate']}")
    except (ValidationError, FileNotFoundError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
