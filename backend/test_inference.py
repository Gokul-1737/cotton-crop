import sys
sys.path.insert(0, 'E:/Cotton-Disease-Project')
from services.model_service import get_model_service
from PIL import Image
import pathlib

svc = get_model_service()
ds = pathlib.Path('E:/Cotton-Disease-Project/data/raw/Cotton_Original_Dataset')
test_imgs = list(ds.rglob('*.jpg'))[:3]

for img_path in test_imgs:
    img = Image.open(str(img_path))
    result = svc.predict(img)
    probs = result['class_probabilities']
    total = sum(probs.values())
    cls = result['predicted_class']
    conf = result['confidence']
    parent = img_path.parent.name
    name = img_path.name
    print(f'File: {parent}/{name}')
    print(f'  Predicted: {cls} ({conf*100:.2f}%)')
    print(f'  Prob sum: {total:.6f}')
    print()

print("All predictions OK")

