import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="TRAVIS Multi-Service AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load each router independently so one broken import
#    does NOT crash the entire service. ──────────────────

_failed_services = []

def _try_include(label, import_fn):
    try:
        router = import_fn()
        app.include_router(router)
        print(f"[main] OK   — {label}")
    except Exception as e:
        _failed_services.append(label)
        print(f"[main] SKIP — {label}: {e}")


# 1. QA (Seq2Seq transformer)
def _load_qa():
    from bank.qa_routes import qa_router
    return qa_router
_try_include("qa (seq2seq)", _load_qa)

# 2. Translation (torchtext — may fail on Windows due to DLL mismatch)
def _load_translation():
    from translation.translate_routes import translation_router
    return translation_router
_try_include("translation (en→te)", _load_translation)

# 3. TTS
def _load_tts():
    from tts.tts_routes import tts_router
    return tts_router
_try_include("tts", _load_tts)

# 4. Intent classifier
def _load_classifier():
    from category.classifer_routes import router as classifier_router
    return classifier_router
_try_include("classifier", _load_classifier)

# 5. RAG
def _load_rag():
    from rag.rag_routes import rag_router
    return rag_router
_try_include("rag", _load_rag)


# ── Startup: warm up embedding model + ChromaDB so first request
#    has zero cold-start lag. ─────────────────────────────────────

@app.on_event("startup")
async def warmup():
    print("\n[main] Warming up RAG components ...")

    # 1. Load embedding model into memory
    try:
        from rag.embedder import get_model
        get_model()                        # loads SentenceTransformer once
        print("[main] Embedding model warm.")
    except Exception as e:
        print(f"[main] Embedder warmup failed: {e}")

    # 2. Connect to ChromaDB collection
    try:
        from rag.retriever import _get_collection
        col = _get_collection()            # opens PersistentClient once
        print(f"[main] ChromaDB warm — {col.count()} chunks indexed.")
    except Exception as e:
        print(f"[main] ChromaDB warmup failed (run ingest.py first): {e}")

    # 3. Run one dummy embed+retrieve so internal caches are hot
    try:
        from rag.embedder import embed_query
        from rag.retriever import retrieve
        vec = embed_query("hello")
        retrieve(vec, top_k=1)
        print("[main] RAG pipeline warm — first real request will be fast.\n")
    except Exception as e:
        print(f"[main] RAG dry-run failed: {e}\n")


# ── Routes ───────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "TRAVIS Multi-Service AI API v2.0",
        "failed_services": _failed_services,
        "services": {
            "qa":         "/api/predict    - Seq2Seq transformer",
            "classify":   "/api/classify   - Intent classifier",
            "translate":  "/api/translate  - English to Telugu",
            "tts":        "/api/tts        - Text to Speech",
            "rag":        "/api/rag        - RAG knowledge base",
            "rag_health": "/api/rag/health - RAG health check",
        },
    }


@app.get("/health")
async def health():
    return {
        "status": "ok" if not _failed_services else "degraded",
        "failed_services": _failed_services,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=False)