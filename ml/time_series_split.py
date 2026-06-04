"""
Chronological train/test split — no future data in training.
"""
import pandas as pd

from config import TEST_END, TEST_START, TRAIN_END, TRAIN_START


def chronological_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = df.copy()
    df["date"] = df["date"].astype(str)
    train = df[(df["date"] >= TRAIN_START) & (df["date"] <= TRAIN_END)].copy()
    test = df[(df["date"] >= TEST_START) & (df["date"] <= TEST_END)].copy()
    return (
        train.sort_values(["date", "location"]),
        test.sort_values(["date", "location"]),
    )


def split_features_target(df, feature_cols, target_col):
    return df[feature_cols], df[target_col]
