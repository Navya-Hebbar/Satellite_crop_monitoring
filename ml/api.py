"""FastAPI — RandomForest next-month NDVI prediction (extended features)."""
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from predict import load_artifacts, predict_next_ndvi
from validation import ValidationError


class PredictRequest(BaseModel):
    location: str
    ndvi: float = Field(..., ge=-1, le=1)
    prev_ndvi: float = Field(..., ge=-1, le=1)
    ndvi_change: float
    ndvi_t_minus_2: float = Field(..., ge=-1, le=1)
    ndvi_t_minus_3: float = Field(..., ge=-1, le=1)
    ndvi_t_minus_6: float = Field(..., ge=-1, le=1)
    ndvi_t_minus_12: float = Field(..., ge=-1, le=1)
    temperature: float
    rainfall: float = Field(..., ge=0)
    month: int = Field(..., ge=1, le=12)
    rainfall_3month_avg: Optional[float] = None
    rainfall_6month_avg: Optional[float] = None
    rainfall_12month_avg: Optional[float] = None
    temperature_3month_avg: Optional[float] = None
    temperature_6month_avg: Optional[float] = None
    temperature_12month_avg: Optional[float] = None


class PredictResponse(BaseModel):
    predicted_ndvi: float
    model_used: str
    confidence_estimate: float


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        load_artifacts()
    except FileNotFoundError as exc:
        print(f"WARNING: {exc}")
    yield


app = FastAPI(title="Crop NDVI Forecast API", version="3.0.0", lifespan=lifespan)


@app.get("/health")
def health():
    try:
        _, _, meta = load_artifacts()
        return {"status": "ok", "model_loaded": True, "metrics": meta.get("metrics")}
    except FileNotFoundError:
        return {"status": "ok", "model_loaded": False}


@app.post("/predict", response_model=PredictResponse)
def predict(body: PredictRequest):
    try:
        return PredictResponse(**predict_next_ndvi(body.model_dump(exclude_none=True)))
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.message) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
