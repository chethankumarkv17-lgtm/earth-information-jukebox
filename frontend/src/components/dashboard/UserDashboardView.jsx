/**
 * NASA Earth Information Jukebox — User Profile & Protected Dashboard View
 * 2026 NASA Space Apps Challenge
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Shield,
  ShieldAlert,
  Compass,
  Bookmark,
  Sliders,
  Settings,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
  Sparkles,
  Volume2,
  Gauge,
  Eye,
  FileJson,
  Layers,
  MapPin
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import authService from '../../services/authService'
import { exportExplorationBundle } from '../../services/shareService'

export default function UserDashboardView({ onNavigate }) {
  const {
    user,
    role,
    isAdmin,
    logout,
    savedExplorations,
    isLoadingExplorations,
    fetchSavedExplorations,
    deleteExploration,
    preferences,
    updatePreferences,
  } = useAuth()

  const [activeTab, setActiveTab] = useState('saved') // 'saved' | 'preferences' | 'profile' | 'admin'
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [bio, setBio] = useState(user?.bio || '')

  // Preferences Form State
  const [defaultPreset, setDefaultPreset] = useState(preferences?.default_preset || 'scientific_analytic')
  const [masterVolume, setMasterVolume] = useState(preferences?.master_volume ?? 0.8)
  const [playbackSpeed, setPlaybackSpeed] = useState(preferences?.playback_speed ?? 1.0)
  const [highContrastDefault, setHighContrastDefault] = useState(preferences?.high_contrast_default ?? false)
  const [guidedModeDefault, setGuidedModeDefault] = useState(preferences?.guided_mode_default ?? false)
  const [audioDescriptionsEnabled, setAudioDescriptionsEnabled] = useState(preferences?.audio_descriptions_enabled ?? true)

  // Admin State
  const [adminUsers, setAdminUsers] = useState([])
  const [adminStats, setAdminStats] = useState(null)
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false)

  // Sync state when user or preferences load
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setAvatarUrl(user.avatar_url || '')
      setBio(user.bio || '')
    }
  }, [user])

  useEffect(() => {
    if (preferences) {
      setDefaultPreset(preferences.default_preset || 'scientific_analytic')
      setMasterVolume(preferences.master_volume ?? 0.8)
      setPlaybackSpeed(preferences.playback_speed ?? 1.0)
      setHighContrastDefault(preferences.high_contrast_default ?? false)
      setGuidedModeDefault(preferences.guided_mode_default ?? false)
      setAudioDescriptionsEnabled(preferences.audio_descriptions_enabled ?? true)
    }
  }, [preferences])

  // Load Admin stats if admin tab selected
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      loadAdminDashboard()
    }
  }, [activeTab, isAdmin])

  const loadAdminDashboard = async () => {
    setIsLoadingAdmin(true)
    try {
      const [usersData, statsData] = await Promise.all([
        authService.getAdminUsers(),
        authService.getAdminStats(),
      ])
      setAdminUsers(usersData.users || [])
      setAdminStats(statsData)
    } catch (err) {
      setErrorMessage(err.message || 'Could not load admin controls.')
    } finally {
      setIsLoadingAdmin(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setStatusMessage('')
    setErrorMessage('')
    try {
      await authService.updateProfile({ full_name: fullName, avatar_url: avatarUrl, bio })
      setStatusMessage('Profile updated successfully.')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setStatusMessage('')
    setErrorMessage('')
    try {
      await updatePreferences({
        default_preset: defaultPreset,
        master_volume: masterVolume,
        playback_speed: playbackSpeed,
        high_contrast_default: highContrastDefault,
        guided_mode_default: guidedModeDefault,
        audio_descriptions_enabled: audioDescriptionsEnabled,
      })
      setStatusMessage('Sonification preferences saved successfully.')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save preferences.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await authService.updateUserRole(targetUserId, newRole)
      setAdminUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u))
      setStatusMessage(`User role updated to '${newRole}'.`)
    } catch (err) {
      setErrorMessage(err.message || 'Could not update role.')
    }
  }

  const handleAdminDeleteUser = async (targetUserId) => {
    if (!window.confirm(`Are you sure you want to permanently remove user '${targetUserId}'?`)) return
    try {
      await authService.deleteUser(targetUserId)
      setAdminUsers(prev => prev.filter(u => u.id !== targetUserId))
      setStatusMessage('User permanently removed.')
    } catch (err) {
      setErrorMessage(err.message || 'Could not remove user.')
    }
  }

  const handleDeleteSelfAccount = async () => {
    const confirmation = window.prompt(
      "Type 'DELETE' to permanently delete your account and all saved explorations:"
    )
    if (confirmation === 'DELETE') {
      try {
        await authService.deleteAccount()
        window.location.hash = 'home'
      } catch (err) {
        setErrorMessage(err.message || 'Failed to delete account.')
      }
    }
  }

  const handleLoadExploration = (exp) => {
    const targetRoute = exp.mode === 'compare_location' || exp.mode === 'compare_dataset'
      ? 'compare'
      : exp.mode === 'journey'
      ? 'journey'
      : exp.mode === 'timemachine'
      ? 'timemachine'
      : 'explore'

    const queryParams = new URLSearchParams()
    if (exp.location_id) queryParams.set('loc', exp.location_id)
    if (exp.dataset_id) queryParams.set('ds', exp.dataset_id)
    if (exp.comparison_location_id) queryParams.set('compLoc', exp.comparison_location_id)
    if (exp.comparison_dataset_id) queryParams.set('compDs', exp.comparison_dataset_id)
    if (exp.sonification_preset) queryParams.set('preset', exp.sonification_preset)
    if (exp.playback_speed) queryParams.set('spd', exp.playback_speed.toString())
    if (exp.date_selected) queryParams.set('date', exp.date_selected)

    window.location.hash = `${targetRoute}?${queryParams.toString()}`
  }

  return (
    <div className="space-y-8 py-4 max-w-7xl mx-auto">
      {/* User Identity Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'User avatar'}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-500/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-500/20">
                {(user?.full_name || user?.email || 'E')[0].toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-slate-800">
              {isAdmin ? (
                <Shield className="w-4 h-4 text-amber-400" />
              ) : (
                <User className="w-4 h-4 text-cyan-400" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-wide">
                {user?.full_name || 'NASA Earth Explorer'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {isAdmin ? 'Flight Director (Admin)' : 'Registered Explorer'}
              </span>
            </div>

            <p className="text-sm font-mono text-slate-400 mt-1">
              {user?.email}
            </p>

            {user?.bio && (
              <p className="text-xs text-slate-300 mt-2 max-w-xl italic">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-8 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('saved'); setStatusMessage(''); setErrorMessage(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>SAVED EXPLORATIONS</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/40 text-[10px]">
            {savedExplorations.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('preferences'); setStatusMessage(''); setErrorMessage(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'preferences'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>SONIFICATION PREFERENCES</span>
        </button>

        <button
          onClick={() => { setActiveTab('profile'); setStatusMessage(''); setErrorMessage(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>PROFILE SETTINGS</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => { setActiveTab('admin'); setStatusMessage(''); setErrorMessage(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>ADMIN CONSOLE</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab 1: Saved Explorations */}
      {activeTab === 'saved' && (
        <div>
          {isLoadingExplorations ? (
            <div className="p-12 text-center text-slate-400 font-mono flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span>RETRIEVING SAVED EXPLORATIONS...</span>
            </div>
          ) : savedExplorations.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center">
              <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Saved Explorations Yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                When exploring the 3D Globe, Synchronized Dashboard, or Comparative Hub, click the "Save Exploration" button to bookmark and sonify it anytime.
              </p>
              <button
                onClick={() => window.location.hash = 'explore'}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold font-mono text-xs hover:bg-cyan-400 transition-all"
              >
                OPEN SYNCHRONIZED EXPLORER
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedExplorations.map((exp) => (
                <div
                  key={exp.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {exp.mode?.replace('_', ' ') || 'EXPLORE'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">
                      {exp.title}
                    </h3>

                    {exp.description && (
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                        {exp.description}
                      </p>
                    )}

                    <div className="space-y-1.5 py-3 border-y border-slate-800/80 my-3 text-xs font-mono text-slate-300">
                      {exp.location_id && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="truncate">{exp.location_id.replace('_', ' ')}</span>
                        </div>
                      )}
                      {exp.dataset_id && (
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-blue-400" />
                          <span className="truncate">{exp.dataset_id.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">{exp.sonification_preset}</span>
                      </div>
                    </div>

                    {exp.notes && (
                      <p className="text-[11px] font-mono text-slate-400 italic bg-slate-950/50 p-2 rounded-lg mb-3">
                        "{exp.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleLoadExploration(exp)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>LOAD</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => exportExplorationBundle(exp)}
                        title="Download Reproducible JSON Bundle"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteExploration(exp.id)}
                        title="Delete Saved Exploration"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sonification Preferences */}
      {activeTab === 'preferences' && (
        <div className="max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>DEFAULT SONIFICATION & ACCESSIBILITY PROFILE</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mb-6">
            Configure your preferred starting audio acoustics and accessibility defaults when loading observations.
          </p>

          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2">
                DEFAULT ACOUSTIC PRESET
              </label>
              <select
                value={defaultPreset}
                onChange={(e) => setDefaultPreset(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="scientific_analytic">Scientific Analytic (Pure Pitch Precision)</option>
                <option value="ambient_documentary">Ambient Documentary (Storytelling Resonance)</option>
                <option value="minimal_tactile">Minimal Tactile (Screen-Reader Optimized)</option>
                <option value="cinematic_resonance">Cinematic Resonance (Dramatic Range)</option>
                <option value="binaural_spatial">Binaural Spatial (Comparative Separation)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-2 flex justify-between">
                  <span>MASTER VOLUME</span>
                  <span className="text-cyan-400">{Math.round(masterVolume * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-2 flex justify-between">
                  <span>PLAYBACK SPEED</span>
                  <span className="text-cyan-400">{playbackSpeed}x</span>
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="2.0"
                  step="0.25"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highContrastDefault}
                  onChange={(e) => setHighContrastDefault(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400"
                />
                <span className="text-xs font-mono text-slate-300">
                  Enable WCAG 2.2 AAA High-Contrast Mode by default
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guidedModeDefault}
                  onChange={(e) => setGuidedModeDefault(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400"
                />
                <span className="text-xs font-mono text-slate-300">
                  Enable Guided Audio Accessibility Banner on startup
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={audioDescriptionsEnabled}
                  onChange={(e) => setAudioDescriptionsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400"
                />
                <span className="text-xs font-mono text-slate-300">
                  Enable automatic spoken Web Speech audio descriptions
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>SAVE PREFERENCES</span>}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <span>USER PROFILE SETTINGS</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mb-6">
              Update personal information visible across NASA Space Apps collaborations.
            </p>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  DISPLAY FULL NAME
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  AVATAR IMAGE URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  BIOGRAPHY & RESEARCH FOCUS
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Atmospheric sound researcher..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>UPDATE PROFILE</span>}
              </button>
            </form>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="pt-6 border-t border-rose-500/30">
            <h3 className="text-sm font-bold text-rose-400 mb-1 font-mono uppercase">
              Danger Zone: Account Deletion
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Permanently delete your account, personal profile, and all saved explorations. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteSelfAccount}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>PERMANENTLY DELETE MY ACCOUNT</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Administrator Command Console */}
      {activeTab === 'admin' && isAdmin && (
        <div className="space-y-8">
          {/* Admin Stats HUD */}
          {adminStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Registered Users</span>
                <div className="text-2xl font-bold text-white mt-1">{adminStats.total_registered_users}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Administrators</span>
                <div className="text-2xl font-bold text-amber-300 mt-1">{adminStats.total_administrators}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Saved Explorations</span>
                <div className="text-2xl font-bold text-cyan-300 mt-1">{adminStats.total_saved_explorations}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Revoked Tokens</span>
                <div className="text-2xl font-bold text-rose-300 mt-1">{adminStats.revoked_tokens_count}</div>
              </div>
            </div>
          )}

          {/* User Management Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-mono">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>REGISTERED USER DIRECTORY & ROLE MANAGEMENT</span>
            </h2>

            {isLoadingAdmin ? (
              <div className="p-8 text-center text-slate-400 font-mono flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                <span>LOADING USERS DIRECTORY...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">USER / EMAIL</th>
                      <th className="py-2.5 px-3">ROLE</th>
                      <th className="py-2.5 px-3">VERIFIED</th>
                      <th className="py-2.5 px-3">EXPLORATIONS</th>
                      <th className="py-2.5 px-3">JOINED</th>
                      <th className="py-2.5 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-850/50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{u.full_name || 'Anonymous Explorer'}</div>
                          <div className="text-slate-400 text-[11px]">{u.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={u.role}
                            disabled={u.id === user.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                          >
                            <option value="registered">registered</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          {u.is_verified ? (
                            <span className="text-emerald-400 font-bold">YES</span>
                          ) : (
                            <span className="text-slate-500">NO</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {u.saved_explorations_count}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleAdminDeleteUser(u.id)}
                              className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
