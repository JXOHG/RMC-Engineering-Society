const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Thin fetch wrapper. Attaches the stored JWT (if any) and throws
 * an Error with the server's message on non-2xx responses so callers
 * can just try/catch.
 */
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = localStorage.getItem('rmc_token')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong. Please try again.')
    err.code = data.code
    throw err
  }

  return data
}

/**
 * Like request(), but for FormData bodies (photo uploads). No
 * Content-Type header here on purpose — the browser sets it (with the
 * multipart boundary) automatically when the body is a FormData.
 */
async function requestForm(path, { method = 'POST', formData, auth = true } = {}) {
  const headers = {}

  if (auth) {
    const token = localStorage.getItem('rmc_token')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: formData })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.')
  }

  return data
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: { token } }),
  resendVerification: (email) => request('/auth/resend-verification', { method: 'POST', body: { email } }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: payload }),

  // Stories
  getStories: () => request('/stories'),
  getStory: (id) => request(`/stories/${id}`),
  getMyStories: () => request('/stories/mine/all', { auth: true }),
  // FormData bodies so an optional cover image file can travel alongside
  // the text fields (see StoryEditor.jsx).
  createStory: (formData) => requestForm('/stories', { method: 'POST', formData }),
  updateStory: (id, formData) => requestForm(`/stories/${id}`, { method: 'PUT', formData }),
  deleteStory: (id) => request(`/stories/${id}`, { method: 'DELETE', auth: true }),

  // Team page
  getTeam: () => request('/team'),
  createTeamMember: (formData) => requestForm('/team', { method: 'POST', formData }),
  updateTeamMember: (id, formData) => requestForm(`/team/${id}`, { method: 'PUT', formData }),
  deleteTeamMember: (id) => request(`/team/${id}`, { method: 'DELETE', auth: true }),

  // Events page
  getEvents: () => request('/events'),
  // FormData bodies so an optional photo file can travel alongside the
  // text fields (see Events.jsx).
  createEvent: (formData) => requestForm('/events', { method: 'POST', formData }),
  updateEvent: (id, formData) => requestForm(`/events/${id}`, { method: 'PUT', formData }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE', auth: true }),

  // Admin access
  getMembers: () => request('/admin/members', { auth: true }),
  promoteMember: (uid) => request(`/admin/members/${uid}/promote`, { method: 'POST', auth: true }),
  demoteMember: (uid) => request(`/admin/members/${uid}/demote`, { method: 'POST', auth: true }),

  // Event archive (admin only) — folders + links, no file uploads.
  getArchiveFolders: () => request('/archive/folders', { auth: true }),
  createArchiveFolder: (payload) =>
    request('/archive/folders', { method: 'POST', body: payload, auth: true }),
  updateArchiveFolder: (id, payload) =>
    request(`/archive/folders/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteArchiveFolder: (id) => request(`/archive/folders/${id}`, { method: 'DELETE', auth: true }),

  getArchiveLinks: () => request('/archive/links', { auth: true }),
  createArchiveLink: (payload) =>
    request('/archive/links', { method: 'POST', body: payload, auth: true }),
  updateArchiveLink: (id, payload) =>
    request(`/archive/links/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteArchiveLink: (id) => request(`/archive/links/${id}`, { method: 'DELETE', auth: true }),
}
