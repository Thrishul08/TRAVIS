// API configuration - uses environment variable or falls back to localhost
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default API_URL;
