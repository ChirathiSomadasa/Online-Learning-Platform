import axios from 'axios';

const COURSE_API = process.env.REACT_APP_COURSE_API_URL || 'http://localhost:3002';

// ── Public ──────────────────────────────────────────────

export const getAllCourses = async (params = {}) => {
  const response = await axios.get(`${COURSE_API}/api/courses`, { params });
  return response.data;
};

export const getCourseById = async (id) => {
  const response = await axios.get(`${COURSE_API}/api/courses/${id}`);
  return response.data;
};

// ── Protected (need JWT) ────────────────────────────────

export const createCourse = async (data, token) => {
  const response = await axios.post(`${COURSE_API}/api/courses`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateCourse = async (id, data, token) => {
  const response = await axios.put(`${COURSE_API}/api/courses/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getInstructorCourses = async (token) => {
  const response = await axios.get(`${COURSE_API}/api/courses/my-courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteCourse = async (id, token) => {
  const response = await axios.delete(`${COURSE_API}/api/courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};