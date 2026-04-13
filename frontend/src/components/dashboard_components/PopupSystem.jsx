import React from "react";
import './PopupSystem.css';
import './popups/SpeakPopup.css';
import './popups/FontSizePopup.css';
import './popups/RecentPopup.css';
import './popups/SettingsPopup.css';

import SpeakPopup    from "./popups/SpeakPopup";
import RecentPopup   from "./popups/RecentPopup";
import FontSizePopup from "./popups/FontSizePopup";
import SettingsPopup from "./popups/SettingsPopup";

const PopupSystem = ({
  activePopup,
  setActivePopup,
  recentHighlights,
  queryHistory,
  setQuery,
  fontSize,
  setFontSize,
  darkMode,
  setDarkMode,
  autoReadEnabled,
  setAutoReadEnabled,
  // New mode props
  queryMode,
  setQueryMode,
  // Legacy props (still forwarded for backward compat)
  transformerMode,
  setTransformerMode,
}) => {
  const closePopup = () => setActivePopup(null);
  if (!activePopup) return null;

  return (
    <div className="popup-overlay" onClick={closePopup}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>

        {activePopup === "speak" && (
          <SpeakPopup onClose={closePopup} setQuery={setQuery} />
        )}

        {activePopup === "recent" && (
          <RecentPopup
            recentHighlights={recentHighlights}
            queryHistory={queryHistory}
            setQuery={setQuery}
            onClose={closePopup}
          />
        )}

        {activePopup === "fontSize" && (
          <FontSizePopup
            fontSize={fontSize}
            setFontSize={setFontSize}
            onClose={closePopup}
          />
        )}

        {activePopup === "settings" && (
          <SettingsPopup
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            autoReadEnabled={autoReadEnabled}
            setAutoReadEnabled={setAutoReadEnabled}
            queryMode={queryMode}
            setQueryMode={setQueryMode}
            transformerMode={transformerMode}
            setTransformerMode={setTransformerMode}
            onClose={closePopup}
          />
        )}

      </div>
    </div>
  );
};

export default PopupSystem;