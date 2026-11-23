# Multi-Stage Dockerfile for Institutional Multi-Agent Portfolio System (AD-COP / MASS)

# Stage 1: Build React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=7860

WORKDIR /app

# Install system build dependencies for SciPy, CVXPY, and git
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "fastapi>=0.115.0" "uvicorn[standard]>=0.30.0" "sse-starlette>=2.1.0"

# Copy backend and application code
COPY . .

# Copy compiled frontend from Stage 1 (guarantees frontend is present even on clean git builds)
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose default port (Hugging Face Spaces uses 7860; Render/Railway use dynamic $PORT)
EXPOSE 7860

# Launch Uvicorn with dynamic $PORT fallback
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-7860}"]
