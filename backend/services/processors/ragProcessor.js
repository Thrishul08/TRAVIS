const axios = require("axios");

const RAG_API_URL = "http://127.0.0.1:5001/api/rag";

/**
 * Call the Python RAG pipeline.
 * Returns { response, sources, chunks_used }
 */
async function processRAGQuery(query) {
    try {
        const pythonResponse = await axios.post(RAG_API_URL, { query });
        const { response, sources, chunks_used } = pythonResponse.data;
        return { response, sources, chunks_used };
    } catch (error) {
        if (error.code === "ECONNREFUSED") {
            console.error("[ragProcessor] RAG service unreachable at", RAG_API_URL);
            return {
                response: "The knowledge base service is currently unavailable. Please try again later or contact customer support.",
                sources: [],
                chunks_used: 0,
            };
        }
        const detail = error.response?.data?.detail || error.message;
        console.error("[ragProcessor] RAG API error:", detail);
        return {
            response: "Sorry, I could not retrieve an answer from the knowledge base right now.",
            sources: [],
            chunks_used: 0,
        };
    }
}

module.exports = { processRAGQuery };