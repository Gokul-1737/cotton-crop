"""
Dataset management router.
GET /api/dataset/stats
POST /api/dataset/import
GET /api/dataset/external
"""
import uuid
import aiofiles
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.dataset_service import (
    get_original_dataset_stats,
    get_external_datasets,
    get_processed_dataset_stats,
    inspect_zip,
    safe_extract_zip,
)

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

TMP_DIR = Path(__file__).parent.parent / "tmp_uploads"
TMP_DIR.mkdir(exist_ok=True)


@router.get("/stats")
def dataset_stats():
    original = get_original_dataset_stats()
    external = get_external_datasets()
    processed = get_processed_dataset_stats()
    return {
        "original": original,
        "external_datasets": external,
        "external_count": len(external),
        "processed": processed,
    }


@router.post("/import")
async def import_dataset(file: UploadFile = File(...), dataset_name: str = "imported_dataset"):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are accepted.")

    # Save upload temporarily
    tmp_path = TMP_DIR / f"{uuid.uuid4().hex}.zip"
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(contents)

    try:
        # Inspect before extracting
        inspection = inspect_zip(tmp_path)
        # Then extract safely
        report = safe_extract_zip(tmp_path, None, dataset_name)
    except Exception as e:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")
    finally:
        tmp_path.unlink(missing_ok=True)

    return {
        "inspection": inspection,
        "import_report": report,
        "message": f"Dataset '{dataset_name}' imported successfully into external directory.",
    }


@router.get("/external")
def list_external():
    return {"external_datasets": get_external_datasets()}

