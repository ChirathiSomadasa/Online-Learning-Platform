// src/services/notificationService.js
import axios from 'axios';

const NOTIFY_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';

export const getUserNotifications = async (email, token) => {
  const response = await axios.get(
    `${NOTIFY_URL}/api/notifications/logs/${email}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};