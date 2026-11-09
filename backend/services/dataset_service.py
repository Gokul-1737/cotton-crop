"""
Dataset statistics and import service.
Reads the original dataset, external datasets, and processed unified dataset.
"""
import os
import zipfile
import shutil
import hashlib
import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any

PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
ORIGINAL_DATASET = DATA_DIR / "raw" / "Cotton_Original_Dataset"
EXTERNAL_DIR = DATA_DIR / "external"
PROCESSED_DIR = DATA_DIR / "processed"
MANIFEST_PATH = PROCESSED_DIR / "dataset_manifest.csv"

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}

KNOWN_CLASSES = [
    "Alternaria Leaf Spot",
    "Bacterial Blight",
    "Fusarium Wilt",
    "Healthy Leaf",
    "Verticillium Wilt",
]

# External datasets catalog
EXTERNAL_DATASETS_MAP = {
    "Dataset_1": DATA_DIR / "A Dataset of Cotton Leaf Images for Disease Detection and Classification",
    "SAR_CLD_2024": EXTERNAL_DIR / "SAR_CLD_2024",
    "Severity_Dataset": DATA_DIR / "Cotton-Original-Augmented",
    "CoSEV": DATA_DIR / "cotton",
}


def count_images_in_dir(directory: Path) -> int:
    """Fast recursive image count using os.walk."""
    if not directory.exists():
        return 0
    cnt = 0
    for root, _, files in os.walk(directory):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in SUPPORTED_EXTENSIONS:
                cnt += 1
    return cnt


_counts_cache = {}

def get_class_counts(dataset_dir: Path) -> Dict[str, int]:
    """Fast count images per class subfolder using os.walk, with caching."""
    cache_key = str(dataset_dir)
    if cache_key in _counts_cache:
        return _counts_cache[cache_key]

    counts = {}
    if not dataset_dir.exists():
        return counts
    try:
        for entry in os.scandir(dataset_dir):
            if entry.is_dir():
                c = 0
                for root, _, files in os.walk(entry.path):
                    for f in files:
                        ext = os.path.splitext(f)[1].lower()
                        if ext in SUPPORTED_EXTENSIONS:
                            c += 1
                if c > 0:
                    counts[entry.name] = c
    except Exception as e:
        print(f"Error scanning {dataset_dir}: {e}")

    _counts_cache[cache_key] = counts
    return counts


def get_original_dataset_stats() -> Dict[str, Any]:
    class_counts = get_class_counts(ORIGINAL_DATASET)
    total = sum(class_counts.values())
    return {
        "name": "Cotton Original Dataset",
        "path": str(ORIGINAL_DATASET),
        "total_images": total,
        "class_distribution": class_counts,
        "num_classes": len(class_counts),
        "status": "ready" if total > 0 else "missing",
        "source": "Primary research dataset",
    }


def get_external_datasets() -> List[Dict[str, Any]]:
    datasets = []
    
    # 1. Configured external datasets
    for ds_name, ds_path in EXTERNAL_DATASETS_MAP.items():
        if ds_path.exists():
            class_counts = get_class_counts(ds_path)
            total = sum(class_counts.values())
            matched = [c for c in class_counts if any(kc.lower() in c.lower() for kc in KNOWN_CLASSES)]
            unmatched = [c for c in class_counts if not any(kc.lower() in c.lower() for kc in KNOWN_CLASSES)]
            datasets.append({
                "name": ds_name,
                "path": str(ds_path),
                "total_images": total,
                "class_distribution": class_counts,
                "num_classes": len(class_counts),
                "matched_classes": matched,
                "unmatched_classes": unmatched,
                "compatibility": "compatible" if not unmatched else "partial",
            })
            
    # 2. Any additional custom imported folders in EXTERNAL_DIR
    if EXTERNAL_DIR.exists():
        for sub in sorted(EXTERNAL_DIR.iterdir()):
            if sub.is_dir() and sub.name not in EXTERNAL_DATASETS_MAP:
                class_counts = get_class_counts(sub)
                total = sum(class_counts.values())
                matched = [c for c in class_counts if any(kc.lower() in c.lower() for kc in KNOWN_CLASSES)]
                unmatched = [c for c in class_counts if not any(kc.lower() in c.lower() for kc in KNOWN_CLASSES)]
                datasets.append({
                    "name": sub.name,
                    "path": str(sub),
                    "total_images": total,
                    "class_distribution": class_counts,
                    "num_classes": len(class_counts),
                    "matched_classes": matched,
                    "unmatched_classes": unmatched,
                    "compatibility": "compatible" if not unmatched else "partial",
                })
                
    return datasets


def get_processed_dataset_stats() -> Dict[str, Any]:
    """Returns unified manifest statistics if generated."""
    if not MANIFEST_PATH.exists():
        return {
            "status": "not_generated",
            "total_images": 0,
            "classes": [],
            "class_distribution": {},
        }
    df = pd.read_csv(MANIFEST_PATH)
    counts = df["label"].value_counts().to_dict()
    return {
        "status": "ready",
        "total_images": len(df),
        "num_classes": len(counts),
        "classes": sorted(counts.keys()),
        "class_distribution": counts,
        "sources": df["source"].value_counts().to_dict() if "source" in df.columns else {},
    }


def inspect_zip(zip_path: Path) -> Dict[str, Any]:
    """Inspect a ZIP file without extracting, return folder/class summary."""
    class_counts: Dict[str, int] = {}
    total_images = 0
    top_dirs = set()

    with zipfile.ZipFile(zip_path, "r") as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            parts = Path(info.filename).parts
            ext = Path(info.filename).suffix.lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue
            total_images += 1
            if len(parts) >= 2:
                parent = parts[-2]
                class_counts[parent] = class_counts.get(parent, 0) + 1
                if len(parts) >= 1:
                    top_dirs.add(parts[0])

    matched = [c for c in class_counts if any(kc.lower() in c.lower() for kc in KNOWN_CLASSES)]
    unmatched = [c for c in class_counts if not any(kc.lower() in c.lower() for kc in KNOWN_CLASSES)]

    return {
        "total_images": total_images,
        "class_distribution": class_counts,
        "num_classes": len(class_counts),
        "top_level_dirs": list(top_dirs),
        "matched_classes": matched,
        "unmatched_classes": unmatched,
        "compatibility": "compatible" if not unmatched else "partial",
    }


def safe_extract_zip(zip_path: Path, target_dir: Path, dataset_name: str) -> Dict[str, Any]:
    dest = EXTERNAL_DIR / dataset_name
    if dest.exists():
        counter = 1
        while (EXTERNAL_DIR / f"{dataset_name}_{counter}").exists():
            counter += 1
        dest = EXTERNAL_DIR / f"{dataset_name}_{counter}"

    dest.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(dest)

    for junk in dest.rglob("__MACOSX"):
        shutil.rmtree(junk, ignore_errors=True)

    class_counts = get_class_counts(dest)
    total = sum(class_counts.values())
    matched = [c for c in class_counts if any(kc.lower() in c.lower() for kc in KNOWN_CLASSES)]
    unmatched = [c for c in class_counts if not any(kc.lower() in c.lower() for kc in KNOWN_CLASSES)]

    return {
        "dataset_name": dest.name,
        "destination": str(dest),
        "total_images": total,
        "class_distribution": class_counts,
        "matched_classes": matched,
        "unmatched_classes": unmatched,
        "compatibility": "compatible" if not unmatched else "partial",
        "status": "imported",
    }
