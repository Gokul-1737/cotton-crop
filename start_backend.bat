@echo off
echo ============================================
echo   MORPH-CNN Cotton Disease — Backend Start
echo ============================================
cd /d %~dp0backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

