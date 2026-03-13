import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const register = async (data) => {
  const response = await axios.post(`${API_URL}/api/auth/register`, data);
  return response.data;
};

export const login = async (data) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, data);
  return response.data;
};

export const getProfile = async (token) => {
  const response = await axios.get(`${API_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};