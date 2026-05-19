import React, { useEffect, useState } from "react";
import { FaHistory, FaSpinner, FaExclamationCircle, FaTag } from "react-icons/fa";
import API_URL from "../../utils/apiConfig";
import "./QueryHistory.css";

const QueryHistory = ({ darkMode = false }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const authToken = sessionStorage.getItem("auth-token");

        if (!authToken) {
            setError("You must be logged in to view query history.");
            setLoading(false);
            return;
        }

        fetch(`${API_URL}/api/query/history`, {
            headers: { "auth-token": authToken }
        })
            .then((res) => res.json())
            .then((data) => {
                setHistory(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching history:", err);
                setError("Failed to load query history.");
                setLoading(false);
            });
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="history-loading">
                    <FaSpinner className="spinner-icon" />
                    <p>Loading query history...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="history-error">
                    <FaExclamationCircle className="error-icon" />
                    <p>{error}</p>
                </div>
            );
        }

        if (history.length === 0) {
            return (
                <div className="history-empty">
                    <p>No query history found.</p>
                    <p>Start exploring by asking your first question!</p>
                </div>
            );
        }

        return (
            <ul className="history-list">
                {history.map((entry, index) => (
                    <li key={index} className="history-item">
                        <div className="history-content">
                            <div className="history-header">
                                <div className="history-category">
                                    <FaTag className="category-icon" />
                                    <span className="category-text">{entry.category}</span>
                                </div>
                                <span className="timestamp">
                                    {new Date(entry.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div className="history-query">
                                <span className="label">Query:</span>
                                <p>{entry.query}</p>
                            </div>
                            <div className="history-response">
                                <span className="label">Response:</span>
                                <p>{entry.response}</p>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className={`query-history-container ${darkMode ? 'dark-mode' : ''}`}>
            <div className="query-history-header">
                <FaHistory className="history-icon" />
                <h2>Query History</h2>
            </div>
            <div className="query-history-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default QueryHistory;