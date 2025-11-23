/**
 * API Configuration Utility
 * Automatically detects production vs development and uses correct API base URL
 */

// Detect if we're in production (Render deployment)
const isProduction = process.env.NODE_ENV === 'production' || 
                     window.location.hostname.includes('onrender.com') ||
                     window.location.hostname.includes('talendro.com');

// Get API base URL
// In production, use relative URLs (same origin)
// In development, use localhost:5001
export const getApiBaseUrl = () => {
  if (isProduction) {
    // In production, frontend and backend are on same origin, use relative URLs
    return '';
  }
  
  // In development, use environment variable or default to localhost
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
};

// Helper to build full API URL
export const apiUrl = (endpoint) => {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

// Log configuration on load
console.log('API Configuration:', {
  isProduction,
  apiBaseUrl: getApiBaseUrl(),
  hostname: window.location.hostname,
  nodeEnv: process.env.NODE_ENV
});

