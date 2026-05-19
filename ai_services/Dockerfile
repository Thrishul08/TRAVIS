FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# libgomp1 is required by scikit-learn, spacy, onnxruntime (OpenMP threading)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN addgroup --system travis && adduser --system --ingroup travis travis

# Copy requirements
COPY requirements.txt .

# Install PyTorch CPU-only FIRST (avoids downloading 1.5GB of CUDA libs)
RUN pip install --no-cache-dir \
    torch==2.1.2 \
    torchvision==0.16.2 \
    torchaudio==2.1.2 \
    --index-url https://download.pytorch.org/whl/cpu

# Write a clean requirements file without torch lines, then install
# (avoids fragile grep | stdin pipe)
RUN grep -v -E "^(torch==|torchvision==|torchaudio==|#|^$)" requirements.txt \
    > /tmp/requirements_no_torch.txt && \
    pip install --no-cache-dir -r /tmp/requirements_no_torch.txt && \
    rm /tmp/requirements_no_torch.txt

# Download spacy model (must be before switching to non-root user)
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Create cache directories with proper permissions before switching to non-root user
RUN mkdir -p /app/.cache/sentence_transformers && \
    mkdir -p /app/.cache/huggingface && \
    chown -R travis:travis /app

USER travis

# Set cache directories to writable locations
ENV HF_HOME=/app/.cache/huggingface
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence_transformers

# knowledge_base is mounted at runtime — do NOT copy it into the image.
# docker run -v "<repo>/knowledge_base:/knowledge_base:ro" travis-ai

EXPOSE 5001

# start-period is 120s — ML models (transformers, chromadb) take time to load
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')" || exit 1

CMD ["python", "main.py"]