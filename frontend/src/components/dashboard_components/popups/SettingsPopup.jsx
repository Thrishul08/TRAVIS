import React from "react";
import "./SettingsPopup.css";

const SettingsPopup = ({
  darkMode,
  setDarkMode,
  autoReadEnabled,
  setAutoReadEnabled,
  onClose,
  // New props
  queryMode,
  setQueryMode,
  // Legacy props
  transformerMode,
  setTransformerMode,
}) => {
  const effectiveMode    = queryMode ?? (transformerMode ? "neural" : "account");
  const effectiveSetMode = setQueryMode ?? ((m) => setTransformerMode && setTransformerMode(m === "neural"));

  const handleToggle = (key, val, setter) => {
    if (typeof setter === "function") {
      setter(!val);
      localStorage.setItem(key, JSON.stringify(!val));
    }
  };

  const handleModeChange = (e) => {
    const mode = e.target.value;
    effectiveSetMode(mode);
    localStorage.setItem("queryMode", mode);
  };

  const modeDescriptions = {
    account:   "Real customer data from database",
    neural:    "Custom banking AI transformer",
    knowledge: "Banking knowledge base (RAG)",
  };

  return (
    <div className="popup-content">
      <h2>Settings</h2>
      <div className="settings-list">

        <div className="setting-item">
          <label>
            <span>Dark Mode</span>
            <button
              className={`toggle-switch ${darkMode ? "active" : ""}`}
              onClick={() => handleToggle("darkMode", darkMode, setDarkMode)}
            >
              {darkMode ? "ON" : "OFF"}
            </button>
          </label>
        </div>

        <div className="setting-item setting-item--column">
          <div className="setting-row">
            <span>Query Mode</span>
            <select
              className="mode-select"
              value={effectiveMode}
              onChange={handleModeChange}
            >
              <option value="account">Account</option>
              <option value="neural">Neural</option>
              <option value="knowledge">Knowledge</option>
            </select>
          </div>
          <span className="mode-desc">{modeDescriptions[effectiveMode]}</span>
        </div>

        <div className="setting-item">
          <label>
            <span>Auto-read Responses</span>
            <button
              className={`toggle-switch ${autoReadEnabled ? "active" : ""}`}
              onClick={() => handleToggle("autoReadEnabled", autoReadEnabled, setAutoReadEnabled)}
            >
              {autoReadEnabled ? "ON" : "OFF"}
            </button>
          </label>
        </div>

      </div>
      <div className="popup-actions">
        <button onClick={onClose} className="secondary-btn">Close</button>
      </div>
    </div>
  );
};

export default SettingsPopup;