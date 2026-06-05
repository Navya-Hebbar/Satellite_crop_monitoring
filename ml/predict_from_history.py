"""
CLI: read monthly history JSON from stdin, predict next-month NDVI, print JSON to stdout.
Used by Node.js GET /api/dashboard-forecast.
"""
import json
import sys

import pandas as pd

from config import FEATURE_COLUMNS
from feature_engineering import engineer_features
from predict import build_feature_row_from_engineered, load_artifacts


def predict_from_history(location: str, history: list) -> dict:
    if len(history) < 13:
        raise ValueError(
            f"Need at least 13 monthly observations for lag/rolling features; got {len(history)}"
        )

    df = pd.DataFrame(history)
    df["location"] = location
    df = df.sort_values("date").reset_index(drop=True)
    df["prev_ndvi"] = df["ndvi"].shift(1)
    df["ndvi_change"] = df["ndvi"] - df["prev_ndvi"]

    engineered = engineer_features(df)
    last = engineered.iloc[-1]

    model, encoder, meta = load_artifacts()
    cols = meta.get("feature_columns", FEATURE_COLUMNS)
    features = build_feature_row_from_engineered(last, location, encoder, cols)
    predicted = float(model.predict(features)[0])

    return {
        "predicted_ndvi": round(predicted, 4),
        "model_used": meta.get("model_name", "RandomForestRegressor"),
    }


def main():
    try:
        raw = sys.stdin.read()
        body = json.loads(raw) if raw.strip() else {}
        location = body.get("location")
        history = body.get("history", [])
        if not location:
            raise ValueError("location is required")
        result = predict_from_history(location, history)
        print(json.dumps(result))
    except (ValueError, FileNotFoundError) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
