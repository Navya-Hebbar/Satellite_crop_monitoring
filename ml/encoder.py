"""
Fixed-order location encoder (Bangalore=0, Mysore=1, Mandya=2, Tumkur=3, Hassan=4).
LabelEncoder sorts alphabetically; this preserves the project-defined order.
"""
from config import LOCATION_ORDER


class LocationEncoder:
    def __init__(self, order: list[str] | None = None):
        self.order = list(order or LOCATION_ORDER)
        self.mapping = {name: idx for idx, name in enumerate(self.order)}

    @property
    def classes_(self) -> list[str]:
        return self.order

    def transform(self, locations: list[str]) -> list[int]:
        result = []
        for loc in locations:
            if loc not in self.mapping:
                raise ValueError(f"Unknown location: {loc}")
            result.append(self.mapping[loc])
        return result

    def transform_one(self, location: str) -> int:
        return self.transform([location])[0]
