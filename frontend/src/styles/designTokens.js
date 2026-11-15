/**
 * NASA Earth Information Jukebox — Global Design System Tokens
 * 2026 NASA Space Apps Challenge
 * 
 * Aesthetic Direction:
 * - Apple Human Interface Design principles
 * - NASA Scientific Mission Visualization Systems
 * - High-End Pro Audio & Synthesizer Workstations
 * - Precision Glassmorphism with Optical Depth
 */

export const DESIGN_TOKENS = {
  // 1. Color Palette & Functional Tones
  colors: {
    dark: {
      bgPrimary: '#040816',
      bgSecondary: '#081026',
      bgTertiary: '#0d1838',
      surfaceGlass: 'rgba(8, 15, 35, 0.72)',
      surfaceGlassSubtle: 'rgba(6, 11, 28, 0.50)',
      surfaceGlassElevated: 'rgba(10, 20, 48, 0.88)',
      surfaceCard: 'rgba(12, 22, 52, 0.65)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      borderSubtle: 'rgba(56, 189, 248, 0.12)',
      borderMedium: 'rgba(56, 189, 248, 0.24)',
      borderFocus: '#06b6d4',
    },
    light: {
      bgPrimary: '#f8fafc',
      bgSecondary: '#f1f5f9',
      bgTertiary: '#e2e8f0',
      surfaceGlass: 'rgba(255, 255, 255, 0.85)',
      surfaceGlassSubtle: 'rgba(248, 250, 252, 0.75)',
      surfaceGlassElevated: 'rgba(255, 255, 255, 0.95)',
      surfaceCard: 'rgba(255, 255, 255, 0.88)',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      borderSubtle: 'rgba(148, 163, 184, 0.28)',
      borderMedium: 'rgba(148, 163, 184, 0.45)',
      borderFocus: '#0891b2',
    },
    accents: {
      cyan: {
        light: '#0891b2',
        dark: '#22d3ee',
        glow: 'rgba(6, 182, 212, 0.25)',
      },
      emerald: {
        light: '#059669',
        dark: '#34d399',
        glow: 'rgba(16, 185, 129, 0.20)',
      },
      sky: {
        light: '#0284c7',
        dark: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.20)',
      },
      amber: {
        light: '#d97706',
        dark: '#fbbf24',
        glow: 'rgba(245, 158, 11, 0.20)',
      },
      rose: {
        light: '#e11d48',
        dark: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.20)',
      },
    },
  },

  // 2. Typography Scale
  typography: {
    fontFamilies: {
      sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      mono: '"SF Mono", "JetBrains Mono", "Fira Code", Menlo, monospace',
    },
    scales: {
      display: 'text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight',
      h1: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
      h2: 'text-2xl sm:text-3xl font-bold tracking-tight',
      h3: 'text-xl sm:text-2xl font-bold tracking-tight',
      h4: 'text-lg font-semibold tracking-tight',
      body: 'text-sm sm:text-base leading-relaxed',
      caption: 'text-xs leading-normal',
      monoTelemetry: 'font-mono text-xs tracking-wider uppercase',
      monoMicro: 'font-mono text-[10px] tracking-widest uppercase',
    },
  },

  // 3. Spacing System (4px base)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  // 4. Border Radius (Apple Curvature)
  radius: {
    sm: 'rounded-md',     // 6px
    md: 'rounded-xl',     // 12px
    lg: 'rounded-2xl',    // 16px
    xl: 'rounded-3xl',    // 24px
    full: 'rounded-full', // 9999px
  },

  // 5. Shadows & Elevation
  shadows: {
    subtle: '0 4px 16px -2px rgba(0, 0, 0, 0.35)',
    elevated: '0 12px 32px -4px rgba(0, 0, 0, 0.55)',
    modal: '0 24px 64px -12px rgba(0, 0, 0, 0.75)',
    glowCyan: '0 0 24px -4px rgba(6, 182, 212, 0.28)',
  },

  // 6. Animation Durations & Curves
  animation: {
    fast: 0.15,
    standard: 0.25,
    smooth: 0.40,
    atmospheric: 0.70,
    curves: {
      appleEase: [0.16, 1, 0.3, 1], // Apple spring curve
      sharp: [0.4, 0, 0.2, 1],
    },
  },

  // 7. Glassmorphism Tokens
  glass: {
    base: 'backdrop-blur-xl bg-slate-950/70 border border-cyan-500/15 shadow-xl',
    elevated: 'backdrop-blur-2xl bg-slate-900/80 border border-cyan-500/25 shadow-2xl',
    subtle: 'backdrop-blur-md bg-slate-950/40 border border-white/5',
  },
}

export default DESIGN_TOKENS
