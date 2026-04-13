"""
translate_routes.py - English to Telugu translation.

Uses the custom seq2seq transformer trained from scratch.
torchtext imports are lazy (deferred to first request) so a DLL
mismatch on Windows does NOT crash the FastAPI service at startup.

If the custom model fails to load, falls back to deep-translator (googletrans).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import math, traceback, os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

translation_router = APIRouter(prefix="/api", tags=["Translation"])

# Config - must match training hyperparameters exactly
EMB_SIZE           = 256
NHEAD              = 8
FFN_HID_DIM        = 512
NUM_ENCODER_LAYERS = 3
NUM_DECODER_LAYERS = 3
DROPOUT            = 0.1
UNK_IDX, PAD_IDX, BOS_IDX, EOS_IDX = 0, 1, 2, 3
SPECIAL_SYMBOLS = ["<unk>", "<pad>", "<bos>", "<eos>"]

# Lazy globals
_model           = None
_vocab_transform = None
_text_transform  = None
_device          = None
_custom_failed   = False


def _make_model_class(torch, nn):
    """
    Model class whose attribute names match the saved checkpoint exactly.
    Checkpoint keys:
      positional_encoding.pos_embedding   <- attribute MUST be named positional_encoding
      src_tok_emb.embedding.weight
      tgt_tok_emb.embedding.weight
      transformer.*
      generator.*
    """

    class SinusoidalPositionalEncoding(nn.Module):
        def __init__(self, emb_size, dropout, maxlen=5000):
            super().__init__()
            den = torch.exp(-torch.arange(0, emb_size, 2) * math.log(10000) / emb_size)
            pos = torch.arange(0, maxlen).reshape(maxlen, 1)
            pe  = torch.zeros((maxlen, emb_size))
            pe[:, 0::2] = torch.sin(pos * den)
            pe[:, 1::2] = torch.cos(pos * den)
            self.dropout = nn.Dropout(dropout)
            self.register_buffer("pos_embedding", pe.unsqueeze(0))

        def forward(self, x):
            return self.dropout(x + self.pos_embedding[:, :x.size(1)])

    class TokenEmbedding(nn.Module):
        def __init__(self, vocab_size, emb_size):
            super().__init__()
            self.embedding = nn.Embedding(vocab_size, emb_size)
            self.emb_size  = emb_size

        def forward(self, tokens):
            return self.embedding(tokens.long()) * math.sqrt(self.emb_size)

    class Seq2SeqTransformer(nn.Module):
        def __init__(self, enc_layers, dec_layers, emb_size, nhead,
                     src_vocab, tgt_vocab, ff_dim=512, dropout=0.1, maxlen=5000):
            super().__init__()
            self.transformer = nn.Transformer(
                d_model=emb_size, nhead=nhead,
                num_encoder_layers=enc_layers,
                num_decoder_layers=dec_layers,
                dim_feedforward=ff_dim,
                dropout=dropout,
                batch_first=True,
            )
            self.generator   = nn.Linear(emb_size, tgt_vocab)
            self.src_tok_emb = TokenEmbedding(src_vocab, emb_size)
            self.tgt_tok_emb = TokenEmbedding(tgt_vocab, emb_size)
            # IMPORTANT: must be named positional_encoding to match checkpoint keys
            self.positional_encoding = SinusoidalPositionalEncoding(emb_size, dropout, maxlen)

        def encode(self, src, src_mask=None, src_padding_mask=None):
            return self.transformer.encoder(
                self.positional_encoding(self.src_tok_emb(src)),
                mask=src_mask,
                src_key_padding_mask=src_padding_mask,
            )

        def decode(self, tgt, memory, tgt_mask,
                   tgt_padding_mask=None, mem_key_padding_mask=None):
            return self.transformer.decoder(
                self.positional_encoding(self.tgt_tok_emb(tgt)),
                memory,
                tgt_mask=tgt_mask,
                tgt_key_padding_mask=tgt_padding_mask,
                memory_key_padding_mask=mem_key_padding_mask,
            )

    return Seq2SeqTransformer


def _load_custom_model():
    """Load the custom model lazily on first translate request."""
    global _model, _vocab_transform, _text_transform, _device, _custom_failed

    if _model is not None:
        return True
    if _custom_failed:
        return False

    try:
        import torch
        import torch.nn as nn
        from torchtext.data.utils import get_tokenizer

        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[translation] Loading custom model on {_device} ...")

        _vocab_transform = {
            "en": torch.load(os.path.join(BASE_DIR, "vocab_transform_en.pt"), map_location=_device, weights_only=False),
            "te": torch.load(os.path.join(BASE_DIR, "vocab_transform_te.pt"), map_location=_device, weights_only=False),
        }
        src_vocab = len(_vocab_transform["en"])
        tgt_vocab = len(_vocab_transform["te"])

        def _tok_te(text):
            return text.split()

        def _sequential(*transforms):
            def fn(x):
                for t in transforms:
                    x = t(x)
                return x
            return fn

        def _tensor_transform(token_ids):
            return torch.cat((
                torch.tensor([BOS_IDX]),
                torch.tensor(token_ids),
                torch.tensor([EOS_IDX]),
            ))

        token_transform = {
            "en": get_tokenizer("spacy", language="en_core_web_sm"),
            "te": _tok_te,
        }
        _text_transform = {
            ln: _sequential(token_transform[ln], _vocab_transform[ln], _tensor_transform)
            for ln in ["en", "te"]
        }

        Seq2SeqTransformer = _make_model_class(torch, nn)
        m = Seq2SeqTransformer(
            NUM_ENCODER_LAYERS, NUM_DECODER_LAYERS, EMB_SIZE, NHEAD,
            src_vocab, tgt_vocab, FFN_HID_DIM, DROPOUT,
        )
        m.to(_device)
        m.load_state_dict(
            torch.load(
                os.path.join(BASE_DIR, "transformer_eng_tel_scratch_full_data.pt"),
                map_location=_device,
                weights_only=False,
            )
        )
        m.eval()
        _model = m
        print("[translation] Custom model loaded successfully.")
        return True

    except Exception as e:
        _custom_failed = True
        print(f"[translation] Custom model load FAILED: {e}")
        print("[translation] Will use deep-translator fallback.")
        return False


def _translate_custom(text: str, max_len: int = 100) -> str:
    import torch
    _model.eval()
    with torch.no_grad():
        src          = _text_transform["en"](text).unsqueeze(0).to(_device)
        src_pad_mask = (src == PAD_IDX).to(_device)
        memory       = _model.encode(src, src_padding_mask=src_pad_mask)
        ys           = torch.ones(1, 1).fill_(BOS_IDX).long().to(_device)

        for _ in range(max_len - 1):
            sz       = ys.size(1)
            tgt_mask = torch.triu(torch.ones(sz, sz, device=_device), diagonal=1).bool()
            tgt_mask = tgt_mask.float().masked_fill(tgt_mask, float("-inf"))
            out      = _model.decode(ys, memory, tgt_mask)
            next_idx = _model.generator(out[:, -1]).argmax(dim=1).item()
            ys       = torch.cat([ys, torch.tensor([[next_idx]], device=_device)], dim=1)
            if next_idx == EOS_IDX:
                break

        tokens = [_vocab_transform["te"].get_itos()[i] for i in ys.squeeze(0).tolist()]
        return " ".join(t for t in tokens if t not in SPECIAL_SYMBOLS)


def _translate_fallback(text: str) -> str:
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source="en", target="te").translate(text)
    except ImportError:
        raise RuntimeError(
            "deep-translator not installed. Run: pip install deep-translator==1.11.4"
        )


class TranslationRequest(BaseModel):
    sentence:   str
    max_length: Optional[int] = 100


@translation_router.post("/translate")
async def translate(request: TranslationRequest):
    text = request.sentence.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text provided.")

    try:
        if _load_custom_model():
            result  = _translate_custom(text, max_len=request.max_length or 100)
            backend = "custom_transformer"
        else:
            result  = _translate_fallback(text)
            backend = "deep_translator_fallback"

        return {
            "success":       True,
            "input":         text,
            "translation":   result,
            "language_pair": "en-te",
            "backend":       backend,
        }

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")


@translation_router.get("/translate/health")
async def translation_health():
    return {
        "custom_model_loaded": _model is not None,
        "backend": "custom_transformer" if _model is not None else (
            "deep_translator_fallback" if not _custom_failed else "unavailable"
        ),
    }