import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import WelcomeMessage from "../../components/dashboard_components/WelcomeMessage";
import QueryInput from "../../components/dashboard_components/QueryInput";
import ResponseDisplay from "../../components/dashboard_components/ResponseDisplay";
import ButtonNavigation from "../../components/dashboard_components/ButtonNavigation";
import PopupSystem from "../../components/dashboard_components/PopupSystem";
import Footer from "../../components/dashboard_components/Footer";
import { containsSensitiveInfo } from "../../utils/securityUtils";

const API_BASE_URL = "http://localhost:5000";

/**
 * queryMode: "account" | "neural" | "knowledge"
 *   account   → DB mode  — secure customer data lookups
 *   neural    → AI mode  — custom seq2seq transformer
 *   knowledge → RAG mode — knowledge base retrieval
 */

const Dashboard = ({ darkMode, setDarkMode, fontSize, setFontSize, showAlert }) => {
  const [query, setQuery]                     = useState("");
  const [response, setResponse]               = useState(null);
  const [translatedResponse, setTranslatedResponse] = useState(null);
  const [responseCategory, setResponseCategory]     = useState(null);
  const [lastQuery, setLastQuery]             = useState("");
  const [activePopup, setActivePopup]         = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoReadEnabled, setAutoReadEnabled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTranslating, setIsTranslating]     = useState(false);
  const [queryHistory, setQueryHistory]       = useState([]);
  const [recentHighlights, setRecentHighlights] = useState([]);

  // ── Mode state (replaces boolean transformerMode) ──────────────────────────
  const [queryMode, setQueryMode] = useState(() => {
    return localStorage.getItem("queryMode") || "neural";
  });

  useEffect(() => {
    localStorage.setItem("queryMode", queryMode);
  }, [queryMode]);

  // Clear account number and response on mode change
  useEffect(() => {
    setQuery("");
    setResponse(null);
    setTranslatedResponse(null);
    setResponseCategory(null);
    setLastQuery("");
    localStorage.removeItem("savedAccountNumber");
  }, [queryMode]);

  // Clear account number on page unload
  useEffect(() => {
    const clear = () => localStorage.removeItem("savedAccountNumber");
    window.addEventListener("beforeunload", clear);
    return () => window.removeEventListener("beforeunload", clear);
  }, []);

  const dashboardClasses = `dashboard ${darkMode ? "dark-mode" : ""} ${response ? "response-active" : ""} font-size-${fontSize}`;

  // ── Utilities ──────────────────────────────────────────────────────────────

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang  = "en-US";
      u.rate  = 1;
      window.speechSynthesis.speak(u);
    } else {
      alert("Text-to-Speech not supported in this browser.");
    }
  };

  const logError = (type, msg) => console.error(`[${type}]`, msg);

  const fetchQueryHistory = () => {
    const token = sessionStorage.getItem("auth-token");
    if (!token) return;
    fetch(`${API_BASE_URL}/api/query/history?limit=3&sort=-createdAt`, {
      headers: { "auth-token": token },
    })
      .then((r) => r.json())
      .then((data) => {
        setQueryHistory(data);
        setRecentHighlights(
          data.slice(0, 3).map((e, i) => ({
            id: i + 1,
            query: e.query,
            response: e.response,
            category: e.category || "General",
          }))
        );
      })
      .catch((err) => console.error("Error fetching history:", err));
  };

  const promptForAccountNumber = () =>
    new Promise((resolve) => {
      const stored = localStorage.getItem("savedAccountNumber");
      if (stored && response && /^[A-Z]{2}\d{10}$/.test(stored)) {
        resolve(stored);
        return;
      }
      const input = prompt("Please enter your 12-character account number (e.g., IN1234567890):");
      if (input === null) {
        showAlert("Authentication canceled.");
        resolve(null);
        return;
      }
      if (!/^[A-Z]{2}\d{10}$/.test(input)) {
        showAlert("Invalid account number format.");
        resolve(null);
        return;
      }
      localStorage.setItem("savedAccountNumber", input);
      resolve(input);
    });

  // ── Main query handler ─────────────────────────────────────────────────────

  const handleQuerySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query.trim();
    const authToken    = sessionStorage.getItem("auth-token");
    if (!authToken) {
      showAlert("You need to be logged in to use this feature.");
      return;
    }

    console.log(`[Dashboard] Submitting query='${currentQuery}' mode='${queryMode}'`);

    setLastQuery(currentQuery);
    setQuery("");
    setTranslatedResponse(null);

    try {
      // ── Account mode: secure DB lookup ──────────────────────────────────
      if (queryMode === "account" && containsSensitiveInfo(currentQuery)) {
        const accountNumber = await promptForAccountNumber();
        if (!accountNumber) return;

        const res  = await fetch(`${API_BASE_URL}/api/customers/secureQuery`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "auth-token": authToken },
          body:    JSON.stringify({ query: currentQuery, accountNumber }),
        });
        const data = await res.json();
        if (res.ok) {
          setResponse(data.response || "No response received");
          setResponseCategory(data.category || "Account");
          if (autoReadEnabled) speak(data.response);
        } else {
          setResponse(data.error || "An error occurred");
          setResponseCategory("Error");
          logError("Secure query error", data.error);
        }
        fetchQueryHistory();
        return;
      }

      // ── Neural / Knowledge / non-sensitive Account mode ──────────────────
      // Map frontend mode to backend mode string
      const backendMode =
        queryMode === "account"   ? "account"   :
        queryMode === "knowledge" ? "knowledge" :
        "neural";

      const [queryRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/query/`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "auth-token": authToken },
          body:    JSON.stringify({ query: currentQuery, mode: backendMode }),
        }).then((r) => r.json().then((d) => ({ ok: r.ok, data: d }))),

        fetch(`${API_BASE_URL}/api/query/category`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "auth-token": authToken },
          body:    JSON.stringify({ query: currentQuery }),
        }).then((r) => r.json().then((d) => ({ ok: r.ok, data: d }))),
      ]);

      if (queryRes.ok) {
        setResponse(queryRes.data.response || "No response received");
      } else {
        setResponse(queryRes.data.error || "An error occurred");
        setResponseCategory("Error");
        logError("Query error", queryRes.data.error);
        return;
      }

      setResponseCategory(
        catRes.ok ? (catRes.data.category || "General") : "General"
      );

      if (autoReadEnabled) speak(queryRes.data.response);
      fetchQueryHistory();

    } catch (error) {
      console.error("Request failed:", error);
      setResponse("Network error. Please try again later.");
      setResponseCategory("Error");
      logError("Network error", error.message);
    }
  };

  // ── Translation ────────────────────────────────────────────────────────────

  const handleTranslate = async () => {
    if (!response) return;
    setIsTranslating(true);
    const authToken = sessionStorage.getItem("auth-token");
    if (!authToken) { setIsTranslating(false); return; }

    try {
      const res  = await fetch(`${API_BASE_URL}/api/query/translate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "auth-token": authToken },
        body:    JSON.stringify({ response }),
      });
      const data = await res.json();
      setTranslatedResponse(
        res.ok
          ? (data.translation || "No translation received")
          : "Translation error: " + (data.error || "Unknown error")
      );
    } catch {
      setTranslatedResponse("Network error. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  // ── Close response ─────────────────────────────────────────────────────────

  const handleCloseResponse = () => {
    setIsTransitioning(true);
    localStorage.removeItem("savedAccountNumber");
    setTimeout(() => {
      setResponse(null);
      setTranslatedResponse(null);
      setResponseCategory(null);
      setLastQuery("");
      setIsTransitioning(false);
      setQuery("");
    }, 300);
  };

  const togglePopup = (name) =>
    setActivePopup(activePopup === name ? null : name);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    fetchQueryHistory();
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={dashboardClasses}>
      <div className="dashboard-inner">
        <div className="conversation-container">
          <main className="main-content">
            {!response && <WelcomeMessage />}

            {response && (
              <ResponseDisplay
                lastQuery={lastQuery}
                response={response}
                responseCategory={responseCategory}
                translatedResponse={translatedResponse}
                isTranslating={isTranslating}
                onTranslate={handleTranslate}
                onClose={handleCloseResponse}
                speak={speak}
              />
            )}

            {!response && (
              <div className="query-label">
                <p style={{ fontSize: "20px", textAlign: "center" }}>
                  What's your query?
                </p>
              </div>
            )}

            {!response && (
              <QueryInput
                query={query}
                setQuery={setQuery}
                onSubmit={handleQuerySubmit}
                queryMode={queryMode}
                setQueryMode={setQueryMode}
              />
            )}

            {!response && <ButtonNavigation togglePopup={togglePopup} />}
            {!response && <Footer />}
            {response  && <div className="response-bottom-spacer" />}
          </main>
        </div>

        {response && (
          <div className={`response-mode-query ${isTransitioning ? "entering" : ""}`}>
            <QueryInput
              query={query}
              setQuery={setQuery}
              onSubmit={handleQuerySubmit}
              queryMode={queryMode}
              setQueryMode={setQueryMode}
              placeholder="Ask a follow-up question..."
            />
          </div>
        )}

        <PopupSystem
          activePopup={activePopup}
          setActivePopup={setActivePopup}
          recentHighlights={recentHighlights}
          queryHistory={queryHistory}
          setQuery={setQuery}
          fontSize={fontSize}
          setFontSize={setFontSize}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          autoReadEnabled={autoReadEnabled}
          setAutoReadEnabled={setAutoReadEnabled}
          queryMode={queryMode}
          setQueryMode={setQueryMode}
          // Legacy prop — PopupSystem may still reference transformerMode
          transformerMode={queryMode === "neural"}
          setTransformerMode={(v) => setQueryMode(v ? "neural" : "account")}
        />
      </div>
    </div>
  );
};

export default Dashboard;