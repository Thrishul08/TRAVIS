"""
rag_routes.py — FastAPI router exposing the RAG pipeline.

  POST /api/rag
  Body:    { "query": "what is imps" }
  Returns: { "response": "...", "sources": [...], "chunks_used": N }

No LLM API call — answer extracted directly from retrieved chunks.
Typical latency: <150ms (embedding model + ChromaDB lookup + extraction).
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from rag.embedder import embed_query
from rag.retriever import retrieve
from rag.generator import generate

rag_router = APIRouter(prefix="/api", tags=["RAG"])

# Cosine distance: 0.0 = identical, 1.0 = completely different.
# Keep chunks below this threshold — above it means too irrelevant.
RELEVANCE_THRESHOLD = 0.55


class RAGRequest(BaseModel):
    query: str


@rag_router.post("/rag")
async def rag_query(request: RAGRequest):
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        # 1. Embed the query into a vector
        query_vector = embed_query(query)

        # 2. Retrieve top-3 candidate chunks
        raw_chunks = retrieve(query_vector, top_k=3)

        # 3. Filter by relevance — strict threshold avoids pulling
        #    unrelated chunks when the query is misclassified
        relevant_chunks = [c for c in raw_chunks if c["distance"] <= RELEVANCE_THRESHOLD]

        # Fallback: if NOTHING passes, return a graceful "not found" message
        # rather than the closest unrelated chunk
        if not relevant_chunks:
            return JSONResponse(
                content={
                    "response": (
                        "I could not find specific information about that in the knowledge base. "
                        "Please contact customer support or visit the nearest branch for help."
                    ),
                    "sources":     [],
                    "chunks_used": 0,
                },
                status_code=200,
            )

        # 4. Extract precise answer (no LLM — zero API latency)
        answer = generate(query, relevant_chunks)

        return JSONResponse(
            content={
                "response":    answer,
                "sources":     list({c["source"] for c in relevant_chunks}),
                "chunks_used": len(relevant_chunks),
            },
            status_code=200,
        )

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"RAG pipeline error: {e}")


@rag_router.get("/rag/health")
async def rag_health():
    try:
        from rag.retriever import _get_collection
        col = _get_collection()
        return {"status": "ok", "indexed_chunks": col.count()}
    except Exception as e:
        return {"status": "error", "detail": str(e)}