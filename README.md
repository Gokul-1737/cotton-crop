# Cotton Leaf Disease Identification — MORPH-CNN Web Application

A complete research web application for cotton leaf disease identification using the novel **MORPH-CNN** deep learning model.

---

## Project Structure

```
Cotton-Disease-Project/
├── backend/                  # FastAPI backend
│   ├── main.py               # App entry point
│   ├── routers/              # API route handlers
│   │   ├── predict.py        # POST /api/predict
│   │   ├── model.py          # GET /api/model-info, /api/evaluation
│   │   ├── dataset.py        # GET/POST /api/dataset/*
│   │   └── history.py        # GET/DELETE /api/history/*
│   ├── services/
│   │   ├── model_service.py  # MORPH-CNN inference service
│   │   └── dataset_service.py# Dataset stats & import
│   ├── db/
│   │   └── database.py       # SQLite prediction history
│   └── uploads/              # Uploaded images (auto-created)
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # 6 application pages
│   │   ├── components/       # Reusable UI components
│   │   ├── api.js            # Axios API client
│   │   └── App.jsx           # App router & layout
│   └── vite.config.js        # Vite config with API proxy
├── models/
│   └── morph_cnn.py          # MORPH-CNN architecture (DO NOT MODIFY)
├── checkpoints/
│   └── best_model.pth        # Trained model checkpoint
├── data/
│   ├── raw/Cotton_Original_Dataset/  # Original 1,373 images
│   └── external/             # Imported external datasets (separate)
└── results/
    ├── training_history.csv
    ├── test_metrics.csv
    ├── classification_report.txt
    └── confusion_matrix/morph_cnn_confusion_matrix.png
```

---

## Requirements

- **Python**: 3.10+ (tested with 3.14)
- **Node.js**: 18+ (tested with 24)
- **PyTorch**: 2.0+ (CPU or CUDA)

### Python packages (all already installed in this project):
```
fastapi
uvicorn
python-multipart
aiofiles
torch
torchvision
pillow
scikit-learn
```

---

## Installation

### Step 1 — Install Python dependencies (if not already installed)

```powershell
pip install fastapi uvicorn python-multipart aiofiles
pip install torch torchvision pillow scikit-learn
```

### Step 2 — Install Node.js dependencies

```powershell
cd E:\Cotton-Disease-Project\frontend
npm install
```

---

## Running the Application

### Start the Backend (Terminal 1)

```powershell
cd E:\Cotton-Disease-Project\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will:
- Load the MORPH-CNN model from `checkpoints/best_model.pth`
- Initialize the SQLite database for prediction history
- Serve on `http://127.0.0.1:8000`
- API docs available at `http://127.0.0.1:8000/docs`

### Start the Frontend (Terminal 2)

```powershell
cd E:\Cotton-Disease-Project\frontend
npm run dev
```

Then open: **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/predict` | Upload leaf image, get disease prediction |
| `GET`  | `/api/model-info` | Model name, classes, metadata |
| `GET`  | `/api/evaluation` | Test metrics, training history, classification report |
| `GET`  | `/api/dataset/stats` | Original + external dataset statistics |
| `POST` | `/api/dataset/import` | Import external dataset ZIP |
| `GET`  | `/api/dataset/external` | List imported external datasets |
| `GET`  | `/api/history` | Prediction history records |
| `GET`  | `/api/history/{id}` | Single prediction detail |
| `DELETE` | `/api/history/{id}` | Delete a prediction record |
| `GET`  | `/api/health` | Backend health check |

---

## Application Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview metrics, disease distribution chart, model summary |
| **Disease Prediction** | Upload cotton leaf image → MORPH-CNN inference → results |
| **Dataset Management** | View original dataset stats, import external datasets |
| **Model Performance** | Training curves, classification report, confusion matrix |
| **Prediction History** | Stored predictions with thumbnails and details |
| **About Project** | Project overview, model architecture, disease descriptions |

---

## Model Details

| Property | Value |
|----------|-------|
| Model Name | MORPH-CNN |
| Architecture | 93-layer custom MORPH-CNN (`models/morph_cnn.py`) with adaptive receptive fields |
| Input Size | 224 × 224 × 3 |
| Classes | 5 (see below) |
| Checkpoint | `checkpoints/best_model.pth` |
| Test Accuracy | **84.95%** (206 test images) |
| Macro Precision | **84.89%** |
| Macro Recall | **82.09%** |
| Macro F1-Score | **82.20%** |

### Five Disease Classes
1. **Alternaria Leaf Spot** (173 images)
2. **Bacterial Blight** (218 images)
3. **Fusarium Wilt** (337 images)
4. **Healthy Leaf** (333 images)
5. **Verticillium Wilt** (312 images)

### Image Preprocessing (identical to model evaluation)
```python
transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])
```

---

## Dataset Safety Policy

> **The original dataset (`data/raw/Cotton_Original_Dataset/`) is read-only and will never be overwritten or modified.**

- External datasets are stored in `data/external/<dataset_name>/`
- Each imported dataset is kept in its own separate directory
- Folder names, image counts, and class labels are inspected before any integration
- Unmatched classes outside the 5 target categories are flagged and shown separately
- Merging requires explicit confirmation and compatible class mapping

---

## External Datasets (Organized Separately)

| Dataset | URL | Suggested Directory |
|---------|-----|---------------------|
| Cotton Leaf Disease Classification | https://data.mendeley.com/datasets/6b2wxbs9cv/2 | `data/external/Dataset_1` |
| SAR-CLD-2024 | https://data.mendeley.com/datasets/b3jy2p6k8w/2 | `data/external/SAR_CLD_2024` |
| Severity Levels Dataset | https://data.mendeley.com/datasets/74jsdxtmx2/3 | `data/external/Severity_Dataset` |
| CoSEV Cotton Leaf Dataset | https://data.mendeley.com/datasets/y7544ghy3y/1 | `data/external/CoSEV` |

---

## Quick Start (Windows PowerShell)

```powershell
# Terminal 1 — Backend
cd E:\Cotton-Disease-Project\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Frontend
cd E:\Cotton-Disease-Project\frontend
npm run dev
```

Then open: http://localhost:5173

---

## Troubleshooting

**Backend fails to start:**
- Ensure you're in the `backend/` directory when running uvicorn
- Check that `checkpoints/best_model.pth` exists
- Verify Python path includes project root (uvicorn adds it automatically via main.py)

**Frontend shows "API Offline":**
- Make sure the backend is running on port 8000
- The Vite dev server proxies `/api`, `/results`, `/uploads` to `http://127.0.0.1:8000`

**Prediction returns error:**
- Ensure image is JPG or PNG
- Check backend logs for detailed error messages
- Model runs on CPU by default; predictions take 1-3 seconds

---

*This README reflects the actual implemented system. All metrics are from existing offline experiments.*

