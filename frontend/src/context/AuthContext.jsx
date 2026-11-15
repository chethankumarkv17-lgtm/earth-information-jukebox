/**
 * NASA Earth Information Jukebox — Global Authentication & User Context
 * 2026 NASA Space Apps Challenge
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authService from '../services/authService'
import { isSupabaseConfigured, supabase } from '../services/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCachedUser())
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState('login') // 'login' | 'register' | 'forgot' | 'verify'

  // Saved Explorations state cache
  const [savedExplorations, setSavedExplorations] = useState([])
  const [isLoadingExplorations, setIsLoadingExplorations] = useState(false)

  // Preferences cache
  const [preferences, setPreferences] = useState(null)

  // Hydrate user session on mount
  const checkSession = useCallback(async () => {
    setIsLoading(true)
    try {
      if (authService.getToken()) {
        const profile = await authService.getProfile()
        setUser(profile)
        if (profile) {
          // Fetch initial explorations and preferences in background
          loadUserExplorations()
          loadUserPreferences()
        }
      } else {
        setUser(null)
      }
    } catch (err) {
      console.warn('Session hydration error:', err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Login handler
  const login = async (email, password) => {
    const data = await authService.login({ email, password })
    setUser(data.user)
    setIsAuthModalOpen(false)
    loadUserExplorations()
    loadUserPreferences()
    return data.user
  }

  // Register handler
  const register = async (email, password, fullName) => {
    const data = await authService.register({ email, password, full_name: fullName })
    setUser(data.user)
    setIsAuthModalOpen(false)
    loadUserExplorations()
    loadUserPreferences()
    return data.user
  }

  // Logout handler
  const logout = async () => {
    await authService.logout()
    setUser(null)
    setSavedExplorations([])
    setPreferences(null)
  }

  // Modal helpers
  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  // Saved Explorations Helpers
  const loadUserExplorations = async () => {
    if (!authService.getToken()) return
    setIsLoadingExplorations(true)
    try {
      const data = await authService.getSavedExplorations()
      setSavedExplorations(data.explorations || [])
    } catch (err) {
      console.warn('Could not load user explorations:', err)
    } finally {
      setIsLoadingExplorations(false)
    }
  }

  const saveExploration = async (explorationData) => {
    if (!user) {
      openAuthModal('login')
      throw new Error('Please sign in or create an account to save your exploration.')
    }
    const created = await authService.saveExploration(explorationData)
    setSavedExplorations(prev => [created, ...prev])
    return created
  }

  const deleteExploration = async (expId) => {
    await authService.deleteExploration(expId)
    setSavedExplorations(prev => prev.filter(e => e.id !== expId))
  }

  // Preferences Helpers
  const loadUserPreferences = async () => {
    if (!authService.getToken()) return
    try {
      const prefs = await authService.getPreferences()
      setPreferences(prefs)
    } catch (err) {
      console.warn('Could not load preferences:', err)
    }
  }

  const updatePreferences = async (newPrefs) => {
    if (!user) return
    const saved = await authService.updatePreferences(newPrefs)
    setPreferences(saved)
    return saved
  }

  const role = user?.role || 'guest'
  const isAuthenticated = Boolean(user)
  const isAdmin = role === 'admin'
  const isGuest = !isAuthenticated

  const value = {
    user,
    role,
    isAuthenticated,
    isAdmin,
    isGuest,
    isLoading,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
    savedExplorations,
    isLoadingExplorations,
    fetchSavedExplorations: loadUserExplorations,
    saveExploration,
    deleteExploration,
    preferences,
    updatePreferences,
    isSupabaseConfigured,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
