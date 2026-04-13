"""
embedder.py — Singleton SentenceTransformer wrapper.

The model is loaded ONCE at startup via get_model() which is called
from main.py's @app.on_event("startup"). All subsequent calls reuse
the same in-memory model — zero cold-start lag on real requests.

Must use the SAME model name as ingest.py.
"""

from sentence_transformers import SentenceTransformer
import numpy as np

EMBED_MODEL = "all-MiniLM-L6-v2"
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Return the singleton model, loading it on first call."""
    global _model
    if _model is None:
        print(f"[embedder] Loading '{EMBED_MODEL}' ...")
        _model = SentenceTransformer(EMBED_MODEL)
        # Warm up internal tokenizer cache with a dummy encode
        _model.encode("warmup", convert_to_numpy=True)
        print("[embedder] Model ready.")
    return _model


def embed_query(text: str) -> list:
    """Embed a single query string. Returns a Python list of floats."""
    vec: np.ndarray = get_model().encode(text, convert_to_numpy=True)
    return vec.tolist()