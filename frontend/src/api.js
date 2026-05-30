// ================================================================
// FILE: api.js
// PATH: src/
// CHANGES: Unlock functions mein password + remarks add
// ================================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9090/api',
});

// Token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 - logout
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// - Auth
export const loginApi  = (data) => api.post('/auth/login', data);
export const getMeApi  = ()     => api.get('/auth/me');

export const getStatsCourseFiltered = (programme = '') =>
  api.get('/admin/stats/per-course-filtered', { params: { programme } });

// - Admin: User Management
export const getUsersApi   = ()         => api.get('/admin/users');
export const createUserApi = (data)     => api.post('/admin/users', data);
export const updateUserApi = (id, data) => api.put(`/admin/users/${id}`, data);
export const toggleUserApi = (id)       => api.put(`/admin/users/${id}/toggle`);


// - Admin: Statistics
export const getStatsOverview = () => api.get('/admin/stats/overview');
export const getStatsCourse   = () => api.get('/admin/stats/per-course');
export const getStatsSource   = () => api.get('/admin/stats/entry-source');
export const getStatsEntryByUser = () => api.get('/admin/stats/entry-by-user');

// - Lock / Unlock 

// 1. Student wise - single record unlock
// password + remarks required
export const unlockSingle = (enrolmentNo, courseCode, password, remarks) =>
  api.put('/lock/unlock/single', {
    enrolmentNo,
    courseCode,
    password,
    remarks,
  });

// 2. Course wise - all course records unlock
export const unlockByCourse = (courseCode, password, remarks) =>
  api.put('/lock/unlock/course', {
    courseCode,
    password,
    remarks,
  });

// 3. Programme wise - programme + term + course unlock
export const unlockByProgramme = (
    programmeName, term, courseCode, password, remarks) =>
  api.put('/lock/unlock/programme', {
    programmeName,
    term,
    courseCode,
    password,
    remarks,
  });

// Lock summary
export const getLockSummary = (courseCode) =>
  api.get('/lock/summary', { params: { courseCode } });

// - Marks Diff (temp_raw_excel vs data_master) --------
export const getMarksDiff = (programme = '') =>
  api.get('/admin/marks-diff', { params: { programme } });

export const getMarksDiffProgrammes = () =>
  api.get('/admin/marks-diff/programmes');

// - Validation Report ---------------------
export const getValidationReport = (programme, semester) =>
  api.get('/admin/validation-report', { params: { programme, semester } });

// - Dropdowns ------------------------
export const getProgrammes          = () => api.get('/programmes');
export const getTerms               = (programme) =>
  api.get('/terms', { params: { programme } });
export const getCourseCodes         = (programme, term) =>
  api.get('/coursecodes', { params: { programme, term } });
export const getAllAvailableCourses  = () => api.get('/all-coursecodes');

// - Search & Save ----------------------
export const searchMarks = (params) =>
  api.get('/search', {
    params: {
      programme:    params.programme    || '',
      term:         params.term         || '',
      courseCode:   params.courseCode   || '',
      allProgramme: params.allProgramme || false,
    },
  });
export const saveMarks    = (data) => api.post('/save', data);
export const addNewRecord = (data) => api.post('/add-new', data);

export default api;