"""
Dataset validation before training — checks for leakage risks and data quality issues.
"""
import pandas as pd

from config import BASE_COLUMNS, LOCATION_ORDER, TARGET_COLUMN


def validate_dataset(df: pd.DataFrame) -> dict:
    """Run validation checks and return a summary dict."""
    report = {
        "total_rows": len(df),
        "locations_found": sorted(df["location"].unique().tolist()),
        "missing_locations": [],
        "duplicate_records": 0,
        "missing_lag_values": 0,
        "invalid_rolling_averages": 0,
        "warnings": [],
    }

    missing_locs = set(LOCATION_ORDER) - set(df["location"].unique())
    report["missing_locations"] = sorted(missing_locs)
    if missing_locs:
        report["warnings"].append(f"Expected locations not in dataset: {missing_locs}")

    dupes = df.duplicated(subset=["location", "date"], keep=False)
    report["duplicate_records"] = int(dupes.sum())
    if report["duplicate_records"]:
        report["warnings"].append(f"{report['duplicate_records']} duplicate location+date rows")

    lag_cols = [c for c in df.columns if c.startswith("ndvi_t_minus_")]
    if lag_cols:
        report["missing_lag_values"] = int(df[lag_cols].isna().any(axis=1).sum())

    roll_cols = [c for c in df.columns if "month_avg" in c]
    if roll_cols:
        invalid = df[roll_cols].isna().any(axis=1)
        report["invalid_rolling_averages"] = int(invalid.sum())

    for col in BASE_COLUMNS:
        if col not in df.columns:
            report["warnings"].append(f"Missing base column: {col}")

    if df[TARGET_COLUMN].isna().any():
        report["warnings"].append("Target next_ndvi contains nulls")

    return report


def print_validation_report(report: dict) -> None:
    print("\n" + "=" * 50)
    print("DATASET VALIDATION SUMMARY")
    print("=" * 50)
    print(f"Total rows              : {report['total_rows']}")
    print(f"Locations found         : {', '.join(report['locations_found'])}")
    print(f"Missing locations       : {report['missing_locations'] or 'None'}")
    print(f"Duplicate records       : {report['duplicate_records']}")
    print(f"Rows with missing lags  : {report['missing_lag_values']}")
    print(f"Invalid rolling averages: {report['invalid_rolling_averages']}")
    if report["warnings"]:
        print("\nWarnings:")
        for w in report["warnings"]:
            print(f"  - {w}")
    print("=" * 50)


def print_feature_summary(df: pd.DataFrame, feature_cols: list[str]) -> None:
    print("\nFeature summary statistics (post-engineering):")
    print(df[feature_cols + [TARGET_COLUMN]].describe().round(4).to_string())
