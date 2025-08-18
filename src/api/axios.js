import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ecommerce-backend-8wv0.onrender.com/api', // Replace with your backend URL
});

export default api;
