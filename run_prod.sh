#!/usr/bin/env bash
# Runs the unified production server (serves both API and compiled React frontend on port 8000)

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Building latest frontend production assets..."
cd frontend && npm run build
cd "$DIR"

echo "=================================================="
echo "Starting MASS Unified Production Server on port 8000..."
echo "Open: http://localhost:8000"
echo "=================================================="

./venv/bin/uvicorn backend.app:app --host 0.0.0.0 --port 8000
