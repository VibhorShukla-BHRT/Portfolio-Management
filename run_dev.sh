#!/usr/bin/env bash
# Runs FastAPI backend on port 8000 and Vite dev server on port 5173

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Starting MASS Backend (FastAPI)..."
./venv/bin/uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting MASS Frontend (Vite)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo "=================================================="
echo "MASS Multi-Agent Financial System Running (Dev)!"
echo " - Frontend: http://localhost:5173"
echo " - Backend API: http://localhost:8000/docs"
echo "=================================================="

wait
