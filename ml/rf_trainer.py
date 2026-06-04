"""
RandomForestRegressor training with time-series-safe hyperparameter tuning.
"""
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit


def evaluate_predictions(y_true, y_pred) -> dict[str, float]:
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(mean_squared_error(y_true, y_pred) ** 0.5),
    }


def tune_random_forest(X_train: pd.DataFrame, y_train: pd.Series) -> RandomForestRegressor:
    param_dist = {
        "n_estimators": [200, 300, 400, 500, 600],
        "max_depth": [6, 8, 10, 12, 16, None],
        "min_samples_split": [2, 5, 10, 15, 20],
        "min_samples_leaf": [1, 2, 4, 6, 8],
        "max_features": ["sqrt", "log2", 0.5, 0.7, 0.9],
    }

    base = RandomForestRegressor(random_state=42, n_jobs=-1)
    tscv = TimeSeriesSplit(n_splits=5)

    search = RandomizedSearchCV(
        base,
        param_distributions=param_dist,
        n_iter=40,
        cv=tscv,
        scoring="r2",
        random_state=42,
        n_jobs=-1,
        verbose=0,
    )
    search.fit(X_train, y_train)
    print(f"  Best CV R2: {search.best_score_:.4f}")
    print(f"  Best params: {search.best_params_}")
    return search.best_estimator_


def plot_feature_importance(
    model: RandomForestRegressor,
    feature_names: list[str],
    output_path,
    top_n: int = 20,
) -> None:
    importances = model.feature_importances_
    order = np.argsort(importances)[::-1][:top_n]
    labels = [feature_names[i] for i in order]
    values = importances[order]

    plt.figure(figsize=(11, 7))
    plt.barh(labels[::-1], values[::-1], color="#10b981")
    plt.xlabel("Importance")
    plt.title(f"RandomForest — Top {top_n} Features (Next Month NDVI)")
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    print(f"  Feature importance saved: {output_path}")


def tree_prediction_std(model, X: pd.DataFrame) -> float:
    if hasattr(model, "estimators_"):
        X_arr = X.to_numpy()
        preds = np.array([tree.predict(X_arr)[0] for tree in model.estimators_])
        return float(np.std(preds))
    return 0.05
