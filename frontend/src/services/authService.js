import axios from 'axios';

const API_URL = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:3001';

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

export const updateProfile = async (token, data) => {
  const response = await axios.put(`${API_URL}/api/auth/profile`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updatePassword = async (token, data) => {
  const response = await axios.put(`${API_URL}/api/auth/profile/password`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteProfile = async (token) => {
  const response = await axios.delete(`${API_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getSecurityQuestion = async (email) => {
  const response = await axios.post(`${API_URL}/api/auth/forgot-password/question`, { email });
  return response.data;
};

export const resetPasswordWithQuestion = async (data) => {
  const response = await axios.post(`${API_URL}/api/auth/forgot-password/reset`, data);
  return response.data;
};