import React, { useRef } from "react";
import './ResponseDisplay.css';
import { FaTimes, FaVolumeUp, FaLanguage } from "react-icons/fa";
import API_URL from "../../utils/apiConfig";

const ResponseDisplay = ({
  lastQuery,
  response,
  responseCategory,
  translatedResponse,
  isTranslating,
  onTranslate,
  onClose,
  speak
}) => {
  const responseRef = useRef(null);
  const responseContentRef = useRef(null);

  return (
    <div className="response-mode" ref={responseRef}>
      <div className="response-header">
        <div className="query-display">
          <h3>{lastQuery}</h3>
          {responseCategory && <span className="response-category">{responseCategory}</span>}
        </div>
        <button onClick={onClose} className="close-response-btn" title="Close Response">
          <FaTimes />
        </button>
      </div>
      <div className="response-content" ref={responseContentRef}>
        <div><strong>Response:</strong>
          {/* {response} */}
          {response.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>

        {/* {translatedResponse && (
          <div className="translated-content">
            <p><strong>Telugu Translation:</strong> {translatedResponse}</p>
          </div>
        )} */}
        {translatedResponse && (
          <div className="translated-response">
            <h4>Translated Response:</h4>
            {translatedResponse.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}


        <div className="response-actions">
          <button
            onClick={async () => {
              try {
                const res = await fetch(`${API_URL}/api/query/tts`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text: translatedResponse || response })
                });

                if (!res.ok) throw new Error("TTS failed");

                const audioBlob = await res.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play();
              } catch (err) {
                console.error("Error playing TTS:", err);
              }
            }}

            className="tts-btn"
            title="Listen to response"
          >
            <FaVolumeUp />{' '}Listen
          </button>

          <button
            onClick={onTranslate}
            className="translate-btn"
            title="Translate Response"
            disabled={isTranslating}
          >
            {isTranslating ? "Translating..." : <><FaLanguage />{'   '}Translate</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseDisplay;