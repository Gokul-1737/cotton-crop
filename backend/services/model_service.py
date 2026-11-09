"""
MORPH-CNN model loading and inference service.
Loads the trained checkpoint once and reuses it for all predictions.
"""
import sys
import os
import json
import torch
import torch.nn.functional as F
from pathlib import Path
from PIL import Image
from torchvision import transforms
from typing import Dict, List, Tuple

# Add project root to sys.path so we can import from models/
PROJECT_ROOT = Path(__file__).parent.parent.parent  # E:\Cotton-Disease-Project
sys.path.insert(0, str(PROJECT_ROOT))

from models.morph_cnn import MORPH_CNN

CHECKPOINT_PATH = PROJECT_ROOT / "checkpoints" / "best_model.pth"

# Preprocessing identical to training evaluation pipeline
# Standard ImageNet normalization, 224x224 input
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


class ModelService:
    """Singleton that holds the loaded MORPH-CNN model."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._load_model()

    def _load_model(self):
        if not CHECKPOINT_PATH.exists():
            raise FileNotFoundError(
                f"Checkpoint not found: {CHECKPOINT_PATH}"
            )

        checkpoint = torch.load(
            str(CHECKPOINT_PATH),
            map_location="cpu",
            weights_only=False
        )

        self.classes: List[str] = checkpoint["classes"]
        self.class_to_idx: Dict[str, int] = checkpoint["class_to_idx"]
        self.epoch_saved: int = checkpoint.get("epoch", -1)
        self.best_val_accuracy: float = checkpoint.get("best_val_accuracy", 0.0)

        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        self.model = MORPH_CNN(num_classes=len(self.classes))
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

    def predict(self, image: Image.Image) -> Dict:
        """
        Run inference on a PIL image.
        Returns predicted class, confidence, and all class probabilities.
        """
        img_rgb = image.convert("RGB")
        tensor = TRANSFORM(img_rgb).unsqueeze(0).to(self.device)

        with torch.inference_mode():
            logits = self.model(tensor)
            probs = F.softmax(logits, dim=1).squeeze(0).cpu().tolist()

        pred_idx = int(torch.argmax(torch.tensor(probs)).item())
        pred_class = self.classes[pred_idx]
        confidence = probs[pred_idx]

        class_probs = {cls: round(probs[i], 6) for i, cls in enumerate(self.classes)}

        return {
            "predicted_class": pred_class,
            "confidence": round(confidence, 6),
            "class_probabilities": class_probs,
        }

    def get_info(self) -> Dict:
        return {
            "model_name": "MORPH-CNN",
            "num_classes": len(self.classes),
            "classes": self.classes,
            "class_to_idx": self.class_to_idx,
            "device": str(self.device),
            "epoch_saved": self.epoch_saved,
            "best_val_accuracy": self.best_val_accuracy,
            "checkpoint_path": str(CHECKPOINT_PATH),
        }


# Module-level singleton
_model_service: ModelService | None = None


def get_model_service() -> ModelService:
    global _model_service
    if _model_service is None:
        _model_service = ModelService()
    return _model_service

