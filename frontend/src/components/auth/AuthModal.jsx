/**
 * NASA Earth Information Jukebox — Secure Authentication Modal
 * 2026 NASA Space Apps Challenge
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import authService from '../../services/authService'

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register } = useAuth()
  
  const [activeTab, setActiveTab] = useState(authModalTab || 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [demoNotice, setDemoNotice] = useState('')

  useEffect(() => {
    setActiveTab(authModalTab || 'login')
    setErrorMessage('')
    setSuccessMessage('')
    setDemoNotice('')
  }, [authModalTab, isAuthModalOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthModalOpen, closeAuthModal])

  if (!isAuthModalOpen) return null

  // Fast Demo Credentials Fillers
  const fillDemoAdmin = () => {
    setEmail('admin@nasa.spaceapps.org')
    setPassword('NasaSpaceApps2026!')
    setActiveTab('login')
    setErrorMessage('')
    setDemoNotice('Pre-filled NASA Flight Director (Administrator) credentials.')
  }

  const fillDemoExplorer = () => {
    setEmail('explorer@earthjukebox.org')
    setPassword('EarthJukebox2026!')
    setActiveTab('login')
    setErrorMessage('')
    setDemoNotice('Pre-filled Helena Vance (Registered Explorer) credentials.')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    try {
      await login(email, password)
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    try {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.')
      }
      await register(email, password, fullName)
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const res = await authService.requestPasswordReset(email)
      setSuccessMessage(res.message)
      if (res.demo_reset_token) {
        setResetToken(res.demo_reset_token)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to request reset.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetConfirmSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const res = await authService.confirmPasswordReset({
        email,
        token: resetToken,
        new_password: newPassword
      })
      setSuccessMessage(res.message)
      setTimeout(() => {
        setActiveTab('login')
      }, 1500)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmailSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const res = await authService.verifyEmail({ email, token: verifyToken })
      setSuccessMessage(res.message)
      setTimeout(() => {
        closeAuthModal()
      }, 1500)
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden text-slate-100 p-6 md:p-8"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-cyan-400"
          aria-label="Close authentication dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-xl font-bold tracking-wider text-white">
              EARTH JUKEBOX AUTH
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              SECURE EXPLORATION ACCESS & TELEMETRY
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-6 bg-slate-950/70 border border-slate-800 rounded-xl">
          <button
            onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono"
            >
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {demoNotice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 p-2.5 mb-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono"
            >
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>{demoNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="explorer@nasa.gov"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-slate-300">
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO EARTH JUKEBOX</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Register */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                FULL NAME
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Katherine Johnson"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="katherine@nasa.gov"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                CREATE PASSWORD (MIN 8 CHARACTERS)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <>
                  <span>CREATE EXPLORER ACCOUNT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Forgot Password */}
        {activeTab === 'forgot' && (
          <div className="space-y-4">
            {!resetToken ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  Enter your email address to receive a secure time-bounded password reset token.
                </p>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    ACCOUNT EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="explorer@nasa.gov"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>DISPATCH RESET TOKEN</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetConfirmSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    RESET SECURITY TOKEN
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    NEW PASSWORD (MIN 8 CHARS)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-sm font-mono text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>UPDATE PASSWORD</span>}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="w-full text-center text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors pt-2"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Demo Fast-Login Section */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>NASA Space Apps Judge Evaluation Shortcuts:</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/50 border border-cyan-500/20 text-left transition-all group"
            >
              <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                Flight Director
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                admin@nasa.spaceapps.org
              </div>
              <div className="text-[9px] text-amber-400/80 font-mono mt-0.5">
                Role: Administrator
              </div>
            </button>

            <button
              type="button"
              onClick={fillDemoExplorer}
              className="p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/50 border border-cyan-500/20 text-left transition-all group"
            >
              <div className="text-xs font-bold text-blue-300 group-hover:text-blue-200">
                Helena Vance
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                explorer@earthjukebox.org
              </div>
              <div className="text-[9px] text-blue-400/80 font-mono mt-0.5">
                Role: Registered User
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
