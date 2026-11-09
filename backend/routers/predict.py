"""
Prediction router — POST /api/predict
"""
import io
import json
import uuid
import aiofiles
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image

from services.model_service import get_model_service
from db.database import get_connection

router = APIRouter(prefix="/api", tags=["predict"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


@router.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    # Validate content type / extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Use JPG, JPEG, or PNG."
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Decode image
    try:
        image = Image.open(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot open image: {e}")

    # Save uploaded file
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name
    async with aiofiles.open(save_path, "wb") as f:
        await f.write(contents)

    # Run inference
    try:
        svc = get_model_service()
        result = svc.predict(image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    predicted_at = datetime.now().isoformat()

    # Persist to history
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO predictions
            (filename, predicted_class, confidence, probabilities, predicted_at, image_path)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            file.filename,
            result["predicted_class"],
            result["confidence"],
            json.dumps(result["class_probabilities"]),
            predicted_at,
            str(save_path),
        ),
    )
    conn.commit()
    pred_id = cur.lastrowid
    conn.close()

    return {
        "id": pred_id,
        "filename": file.filename,
        "predicted_class": result["predicted_class"],
        "confidence": result["confidence"],
        "confidence_pct": round(result["confidence"] * 100, 2),
        "class_probabilities": result["class_probabilities"],
        "predicted_at": predicted_at,
    }

