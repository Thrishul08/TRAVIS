"""
generator.py — Zero-latency answer extractor.

No LLM API calls. Runs entirely from the retrieved chunk text.
Typical time: <5ms per call.

Design principle:
  ChromaDB already retrieved the most semantically relevant Q&A chunk.
  The ENTIRE A: section is the answer — we return all of it.

  The ONLY exception is colon-section lists (e.g. old merged chunks
  containing "NEFT: ... RTGS: ... IMPS: ...") where we extract just the
  section matching the query keyword.
"""

import re

# ── Abbreviation expansion (used only for colon-section matching) ─────────────

ABBREVIATIONS = {
    "imps": {"imps", "immediate", "payment"},
    "neft": {"neft", "national", "electronic", "funds", "transfer"},
    "rtgs": {"rtgs", "real", "time", "gross", "settlement"},
    "kyc":  {"kyc", "know", "customer", "verification"},
    "emi":  {"emi", "equated", "monthly", "installment"},
    "upi":  {"upi", "unified", "payments", "interface"},
    "fd":   {"fd", "fixed", "deposit"},
    "otp":  {"otp"},
    "pin":  {"pin"},
    "atm":  {"atm"},
    "pan":  {"pan"},
    "nri":  {"nri", "non", "resident"},
}

STOPWORDS = {
    "what", "is", "are", "the", "a", "an", "how", "do", "i", "can", "my",
    "to", "of", "for", "in", "and", "or", "tell", "me", "about", "does",
    "when", "where", "who", "which", "give", "explain", "difference",
    "between", "details", "information", "it", "why", "required", "need",
    "please", "want", "know", "get", "use", "used", "make", "using", "with",
    "from", "this", "that", "these", "those", "will", "would", "should",
    "could", "has", "have", "had", "its", "your", "our", "their", "on",
    "at", "by", "be", "was", "were", "not", "also", "if", "then", "so",
}


def _query_keywords(query: str) -> set:
    words = re.findall(r"[a-z]+", query.lower())
    base = {w for w in words if w not in STOPWORDS and len(w) > 1}
    expanded = set(base)
    for w in base:
        if w in ABBREVIATIONS:
            expanded |= ABBREVIATIONS[w]
    return expanded


def _extract_answer_text(chunk_text: str) -> str:
    """Pull the A: section. Returns full chunk text if no A: marker found."""
    m = re.search(r"A:\s*(.+)", chunk_text, re.DOTALL)
    return m.group(1).strip() if m else chunk_text.strip()


def _extract_named_section(answer_text: str, keywords: set):
    """
    For colon-section lists like:  NEFT: ... RTGS: ... IMPS: ...
    Extracts only the section whose header matches a query keyword.
    Returns None if the text is not this format (fewer than 2 sections).
    """
    parts = re.split(r"\b([A-Z]{2,8}):\s*", answer_text)
    # parts = [prefix, HEADER1, body1, HEADER2, body2, ...]
    if len(parts) < 5:
        return None

    sections = {}
    i = 1
    while i + 1 < len(parts):
        header = parts[i].strip()
        body   = parts[i + 1].strip()
        sections[header.lower()] = f"{header}: {body}"
        i += 2

    if len(sections) < 2:
        return None

    for kw in keywords:
        if kw in sections:
            return sections[kw]
        for key, val in sections.items():
            if kw in key or key in kw:
                return val
    return None


def generate(query: str, chunks: list) -> str:
    """
    Return the full answer text from the best retrieved chunk.

    The retrieved chunk is already semantically matched to the query
    by ChromaDB — the entire A: block is relevant and should be returned.

    The only trimming done is for colon-section lists, where multiple
    services are packed into one chunk (legacy merged chunks) and only
    the queried service's section is returned.
    """
    if not chunks:
        return (
            "I could not find relevant information for your query. "
            "Please contact customer support for assistance."
        )

    best_chunk = chunks[0]["text"]
    keywords   = _query_keywords(query)

    # Extract the A: portion
    answer_text = _extract_answer_text(best_chunk)

    # Only special-case: colon-section list → extract exact section
    section = _extract_named_section(answer_text, keywords)
    if section:
        return section

    # For all standard Q&A chunks: return the full answer
    return answer_text


# """
# generator.py — Zero-latency answer extractor.

# No LLM API calls. Runs entirely from the retrieved chunk text.
# Typical time: <5ms per call.

# Strategy:
# 1. Pull the A: section from a Q&A block.
# 2. If the answer is a colon-section list (NEFT: ... RTGS: ...) extract
#    only the section matching the query keyword.
# 3. Detect answers that are enumerations or where the first sentence
#    captures all keywords but the rest are continuations — return full text.
# 4. Otherwise score sentences by keyword overlap and return the top ones.
# """

# import re

# # ── Abbreviation expansion ────────────────────────────────────────────────────

# ABBREVIATIONS = {
#     "imps": {"imps", "immediate", "payment", "service"},
#     "neft": {"neft", "national", "electronic", "funds", "transfer"},
#     "rtgs": {"rtgs", "real", "time", "gross", "settlement"},
#     "kyc":  {"kyc", "know", "customer", "verification"},
#     "emi":  {"emi", "equated", "monthly", "installment"},
#     "upi":  {"upi", "unified", "payments", "interface"},
#     "fd":   {"fd", "fixed", "deposit"},
#     "otp":  {"otp", "one", "time", "password"},
#     "pin":  {"pin"},
#     "atm":  {"atm"},
#     "pan":  {"pan"},
#     "nri":  {"nri", "non", "resident", "indian"},
# }

# STOPWORDS = {
#     "what", "is", "are", "the", "a", "an", "how", "do", "i", "can", "my",
#     "to", "of", "for", "in", "and", "or", "tell", "me", "about", "does",
#     "when", "where", "who", "which", "give", "explain", "difference",
#     "between", "details", "information", "it", "why", "required", "need",
#     "please", "want", "know", "get", "use", "used", "make", "using", "with",
#     "from", "this", "that", "these", "those", "will", "would", "should",
#     "could", "has", "have", "had", "its", "your", "our", "their", "on",
#     "at", "by", "be", "was", "were", "not", "also", "if", "then", "so",
# }


# def _query_keywords(query: str) -> set:
#     words = re.findall(r"[a-z]+", query.lower())
#     base = {w for w in words if w not in STOPWORDS and len(w) > 1}
#     expanded = set(base)
#     for w in base:
#         if w in ABBREVIATIONS:
#             expanded |= ABBREVIATIONS[w]
#     return expanded


# # ── Named-section extractor (NEFT: ... RTGS: ... IMPS: ...) ─────────────────

# def _extract_named_section(text: str, keywords: set):
#     """
#     Splits on ALL-CAPS tokens followed by a colon.
#     Returns only the section whose header matches a query keyword.
#     Returns None if the text is not this format (< 2 sections found).
#     """
#     parts = re.split(r"\b([A-Z]{2,8}):\s*", text)
#     if len(parts) < 5:
#         return None
#     sections = {}
#     i = 1
#     while i + 1 < len(parts):
#         h = parts[i].strip()
#         b = parts[i + 1].strip()
#         sections[h.lower()] = f"{h}: {b}"
#         i += 2
#     if len(sections) < 2:
#         return None
#     for kw in keywords:
#         if kw in sections:
#             return sections[kw]
#         for key, val in sections.items():
#             if kw in key or key in kw:
#                 return val
#     return None


# # ── Answer-text extractor ─────────────────────────────────────────────────────

# def _extract_answer_text(chunk_text: str) -> str:
#     m = re.search(r"A:\s*(.+)", chunk_text, re.DOTALL)
#     return m.group(1).strip() if m else chunk_text.strip()


# # ── Sentence scoring ──────────────────────────────────────────────────────────

# def _score(sentence: str, keywords: set) -> int:
#     words = set(re.findall(r"[a-z]+", sentence.lower()))
#     return len(keywords & words)


# # ── Answer-type detection ─────────────────────────────────────────────────────

# def _is_enumeration(sentences: list) -> bool:
#     """
#     True when the answer is a list/enumeration where each sentence
#     is a distinct data point — e.g. 'For X days the rate is Y percent.'
#     Returning only the first sentence would clip all the data.
#     """
#     if len(sentences) < 3:
#         return False
#     # Multiple sentences starting with "For" → tenure/range list
#     for_count = sum(1 for s in sentences if re.match(r"^For\b", s.strip()))
#     if for_count >= 2:
#         return True
#     # Multiple sentences starting with numbers or a range pattern
#     range_count = sum(1 for s in sentences if re.match(r"^\d", s.strip()))
#     if range_count >= 2:
#         return True
#     return False


# def _first_sentence_dominates(sentences: list, keywords: set) -> bool:
#     """
#     True when only the first sentence scores on keywords and all
#     subsequent sentences score 0 — meaning the rest are elaboration
#     or data rows that must be kept (not clipped).

#     Example: 'Fixed deposit rates vary by tenure. [score=4]
#               For 7 to 45 days the rate is 3.5%. [score=0]
#               For 46 to 180 days it is 4.5%.     [score=0]'
#     """
#     if len(sentences) < 3:
#         return False
#     scores = [_score(s, keywords) for s in sentences]
#     return scores[0] >= 2 and all(sc == 0 for sc in scores[1:])


# # ── Public API ────────────────────────────────────────────────────────────────

# def generate(query: str, chunks: list) -> str:
#     """
#     Extract a precise, relevant answer from the top retrieved chunk.
#     No network calls — runs in under 5ms.
#     """
#     if not chunks:
#         return (
#             "I could not find relevant information for your query. "
#             "Please contact customer support for assistance."
#         )

#     best_chunk = chunks[0]["text"]
#     keywords   = _query_keywords(query)

#     # Step 1: pull the A: portion
#     answer_text = _extract_answer_text(best_chunk)

#     # Step 2: colon-section list (NEFT: ... RTGS: ...) → extract exact section
#     section = _extract_named_section(answer_text, keywords)
#     if section:
#         return section

#     sentences = re.split(r"(?<=[.!?])\s+", answer_text.strip())

#     # Step 3: short answers — return as-is
#     if len(sentences) <= 3:
#         return answer_text.strip()

#     # Step 4: enumeration (For X days... For Y days...) → full answer
#     if _is_enumeration(sentences):
#         return answer_text.strip()

#     # Step 5: first sentence dominates but rest are continuations → full answer
#     if _first_sentence_dominates(sentences, keywords):
#         return answer_text.strip()

#     # Step 6: long mixed-content answer → pick top-scoring sentences
#     scored    = [(i, s, _score(s, keywords)) for i, s in enumerate(sentences)]
#     max_score = max(sc for _, _, sc in scored)

#     if max_score == 0:
#         return answer_text.strip()

#     threshold = max(1, max_score // 2)
#     kept = [(i, s) for i, s, sc in scored if sc >= threshold][:4]
#     kept.sort(key=lambda x: x[0])
#     return " ".join(s for _, s in kept)