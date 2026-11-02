# Institutional MASS Multi-Agent Portfolio Production Dockerfile
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=7860

WORKDIR /app

# Install system build dependencies for SciPy and CVXPY
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "fastapi>=0.115.0" "uvicorn[standard]>=0.30.0" "sse-starlette>=2.1.0"

# Copy application files
COPY . .

# Expose Hugging Face Space default port (7860) or custom port
EXPOSE 7860

# Launch FastAPI app with Uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "7860"]
