/**
 * NASA Earth Information Jukebox — Supabase Client Integration
 * 2026 NASA Space Apps Challenge
 * 
 * Supports cloud Supabase Auth & PostgreSQL Row-Level Security (RLS)
 * when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are provided.
 * When unconfigured, the application gracefully falls back to the embedded
 * FastAPI SQLite security engine with zero disruption.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null
