"""
Train RandomForestRegressor on extended multi-sensor forecast dataset.

Pipeline:
  1. Load forecast_dataset_extended.csv (fallback: forecast_dataset.csv)
  2. Engineer lags (2,3,6,12), rolling (3,6,12), month_sin/cos
  3. Chronological split: train 2010-2023, test 2024-2025
  4. RandomizedSearchCV + TimeSeriesSplit (RandomForest only)
  5. Save best_crop_ndvi_model.pkl, model_metrics.json, feature_importance.png
"""
import json
import sys

import joblib
import pandas as pd

from config import (
    BASE_COLUMNS,
    BEST_MODEL_PATH,
    DATASET_PATH,
    ENCODER_PATH,
    EXTENDED_DATASET_PATH,
    FEATURE_COLUMNS,
    FEATURE_IMPORTANCE_PATH,
    LOCATION_ORDER,
    METRICS_PATH,
    TARGET_COLUMN,
    TEST_END,
    TEST_START,
    TRAIN_END,
    TRAIN_START,
)
from dataset_validation import print_feature_summary, print_validation_report, validate_dataset
from encoder import LocationEncoder
from feature_engineering import drop_incomplete_rows, engineer_features
from rf_trainer import evaluate_predictions, plot_feature_importance, tune_random_forest
from time_series_split import chronological_split, split_features_target


def load_raw_dataset() -> pd.DataFrame:
    path = EXTENDED_DATASET_PATH if EXTENDED_DATASET_PATH.exists() else DATASET_PATH
    if not path.exists():
        raise FileNotFoundError(
            f"No dataset found. Run from backend/: npm run export-forecast-extended"
        )
    df = pd.read_csv(path)
    print(f"Loaded {len(df)} rows from {path.name}")

    missing = [c for c in BASE_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing columns: {missing}")

    if df["temperature"].isna().all() or df["rainfall"].isna().all():
        raise ValueError(
            "temperature/rainfall are empty in the CSV. "
            "Restart backend and re-run: npm run export-forecast-extended "
            "(monthly ERA5 fix — previous export omitted weather data)."
        )
    return df


def prepare_training_frame(df: pd.DataFrame) -> tuple[pd.DataFrame, LocationEncoder, dict]:
    engineered = engineer_features(df)
    validation = validate_dataset(engineered)
    cleaned, dropped = drop_incomplete_rows(engineered)
    if dropped:
        print(f"Dropped {dropped} rows with incomplete features ({len(cleaned)} remaining)")

    encoder = LocationEncoder(LOCATION_ORDER)
    unknown = set(cleaned["location"].unique()) - set(LOCATION_ORDER)
    if unknown:
        raise ValueError(f"Unknown locations: {unknown}")

    cleaned = cleaned.copy()
    cleaned["location_encoded"] = [encoder.transform_one(loc) for loc in cleaned["location"]]

    print("\nLocation encoding (20 districts):")
    for idx, name in enumerate(encoder.classes_):
        print(f"  {name} -> {idx}")

    return cleaned, encoder, validation


def save_artifacts(model, encoder, metrics: dict) -> None:
    bundle = {
        "model": model,
        "model_name": "RandomForestRegressor",
        "feature_columns": FEATURE_COLUMNS,
        "metrics": metrics,
        "train_period": {"start": TRAIN_START, "end": TRAIN_END},
        "test_period": {"start": TEST_START, "end": TEST_END},
    }
    joblib.dump(bundle, BEST_MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    METRICS_PATH.write_text(
        json.dumps(
            {
                "model": "RandomForestRegressor",
                "r2": metrics["r2"],
                "mae": metrics["mae"],
                "rmse": metrics["rmse"],
                "train_period": bundle["train_period"],
                "test_period": bundle["test_period"],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nModel saved : {BEST_MODEL_PATH}")
    print(f"Metrics     : {METRICS_PATH}")


def print_final_report(df, train_df, test_df, metrics) -> None:
    print("\n" + "=" * 60)
    print("RANDOM FOREST TRAINING REPORT")
    print("=" * 60)
    print(f"Total samples (clean) : {len(df)}")
    print(f"Locations           : {df['location'].nunique()}")
    print(f"Training period     : {TRAIN_START} -> {TRAIN_END} ({len(train_df)} rows)")
    print(f"Testing period      : {TEST_START} -> {TEST_END} ({len(test_df)} rows)")
    print(f"Best model          : RandomForestRegressor")
    print(f"R2 Score            : {metrics['r2']:.4f}")
    print(f"MAE                 : {metrics['mae']:.4f}")
    print(f"RMSE                : {metrics['rmse']:.4f}")
    print("=" * 60)


def main() -> None:
    try:
        raw = load_raw_dataset()
        df, encoder, validation = prepare_training_frame(raw)

        print_validation_report(validation)
        print_feature_summary(df, FEATURE_COLUMNS)

        train_df, test_df = chronological_split(df)
        if len(train_df) == 0 or len(test_df) == 0:
            raise ValueError("Empty train or test split — export extended dataset first.")

        X_train, y_train = split_features_target(train_df, FEATURE_COLUMNS, TARGET_COLUMN)
        X_test, y_test = split_features_target(test_df, FEATURE_COLUMNS, TARGET_COLUMN)

        order = train_df.sort_values(["date", "location"]).index
        X_train = X_train.loc[order]
        y_train = y_train.loc[order]

        print("\n--- RandomForestRegressor (RandomizedSearchCV + TimeSeriesSplit) ---")
        model = tune_random_forest(X_train, y_train)
        metrics = evaluate_predictions(y_test, model.predict(X_test))

        print("\n" + "=" * 40)
        print("TEST SET EVALUATION (2024-2025)")
        print("=" * 40)
        print(f"R2 Score : {metrics['r2']:.4f}")
        print(f"MAE      : {metrics['mae']:.4f}")
        print(f"RMSE     : {metrics['rmse']:.4f}")
        print("=" * 40)

        plot_feature_importance(model, FEATURE_COLUMNS, FEATURE_IMPORTANCE_PATH, top_n=20)
        save_artifacts(model, encoder, metrics)
        print_final_report(df, train_df, test_df, metrics)
        print("\nTraining complete.")
    except Exception as exc:
        print(f"Training failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
