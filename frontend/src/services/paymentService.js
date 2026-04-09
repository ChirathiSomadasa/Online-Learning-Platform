import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Step 1 — create a PaymentIntent and get back the clientSecret
export const createPaymentIntent = async (courseId) => {
  const res = await axios.post(
    `${API}/api/payments/create-intent`,
    { courseId },
    { headers: getAuthHeader() },
  );
  return res.data; // { clientSecret, paymentId, amount, currency }
};

// Step 2 — tell the backend the Stripe.js confirmation succeeded
export const confirmPayment = async (paymentIntentId) => {
  const res = await axios.post(
    `${API}/api/payments/confirm`,
    { paymentIntentId },
    { headers: getAuthHeader() },
  );
  return res.data; // { payment, enrollmentId }
};

// Get logged-in user's own payment history
export const getMyPayments = async () => {
  const res = await axios.get(
    `${API}/api/payments/my`,
    { headers: getAuthHeader() },
  );
  return res.data;
};

// Get a single payment by ID
export const getPaymentById = async (paymentId) => {
  const res = await axios.get(
    `${API}/api/payments/${paymentId}`,
    { headers: getAuthHeader() },
  );
  return res.data;
};