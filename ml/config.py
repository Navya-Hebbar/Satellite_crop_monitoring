"""
Shared paths and feature definitions for the crop NDVI forecasting model.
"""
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = ML_DIR.parent

# Extended multi-sensor dataset (primary for training)
EXTENDED_DATASET_PATH = PROJECT_ROOT / "forecast_dataset_extended.csv"
DATASET_PATH = PROJECT_ROOT / "forecast_dataset.csv"

ENCODER_PATH = ML_DIR / "location_encoder.pkl"
BEST_MODEL_PATH = ML_DIR / "best_crop_ndvi_model.pkl"
METRICS_PATH = ML_DIR / "model_metrics.json"
FEATURE_IMPORTANCE_PATH = ML_DIR / "feature_importance.png"

TARGET_COLUMN = "next_ndvi"

LOCATION_ORDER = [
    "Bangalore",
    "Mysore",
    "Mandya",
    "Tumkur",
    "Hassan",
    "Kolar",
    "Chikkaballapur",
    "Ramanagara",
    "Shivamogga",
    "Davanagere",
    "Chitradurga",
    "Belagavi",
    "Dharwad",
    "Hubli",
    "Raichur",
    "Koppal",
    "Ballari",
    "Vijayapura",
    "Kalaburagi",
    "Chamarajanagar",
]

# Chronological split — train past, test future (no leakage)
TRAIN_START = "2010-01"
TRAIN_END = "2023-12"
TEST_START = "2024-01"
TEST_END = "2025-12"

BASE_COLUMNS = [
    "location",
    "date",
    "month",
    "ndvi",
    "prev_ndvi",
    "ndvi_change",
    "temperature",
    "rainfall",
    TARGET_COLUMN,
]

FEATURE_COLUMNS = [
    "location_encoded",
    "ndvi",
    "prev_ndvi",
    "ndvi_change",
    "ndvi_t_minus_2",
    "ndvi_t_minus_3",
    "ndvi_t_minus_6",
    "ndvi_t_minus_12",
    "ndvi_3month_avg",
    "ndvi_6month_avg",
    "ndvi_12month_avg",
    "rainfall_3month_avg",
    "rainfall_6month_avg",
    "rainfall_12month_avg",
    "temperature_3month_avg",
    "temperature_6month_avg",
    "temperature_12month_avg",
    "month_sin",
    "month_cos",
]

NDVI_MIN = -1.0
NDVI_MAX = 1.0
RAINFALL_MIN = 0.0
RAINFALL_MAX = 5000.0
TEMPERATURE_MIN = -20.0
TEMPERATURE_MAX = 55.0
MONTH_MIN = 1
MONTH_MAX = 12
