import axios from 'axios';

const ENROLLMENT_API = process.env.REACT_APP_ENROLLMENT_API_URL || 'http://localhost:3003';

/**
 * Helper to get auth headers
 */
const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ── Enrollment Operations ──────────────────────────────────

/**
 * Enroll a user in a specific course
 * @param {string} courseId 
 * @param {string} token - JWT from Auth context
 */
export const createEnrollment = async (courseId, token) => {
  const response = await axios.post(
    `${ENROLLMENT_API}/api/enrollment`,  
    { courseId },
    getAuthHeaders(token)
  );
  return response.data;
};

/**
 * Fetch all enrollments for a specific user
 * @param {string} userId 
 * @param {string} token 
 */
export const getUserEnrollments = async (userId, token) => {
  const response = await axios.get(
    `${ENROLLMENT_API}/api/enrollment/user/${userId}`,  
    getAuthHeaders(token)
  );
  return response.data;
};

/**
 * Fetch a single enrollment by its ID
 */
export const getEnrollmentById = async (id, token) => {
  const response = await axios.get(
    `${ENROLLMENT_API}/api/enrollment/${id}`,  
    getAuthHeaders(token)
  );
  return response.data;
};

/**
 * Cancel an active enrollment
 * Note: Your working component uses DELETE, not PUT
 */
export const cancelEnrollment = async (id, token) => {
  const response = await axios.delete(
    `${ENROLLMENT_API}/api/enrollment/${id}`,  
    getAuthHeaders(token)
  );
  return response.data;
};

/**
 * Update course progress (percentage)
 * @param {string} id - Enrollment ID
 * @param {number} progress - e.g., 50 for 50%
 */
export const updateProgress = async (id, progress, token) => {
  const response = await axios.put(
    `${ENROLLMENT_API}/api/enrollment/${id}/progress`,  
    { progress },
    getAuthHeaders(token)
  );
  return response.data;
};
