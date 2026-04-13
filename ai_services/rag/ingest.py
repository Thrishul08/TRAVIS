"""
ingest.py — Run this ONCE (or on any knowledge base update).

Reads knowledge_base/faqs.txt, splits strictly by Q&A pairs,
cleans each chunk (strips section headers, blank lines),
embeds, and stores in ChromaDB.

Usage (from ai_services/ folder):
    python rag/ingest.py
"""

import os
import re
import chromadb
from sentence_transformers import SentenceTransformer

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
KB_DIR     = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "knowledge_base"))
CHROMA_DIR = os.path.join(KB_DIR, "chroma_store")
COLLECTION = "travis_banking_faq"
MODEL_NAME = "all-MiniLM-L6-v2"


def clean_chunk(block: str) -> str:
    """
    Remove anything that is NOT part of the Q&A:
    - Section headers like  --- CUSTOMER SERVICE ---
    - Title lines like      TRAVIS Banking Knowledge Base
    - Trailing/leading blank lines
    """
    # Remove section headers  --- ANY TEXT ---
    block = re.sub(r"---[^\n]+---", "", block)
    # Remove title/heading lines (all-caps words with no Q: or A:)
    block = re.sub(r"(?m)^[A-Z][A-Z\s]+$\n?", "", block)
    # Collapse multiple blank lines
    block = re.sub(r"\n{2,}", "\n", block)
    return block.strip()


def load_and_chunk(kb_dir: str) -> list[dict]:
    """
    Load every .txt file in kb_dir.
    Split strictly on lines that start with 'Q:' — one chunk per Q&A pair.
    Clean each chunk before storing.
    """
    all_chunks = []

    for fname in sorted(os.listdir(kb_dir)):
        if not fname.endswith(".txt"):
            continue
        fpath = os.path.join(kb_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            text = f.read()

        # Split so every piece starts with Q:
        raw_blocks = re.split(r"(?m)^(?=Q:)", text)
        blocks = [clean_chunk(b) for b in raw_blocks if b.strip().startswith("Q:")]

        # Keep only blocks that have both a question AND an answer
        valid = [b for b in blocks if "Q:" in b and "A:" in b]

        for i, block in enumerate(valid):
            all_chunks.append({
                "id":     f"{fname}_q{i:03d}",
                "source": fname,
                "text":   block,
            })

        skipped = len(blocks) - len(valid)
        print(f"[ingest] {fname}: {len(valid)} chunks"
              + (f" ({skipped} skipped — no A: found)" if skipped else ""))

    return all_chunks


def main():
    print("\n=== TRAVIS RAG Ingest ===\n")

    chunks = load_and_chunk(KB_DIR)
    if not chunks:
        print("[ingest] ERROR: no Q&A blocks found. Check knowledge_base/*.txt")
        return

    print(f"\n[ingest] Total chunks to index: {len(chunks)}")

    # Preview first 3 to confirm no header leakage
    print("\n[ingest] Sample chunks (verify no --- headers):")
    for c in chunks[:3]:
        preview = c["text"][:100].replace("\n", " ")
        print(f"  [{c['id']}] {preview}")

    # Check for accidental header leakage
    leaks = [c for c in chunks if "---" in c["text"]]
    if leaks:
        print(f"\n[ingest] WARNING: {len(leaks)} chunks still contain '---' headers!")
        for c in leaks:
            print(f"  {c['id']}: {c['text'][:80]}")
    else:
        print("[ingest] Clean — no section headers found in any chunk.\n")

    # Embed
    print(f"[ingest] Loading model '{MODEL_NAME}' ...")
    model = SentenceTransformer(MODEL_NAME)
    texts = [c["text"] for c in chunks]
    print("[ingest] Embedding ...")
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32).tolist()

    # Write to ChromaDB (always start fresh)
    os.makedirs(CHROMA_DIR, exist_ok=True)
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    try:
        client.delete_collection(COLLECTION)
        print(f"[ingest] Deleted old collection '{COLLECTION}'")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )
    collection.add(
        ids=[c["id"] for c in chunks],
        embeddings=embeddings,
        documents=texts,
        metadatas=[{"source": c["source"]} for c in chunks],
    )

    print(f"\n[ingest] Done — {len(chunks)} chunks indexed into '{COLLECTION}'.")
    print(f"[ingest] ChromaDB path: {CHROMA_DIR}\n")


if __name__ == "__main__":
    main()