/**
 * NASA Earth Information Jukebox — Theme Context & Design Token Manager
 * 2026 NASA Space Apps Challenge
 * 
 * Provides:
 * - Theme selection: 'dark' | 'light' | 'system'
 * - System media query preference tracking
 * - Synchronized documentElement class switching (.dark / .light)
 * - Persistent local storage state
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

const THEME_STORAGE_KEY = 'earth_jukebox_theme'

const ThemeContext = createContext({
  theme: 'dark',
  effectiveTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {}
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored && ['dark', 'light', 'system'].includes(stored)) {
        return stored
      }
    } catch {
      // ignore
    }
    return 'dark'
  })

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return true
  })

  // Listen to system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => setSystemIsDark(e.matches)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const effectiveTheme = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme

  // Apply theme class to documentElement
  useEffect(() => {
    const root = document.documentElement
    if (effectiveTheme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
      root.style.colorScheme = 'light'
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    }
  }, [effectiveTheme])

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {
      // ignore
    }
  }

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('system')
    } else {
      setTheme('dark')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export default ThemeContext
