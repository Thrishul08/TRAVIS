"""
retriever.py — Queries ChromaDB for the top-K most relevant chunks
given a pre-computed query embedding vector.
"""

import os
import chromadb

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR = os.path.join(BASE_DIR, "..", "..", "knowledge_base", "chroma_store")
COLLECTION_NAME = "travis_banking_faq"

_client     = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is None:
        if not os.path.exists(CHROMA_DIR):
            raise RuntimeError(
                f"ChromaDB store not found at {CHROMA_DIR!r}. "
                "Run: python rag/ingest.py"
            )
        _client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = _client.get_collection(COLLECTION_NAME)
        print(f"[retriever] Connected to ChromaDB — {_collection.count()} chunks indexed.")
    return _collection


def retrieve(query_vector: list, top_k: int = 3) -> list:
    """
    Returns [{text, source, distance}, ...] sorted by relevance (lowest distance = best).
    """
    collection = _get_collection()
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )
    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        chunks.append({"text": doc, "source": meta.get("source", "unknown"), "distance": round(dist, 4)})
    return chunks