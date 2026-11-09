"""
Model information and evaluation metrics router.
GET /api/model-info
GET /api/evaluation
"""
import csv
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from services.model_service import get_model_service

router = APIRouter(prefix="/api", tags=["model"])

PROJECT_ROOT = Path(__file__).parent.parent.parent
RESULTS_DIR = PROJECT_ROOT / "results"


def _read_training_history():
    csv_path = RESULTS_DIR / "training_history.csv"
    if not csv_path.exists():
        return []
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({k: float(v) if k != "epoch" else int(v) for k, v in row.items()})
    return rows


def _read_test_metrics():
    csv_path = RESULTS_DIR / "test_metrics.csv"
    if not csv_path.exists():
        return {}
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            return {
                "model": row.get("Model", "MORPH-CNN"),
                "test_accuracy": float(row.get("Test_Accuracy", 0)),
                "macro_precision": float(row.get("Macro_Precision", 0)),
                "macro_recall": float(row.get("Macro_Recall", 0)),
                "macro_f1": float(row.get("Macro_F1", 0)),
                "test_images": int(row.get("Test_Images", 0)),
            }
    return {}


def _read_classification_report():
    txt_path = RESULTS_DIR / "classification_report.txt"
    if not txt_path.exists():
        return None
    with open(txt_path, encoding="utf-8") as f:
        return f.read()


def _parse_classification_report(raw: str):
    """Parse the sklearn classification report into structured JSON."""
    if not raw:
        return []
    lines = [l for l in raw.strip().splitlines() if l.strip()]
    classes = []
    for line in lines[1:]:  # skip header
        parts = line.split()
        if not parts:
            continue
        # Last 4 tokens are: precision recall f1-score support
        # Everything before is the class name (may contain spaces)
        try:
            support = int(parts[-1])
            f1 = float(parts[-2])
            recall = float(parts[-3])
            precision = float(parts[-4])
            name_parts = parts[:-4]
            name = " ".join(name_parts)
            if name in ("accuracy", "macro", "weighted"):
                continue
            if name.startswith("macro") or name.startswith("weighted"):
                continue
            classes.append({
                "class": name,
                "precision": precision,
                "recall": recall,
                "f1_score": f1,
                "support": support,
            })
        except (ValueError, IndexError):
            continue
    return classes


@router.get("/model-info")
def get_model_info():
    try:
        svc = get_model_service()
        return svc.get_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluation")
def get_evaluation():
    training_history = _read_training_history()
    test_metrics = _read_test_metrics()
    raw_report = _read_classification_report()
    class_report = _parse_classification_report(raw_report or "")

    # Confusion matrix image path (served as static)
    cm_path = RESULTS_DIR / "confusion_matrix" / "morph_cnn_confusion_matrix.png"
    cm_available = cm_path.exists()

    return {
        "test_metrics": test_metrics,
        "training_history": training_history,
        "classification_report_raw": raw_report,
        "classification_report": class_report,
        "confusion_matrix_available": cm_available,
        "confusion_matrix_url": "/results/confusion_matrix/morph_cnn_confusion_matrix.png" if cm_available else None,
    }

