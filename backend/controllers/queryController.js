const { processQuery }    = require("../services/processors/queryProcessor");
const { processCategory } = require("../services/processors/categoryProcessor");
const { translateResponse } = require("../services/processors/translatorProcessor");
const { processRAGQuery } = require("../services/processors/ragProcessor");
const QueryHistory = require("../models/QueryHistory");
const axios = require("axios");

/**
 * Three query modes sent from the frontend:
 *
 *   "account"   — DB mode. Secure account lookups via customerService.
 *   "neural"    — AI mode. Custom seq2seq transformer (qa_routes.py).
 *   "knowledge" — RAG mode. Knowledge base retrieval pipeline.
 *
 * Legacy boolean transformerMode still accepted for backward compatibility:
 *   true  → "neural"
 *   false → "account"
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveMode(raw) {
    if (raw === "account")   return "account";
    if (raw === "knowledge") return "knowledge";
    if (raw === "neural")    return "neural";
    // Legacy boolean
    if (raw === true)        return "neural";
    if (raw === false)       return "account";
    return "neural"; // default
}

// ─── Controller: main query handler ─────────────────────────────────────────

const handleQuery = async (req, res) => {
    try {
        const { query, mode: rawMode } = req.body;
        const userId = req.user.id;

        if (!query) return res.status(400).json({ error: "Query is required" });

        const mode = resolveMode(rawMode);
        console.log(`[queryController] mode='${mode}' query='${query}'`);

        let response = "";
        let category = "general";
        let ragSources = [];

        if (mode === "knowledge") {
            // ── Knowledge (RAG) mode ─────────────────────────────────────────
            const { category: cat } = await processCategory(query);
            category = cat || "general";
            const ragResult = await processRAGQuery(query);
            response   = ragResult.response;
            ragSources = ragResult.sources || [];

        } else if (mode === "neural") {
            // ── Neural (transformer) mode ────────────────────────────────────
            const { category: cat } = await processCategory(query);
            category = cat || "general";
            const result = await processQuery(query);
            response = result.response || "Sorry, I could not generate a response.";

        } else {
            // ── Account (DB) mode — handled by customerService via /secureQuery
            // This branch is for non-sensitive queries in account mode
            const { category: cat } = await processCategory(query);
            category = cat || "general";
            const result = await processQuery(query);
            response = result.response || "Please use a secure query with your account number for account details.";
        }

        // Save to history
        const entry = new QueryHistory({ userId, query, category, response });
        const saved = await entry.save();

        return res.json({
            category,
            response,
            mode,
            historyId: saved._id,
            ...(ragSources.length > 0 && { sources: ragSources }),
        });

    } catch (error) {
        console.error("Error processing query:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ─── Controller: category only ───────────────────────────────────────────────

const handleCategory = async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user?.id;

        if (!query)  return res.status(400).json({ error: "Query is required" });
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (typeof query !== "string" || !query.trim())
            return res.status(400).json({ error: "Query must be a non-empty string" });

        const { category } = await processCategory(query);
        if (!category) return res.status(500).json({ error: "Failed to determine category" });

        res.json({ category });
    } catch (error) {
        console.error("Error in handleCategory:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// ─── Controller: translate response ──────────────────────────────────────────

const handleTranslate = async (req, res) => {
    try {
        const { response, historyId } = req.body;
        const userId = req.user.id;

        if (!response) return res.status(400).json({ error: "Response is required" });

        const { translation } = await translateResponse(response);

        if (historyId) {
            await QueryHistory.findOneAndUpdate(
                { _id: historyId, userId },
                { translatedResponse: translation }
            );
        }

        res.json({ translation });
    } catch (error) {
        console.error("Error translating response:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ─── Controller: query history ────────────────────────────────────────────────

const getQueryHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await QueryHistory.find({ userId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        console.error("Error fetching query history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ─── Controller: Telugu TTS ───────────────────────────────────────────────────

const AI_BASE_URL = process.env.AI_BASE_URL || "http://127.0.0.1:5001";

const handleTelugu = async (req, res) => {
    try {
        const pyRes = await axios.post(
            `${AI_BASE_URL}/api/tts`,
            { text: req.body.text },
            { responseType: "stream" }
        );
        res.setHeader("Content-Type", "audio/mpeg");
        pyRes.data.pipe(res);
    } catch (err) {
        console.error("Error generating speech:", err);
        res.status(500).send("Error generating speech");
    }
};

module.exports = {
    handleQuery,
    handleTranslate,
    getQueryHistory,
    handleTelugu,
    handleCategory,
};