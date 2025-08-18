// src/axiosInstance.js
import axios from "axios";

// ✅ Base URL from .env (useful for dev & prod)
const BASE_URL = process.env.REACT_APP_API_URL 

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// ✅ Add token automatically if present
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Optional: global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized - logging out");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
