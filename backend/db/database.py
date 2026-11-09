"""
SQLite database setup using sqlite3 (stdlib).
Stores prediction history records.
"""
import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "predictions.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            predicted_class TEXT NOT NULL,
            confidence REAL NOT NULL,
            probabilities TEXT NOT NULL,
            predicted_at TEXT NOT NULL,
            image_path TEXT
        )
    """)
    conn.commit()
    conn.close()

