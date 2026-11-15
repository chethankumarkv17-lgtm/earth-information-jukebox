/**
 * NASA Earth Information Jukebox — Authentication & User Data API Service
 * 2026 NASA Space Apps Challenge
 */

const TOKEN_KEY = 'earth_jukebox_token'
const USER_KEY = 'earth_jukebox_user'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

class AuthService {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY) || null
    try {
      this.cachedUser = JSON.parse(localStorage.getItem(USER_KEY)) || null
    } catch {
      this.cachedUser = null
    }
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  setSession(token, user) {
    this.token = token
    this.cachedUser = user
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }

  clearSession() {
    this.token = null
    this.cachedUser = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  getToken() {
    return this.token
  }

  getCachedUser() {
    return this.cachedUser
  }

  // =========================================================================
  // Auth Operations
  // =========================================================================
  async register({ email, password, full_name }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Registration failed.')
    }
    this.setSession(data.access_token, data.user)
    return data
  }

  async login({ email, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Invalid email or password.')
    }
    this.setSession(data.access_token, data.user)
    return data
  }

  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        })
      }
    } catch (err) {
      console.warn('Logout network error (clearing local session anyway):', err)
    } finally {
      this.clearSession()
    }
  }

  async getProfile() {
    if (!this.token) return null
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) {
      if (res.status === 401) {
        this.clearSession()
      }
      return null
    }
    const user = await res.json()
    this.setSession(this.token, user)
    return user
  }

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to update profile.')
    }
    this.setSession(this.token, data)
    return data
  }

  async verifyEmail({ email, token }) {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to verify email.')
    }
    return data
  }

  async requestPasswordReset(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to request reset.')
    }
    return data
  }

  async confirmPasswordReset({ email, token, new_password }) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, new_password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to reset password.')
    }
    return data
  }

  async deleteAccount() {
    const res = await fetch(`${API_BASE}/user/account`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to delete account.')
    }
    this.clearSession()
    return data
  }

  // =========================================================================
  // Saved Explorations (Row-Level Security)
  // =========================================================================
  async getSavedExplorations() {
    const res = await fetch(`${API_BASE}/user/explorations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) {
      throw new Error('Failed to retrieve saved explorations.')
    }
    return await res.json()
  }

  async saveExploration(explorationData) {
    const res = await fetch(`${API_BASE}/user/explorations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(explorationData),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to save exploration.')
    }
    return data
  }

  async getExploration(id) {
    const res = await fetch(`${API_BASE}/user/explorations/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to load exploration.')
    }
    return data
  }

  async updateExploration(id, updateData) {
    const res = await fetch(`${API_BASE}/user/explorations/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to update exploration.')
    }
    return data
  }

  async deleteExploration(id) {
    const res = await fetch(`${API_BASE}/user/explorations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to delete exploration.')
    }
    return data
  }

  // =========================================================================
  // User Sonification & Accessibility Preferences
  // =========================================================================
  async getPreferences() {
    const res = await fetch(`${API_BASE}/user/preferences`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) return null
    return await res.json()
  }

  async updatePreferences(preferencesData) {
    const res = await fetch(`${API_BASE}/user/preferences`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(preferencesData),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to save preferences.')
    }
    return data
  }

  // =========================================================================
  // Administrative Operations (Admin Only)
  // =========================================================================
  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Admin access forbidden.')
    }
    return data
  }

  async updateUserRole(userId, role) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to update user role.')
    }
    return data
  }

  async deleteUser(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to delete user.')
    }
    return data
  }

  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/system-stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.detail || 'Failed to fetch admin stats.')
    }
    return data
  }
}

export const authService = new AuthService()
export default authService
