// src/config.js
// Centralized API configuration

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/staff/register`,
  
  // Staff endpoints
  PENDING_STAFF: `${API_BASE_URL}/api/staff/pending`,
  APPROVE_STAFF: (id) => `${API_BASE_URL}/api/staff/${id}/approve`,
  REJECT_STAFF: (id) => `${API_BASE_URL}/api/staff/${id}/reject`,
  
  // Admin endpoints
  ALL_USERS: `${API_BASE_URL}/api/admin/users`,
  DELETE_USER: (id) => `${API_BASE_URL}/api/admin/users/${id}`,
  ACTIVITY_LOGS: `${API_BASE_URL}/api/admin/activity-logs`,
  
  // Poles endpoints
  POLES: (type) => `${API_BASE_URL}/api/poles/${type}`,
  POLE_BY_ID: (type, id) => `${API_BASE_URL}/api/poles/${type}/${id}`,
  NEAREST_POLES: `${API_BASE_URL}/api/nearest_poles_ml`,
  
  // ODP Ports endpoints
  ODP_PORTS: (odpId) => `${API_BASE_URL}/api/odp/${odpId}/ports`,
  DELETE_PORT: (portId) => `${API_BASE_URL}/api/odp_ports/${portId}`,
  
  // Weather endpoints
  WEATHER_CURRENT: `${API_BASE_URL}/api/weather/current`,
  WEATHER_FORECAST: `${API_BASE_URL}/api/weather/forecast`,
  WEATHER_PREDICT: `${API_BASE_URL}/api/weather/predict`,
  WEATHER_TRAIN: `${API_BASE_URL}/api/weather/train`
};

export default API_BASE_URL;