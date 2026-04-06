import axios from 'axios';

const API = process.env.REACT_APP_PAYMENT_API_URL || 'http://localhost:3006';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Step 1 – create a PaymentIntent and get back the clientSecret.
 */
export const createPaymentIntent = async (courseId) => {
  const res = await axios.post(
    `${API}/api/payments/create-intent`,
    { courseId },
    { headers: getAuthHeader() },
  );
  return res.data; // { clientSecret, paymentId, amount, currency }
};

/**
 * Step 2 – tell the backend the Stripe.js confirmation succeeded.
 */
export const confirmPayment = async (paymentIntentId) => {
  const res = await axios.post(
    `${API}/api/payments/confirm`,
    { paymentIntentId },
    { headers: getAuthHeader() },
  );
  return res.data; // { payment, enrollmentId }
};

/**
 * Fetch payment history for a user.
 */
export const getUserPayments = async (userId) => {
  const res = await axios.get(
    `${API}/api/payments/user/${userId}`,
    { headers: getAuthHeader() },
  );
  return res.data;
};

/**
 * Admin: fetch all payments (paginated).
 */
export const getAllPayments = async (page = 1, limit = 20, status = '') => {
  const params = { page, limit, ...(status && { status }) };
  const res = await axios.get(`${API}/api/payments/admin/all`, {
    headers: getAuthHeader(),
    params,
  });
  return res.data;
};

/**
 * Admin: issue a refund.
 * @param {string} paymentId
 * @param {number|null} amount  – partial refund in dollars, omit for full
 */
export const refundPayment = async (paymentId, amount = null) => {
  const body = amount ? { amount } : {};
  const res = await axios.post(
    `${API}/api/payments/${paymentId}/refund`,
    body,
    { headers: getAuthHeader() },
  );
  return res.data;
};
