"""
Input validation for extended NDVI forecast predictions.
"""
from typing import Any

from config import (
    MONTH_MAX,
    MONTH_MIN,
    NDVI_MAX,
    NDVI_MIN,
    RAINFALL_MAX,
    RAINFALL_MIN,
    TEMPERATURE_MAX,
    TEMPERATURE_MIN,
)


class ValidationError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def _require(data: dict, field: str):
    if field not in data or data[field] is None:
        raise ValidationError(f"Missing required field: '{field}'")
    return data[field]


def _float(v, field: str) -> float:
    try:
        return float(v)
    except (TypeError, ValueError) as e:
        raise ValidationError(f"'{field}' must be a number") from e


def _int(v, field: str) -> int:
    try:
        return int(v)
    except (TypeError, ValueError) as e:
        raise ValidationError(f"'{field}' must be an integer") from e


def validate_prediction_input(data: dict[str, Any], known_locations: list[str]) -> dict[str, Any]:
    location = _require(data, "location")
    if not isinstance(location, str) or not location.strip():
        raise ValidationError("'location' must be a non-empty string")
    location = location.strip()
    if location not in known_locations:
        raise ValidationError(f"Invalid location '{location}'")

    fields = {
        "ndvi": _float(_require(data, "ndvi"), "ndvi"),
        "prev_ndvi": _float(_require(data, "prev_ndvi"), "prev_ndvi"),
        "ndvi_change": _float(_require(data, "ndvi_change"), "ndvi_change"),
        "ndvi_t_minus_2": _float(_require(data, "ndvi_t_minus_2"), "ndvi_t_minus_2"),
        "ndvi_t_minus_3": _float(_require(data, "ndvi_t_minus_3"), "ndvi_t_minus_3"),
        "ndvi_t_minus_6": _float(_require(data, "ndvi_t_minus_6"), "ndvi_t_minus_6"),
        "ndvi_t_minus_12": _float(_require(data, "ndvi_t_minus_12"), "ndvi_t_minus_12"),
        "temperature": _float(_require(data, "temperature"), "temperature"),
        "rainfall": _float(_require(data, "rainfall"), "rainfall"),
        "month": _int(_require(data, "month"), "month"),
    }

    for name in (
        "ndvi",
        "prev_ndvi",
        "ndvi_t_minus_2",
        "ndvi_t_minus_3",
        "ndvi_t_minus_6",
        "ndvi_t_minus_12",
    ):
        v = fields[name]
        if not NDVI_MIN <= v <= NDVI_MAX:
            raise ValidationError(f"'{name}' must be between {NDVI_MIN} and {NDVI_MAX}")

    if not RAINFALL_MIN <= fields["rainfall"] <= RAINFALL_MAX:
        raise ValidationError(f"'rainfall' out of range")
    if not TEMPERATURE_MIN <= fields["temperature"] <= TEMPERATURE_MAX:
        raise ValidationError(f"'temperature' out of range")
    if not MONTH_MIN <= fields["month"] <= MONTH_MAX:
        raise ValidationError(f"'month' must be 1-12")

    clean = {"location": location, **fields}
    for opt in (
        "rainfall_3month_avg",
        "rainfall_6month_avg",
        "rainfall_12month_avg",
        "temperature_3month_avg",
        "temperature_6month_avg",
        "temperature_12month_avg",
        "ndvi_12month_avg",
    ):
        if opt in data and data[opt] is not None:
            clean[opt] = _float(data[opt], opt)
    return clean
