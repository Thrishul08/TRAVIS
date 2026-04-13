"use client"

import { useRef, useEffect, useState } from "react"
import { FaStop } from "react-icons/fa"
import './QueryInput.css'

/**
 * queryMode: "account" | "neural" | "knowledge"
 *
 * Account   — real customer data from database
 * Neural    — custom seq2seq transformer (AI model)
 * Knowledge — RAG knowledge base retrieval
 */
const QueryInput = ({
  query,
  setQuery,
  onSubmit,
  placeholder = "Message TRAVIS...",
  isProcessing = false,
  queryMode = "neural",
  setQueryMode,
  // Legacy props — accepted but mapped internally
  transformerMode,
  setTransformerMode,
}) => {
  const textareaRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  // Accept legacy boolean transformerMode if queryMode not provided
  const effectiveMode = queryMode || (transformerMode === false ? "account" : "neural")
  const effectiveSetMode = setQueryMode || ((m) => setTransformerMode && setTransformerMode(m !== "account"))

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${Math.min(Math.max(el.scrollHeight, 60), 200)}px`
    }
  }, [query])

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (query.trim() && !isProcessing) onSubmit()
    }
  }

  const handleModeSelect = (mode) => {
    if (typeof effectiveSetMode !== "function") return
    if (mode !== effectiveMode) effectiveSetMode(mode)
  }

  const modeEnabled = typeof effectiveSetMode === "function"

  return (
    <div className={`modern-query-container ${isFocused ? "focused" : ""}`}>
      <div className="query-input-wrapper">

        {/* Text input */}
        <textarea
          ref={textareaRef}
          className="modern-query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isProcessing}
          aria-label="Query input"
          rows={1}
        />

        {/* Mode buttons — bottom left */}
        {modeEnabled && (
          <div className="mode-buttons-bottom-left">

            {/* Account mode */}
            <button
              type="button"
              className={`mode-toggle-btn account-mode ${effectiveMode === "account" ? "active" : ""}`}
              onClick={() => handleModeSelect("account")}
              title="Account Mode — real customer data from database"
              disabled={isProcessing}
              aria-pressed={effectiveMode === "account"}
            >
              <div className="mode-icon">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2C6.5 2 3 3 3 4.5v11c0 1.5 3.5 2.5 7 2.5s7-1 7-2.5v-11C17 3 13.5 2 10 2z"
                    stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <ellipse cx="10" cy="4.5" rx="7" ry="1.5" fill="currentColor"/>
                  <path d="M3 8.5c0 1.5 3.5 2.5 7 2.5s7-1 7-2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M3 12.5c0 1.5 3.5 2.5 7 2.5s7-1 7-2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <span className="mode-label">Account</span>
            </button>

            {/* Neural mode */}
            <button
              type="button"
              className={`mode-toggle-btn neural-mode ${effectiveMode === "neural" ? "active" : ""}`}
              onClick={() => handleModeSelect("neural")}
              title="Neural Mode — custom banking AI transformer"
              disabled={isProcessing}
              aria-pressed={effectiveMode === "neural"}
            >
              <div className="mode-icon">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="2.5" fill="currentColor"/>
                  <circle cx="4"  cy="6"  r="1.5" fill="currentColor"/>
                  <circle cx="16" cy="6"  r="1.5" fill="currentColor"/>
                  <circle cx="4"  cy="14" r="1.5" fill="currentColor"/>
                  <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
                  <circle cx="10" cy="2"  r="1.5" fill="currentColor"/>
                  <circle cx="10" cy="18" r="1.5" fill="currentColor"/>
                  <line x1="10" y1="7.5" x2="5.5"  y2="7"   stroke="currentColor" strokeWidth="1"/>
                  <line x1="10" y1="7.5" x2="14.5" y2="7"   stroke="currentColor" strokeWidth="1"/>
                  <line x1="10" y1="12.5" x2="5.5" y2="13"  stroke="currentColor" strokeWidth="1"/>
                  <line x1="10" y1="12.5" x2="14.5" y2="13" stroke="currentColor" strokeWidth="1"/>
                  <line x1="10" y1="7.5"  x2="10"  y2="3.5" stroke="currentColor" strokeWidth="1"/>
                  <line x1="10" y1="12.5" x2="10"  y2="16.5" stroke="currentColor" strokeWidth="1"/>
                </svg>
              </div>
              <span className="mode-label">Neural</span>
            </button>

            {/* Knowledge mode */}
            <button
              type="button"
              className={`mode-toggle-btn knowledge-mode ${effectiveMode === "knowledge" ? "active" : ""}`}
              onClick={() => handleModeSelect("knowledge")}
              title="Knowledge Mode — retrieval from banking knowledge base"
              disabled={isProcessing}
              aria-pressed={effectiveMode === "knowledge"}
            >
              <div className="mode-icon">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4a1 1 0 0 1 1-1h5v14H4a1 1 0 0 1-1-1V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M9 3h6a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9V3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <line x1="12" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="12" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="12" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="5"  y1="7"  x2="7"  y2="7"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="5"  y1="10" x2="7"  y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="mode-label">Knowledge</span>
            </button>

          </div>
        )}

        {/* Submit button — bottom right */}
        <button
          onClick={() => query.trim() && !isProcessing && onSubmit()}
          className={`modern-submit-btn ${query.trim() && !isProcessing ? "active" : ""} ${isProcessing ? "processing" : ""}`}
          title={isProcessing ? "Processing..." : "Send message"}
          disabled={!query.trim() || isProcessing}
          aria-label={isProcessing ? "Processing query" : "Send query"}
          style={{ width: 42, height: 42, minWidth: 42, minHeight: 42, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {isProcessing ? (
            <div className="processing-spinner"><FaStop size={20} /></div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M8 16c-.595 0-1.077-.462-1.077-1.032V1.032C6.923.462 7.405 0 8 0s1.077.462 1.077 1.032v13.936C9.077 15.538 8.595 16 8 16z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M1.315 8.44a1.002 1.002 0 0 1 0-1.46L7.238 1.302a1.11 1.11 0 0 1 1.523 0c.421.403.421 1.057 0 1.46L2.838 8.44a1.11 1.11 0 0 1-1.523 0z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M14.685 8.44a1.11 1.11 0 0 1-1.523 0L7.238 2.762a1.002 1.002 0 0 1 0-1.46 1.11 1.11 0 0 1 1.523 0l5.924 5.678c.42.403.42 1.056 0 1.46z" fill="currentColor"/>
            </svg>
          )}
        </button>

      </div>
    </div>
  )
}

export default QueryInput