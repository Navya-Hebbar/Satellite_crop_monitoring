"""
Multi-model training, hyperparameter tuning, and comparison.
"""
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit
from xgboost import XGBRegressor


def evaluate_predictions(y_true, y_pred) -> dict[str, float]:
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(mean_squared_error(y_true, y_pred) ** 0.5),
    }


def tune_random_forest(X_train: pd.DataFrame, y_train: pd.Series) -> RandomForestRegressor:
    """
    RandomizedSearchCV with TimeSeriesSplit — respects temporal order in CV folds.
    """
    param_dist = {
        "n_estimators": [100, 200, 300, 400, 500],
        "max_depth": [4, 6, 8, 10, 12, None],
        "min_samples_split": [2, 5, 10, 15],
        "min_samples_leaf": [1, 2, 4, 6],
    }

    base = RandomForestRegressor(random_state=42, n_jobs=-1)
    tscv = TimeSeriesSplit(n_splits=5)

    search = RandomizedSearchCV(
        base,
        param_distributions=param_dist,
        n_iter=30,
        cv=tscv,
        scoring="r2",
        random_state=42,
        n_jobs=-1,
        verbose=0,
    )
    search.fit(X_train, y_train)
    print(f"  RF best CV R²: {search.best_score_:.4f}")
    print(f"  RF best params: {search.best_params_}")
    return search.best_estimator_


def train_extra_trees(X_train: pd.DataFrame, y_train: pd.Series) -> ExtraTreesRegressor:
    model = ExtraTreesRegressor(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    return model


def train_xgboost(X_train: pd.DataFrame, y_train: pd.Series) -> XGBRegressor:
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    model.fit(X_train, y_train)
    return model


def plot_feature_importance(
    model,
    feature_names: list[str],
    model_name: str,
    output_dir: Path,
    top_n: int = 15,
) -> None:
    if not hasattr(model, "feature_importances_"):
        return

    importances = model.feature_importances_
    order = np.argsort(importances)[::-1][:top_n]
    labels = [feature_names[i] for i in order]
    values = importances[order]

    output_dir.mkdir(parents=True, exist_ok=True)
    slug = model_name.lower().replace(" ", "_")
    path = output_dir / f"feature_importance_{slug}.png"

    plt.figure(figsize=(10, 6))
    plt.barh(labels[::-1], values[::-1], color="#10b981")
    plt.xlabel("Importance")
    plt.title(f"Top {top_n} Features — {model_name}")
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"  Importance chart: {path}")


def compare_models(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    feature_names: list[str],
    importance_dir: Path,
) -> tuple[dict, object, str]:
    """
    Train RF (tuned), ExtraTrees, XGBoost; compare on chronological test set.
    Returns comparison dict, best model, best model name.
    """
    results = []

    print("\n--- Training RandomForest (RandomizedSearchCV + TimeSeriesSplit) ---")
    rf = tune_random_forest(X_train, y_train)
    rf_metrics = evaluate_predictions(y_test, rf.predict(X_test))
    results.append({"model": "RandomForest", **rf_metrics, "estimator": rf})
    plot_feature_importance(rf, feature_names, "RandomForest", importance_dir)

    print("\n--- Training ExtraTreesRegressor ---")
    et = train_extra_trees(X_train, y_train)
    et_metrics = evaluate_predictions(y_test, et.predict(X_test))
    results.append({"model": "ExtraTrees", **et_metrics, "estimator": et})
    plot_feature_importance(et, feature_names, "ExtraTrees", importance_dir)

    print("\n--- Training XGBoost ---")
    xgb = train_xgboost(X_train, y_train)
    xgb_metrics = evaluate_predictions(y_test, xgb.predict(X_test))
    results.append({"model": "XGBoost", **xgb_metrics, "estimator": xgb})
    plot_feature_importance(xgb, feature_names, "XGBoost", importance_dir)

    comparison = pd.DataFrame(
        [{k: v for k, v in r.items() if k != "estimator"} for r in results]
    )

    print("\n" + "=" * 60)
    print("MODEL COMPARISON (chronological test: 2023)")
    print("=" * 60)
    print(comparison.to_string(index=False, float_format=lambda x: f"{x:.4f}"))
    print("=" * 60)

    best_row = max(results, key=lambda r: r["r2"])
    return comparison, best_row["estimator"], best_row["model"]


def tree_prediction_std(model, X: pd.DataFrame) -> float:
    """Std dev across trees — lower std implies higher confidence."""
    if hasattr(model, "estimators_"):
        X_arr = X.to_numpy()
        preds = np.array([tree.predict(X_arr)[0] for tree in model.estimators_])
        return float(np.std(preds))
    return 0.05
