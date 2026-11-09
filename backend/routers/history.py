"""
Prediction history router.
GET /api/history
GET /api/history/{pred_id}
DELETE /api/history/{pred_id}
"""
import json
from fastapi import APIRouter, HTTPException
from db.database import get_connection

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
def get_history(limit: int = 50, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM predictions ORDER BY id DESC LIMIT ? OFFSET ?",
        (limit, offset),
    )
    rows = cur.fetchall()
    total = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
    conn.close()

    records = []
    for row in rows:
        rec = dict(row)
        rec["class_probabilities"] = json.loads(rec.get("probabilities", "{}"))
        records.append(rec)

    return {"total": total, "records": records}


@router.get("/{pred_id}")
def get_prediction(pred_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    rec = dict(row)
    rec["class_probabilities"] = json.loads(rec.get("probabilities", "{}"))
    return rec


@router.delete("/{pred_id}")
def delete_prediction(pred_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM predictions WHERE id = ?", (pred_id,))
    conn.commit()
    affected = cur.rowcount
    conn.close()
    if affected == 0:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    return {"message": f"Prediction {pred_id} deleted."}

