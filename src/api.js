// API client — calls the Express backend
const API_BASE = 'https://yakshanidhi.onrender.com/api';

function getToken() {
  return localStorage.getItem('yn_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password, displayName) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email, code, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  getUsers: () => request('/auth/users'),
  toggleRole: (uid) => request(`/auth/users/${uid}/role`, { method: 'PATCH' }),

  // Events
  getApprovedEvents: () => request('/events'),
  getEventById: (id) => request(`/events/${id}`),
  getAllEvents: (status) => request(`/events/all${status ? `?status=${status}` : ''}`),
  createEvent: (data) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) => request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  approveEvent: (id) => request(`/events/${id}/approve`, { method: 'POST' }),
  rejectEvent: (id, reason) => request(`/events/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  revertToPending: (id) => request(`/events/${id}/pending`, { method: 'POST' }),

  // Upload
  uploadPosters: async (files) => {
    const formData = new FormData();
    files.forEach(f => formData.append('posters', f));
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.urls;
  },
};
