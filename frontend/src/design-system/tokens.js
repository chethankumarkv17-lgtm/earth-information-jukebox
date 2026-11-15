/**
 * EARTH JUKEBOX — Design System Tokens
 * 
 * NASA Scientific Visualization × Pro-Audio Production Hardware
 */

export const tokens = {
  name: "Earth Jukebox Design System",
  version: "1.0.0",
  
  // Color Palette Tokens
  colors: {
    space: {
      void: "#02040a",      // Deepest cosmic vacuum
      obsidian: "#040816",  // Primary application backdrop
      navyDeep: "#070e24",  // Panel surface default
      navyMedium: "#0b1638",// Elevated containers
      navyLight: "#12204d", // Border & divider highlights
    },
    earth: {
      oceanDeep: "#0369a1", // Hydrospheric primary
      oceanCyan: "#06b6d4", // Troposphere & telemetry cyan
      oceanSky: "#38bdf8",  // Bright data accents
      bioEmerald: "#10b981",// Biosphere NDVI & life index
      bioMint: "#34d399",   // Photosynthetic vibrancy
    },
    scientific: {
      solarAmber: "#f59e0b",// Solar radiation / thermal flux
      auroraViolet: "#8b5cf6",// Magnetosphere & solar wind
      signalRed: "#ef4444", // Audio peak clipping warning
      telemetryMuted: "#64748b",// Secondary telemetry text
    },
    text: {
      primary: "#f8fafc",   // High-contrast primary headings
      secondary: "#cbd5e1", // Body copy and labels
      muted: "#94a3b8",     // Telemetry descriptors
      ghost: "#64748b",     // Timestamps & disabled states
    }
  },

  // Typography Specifications
  typography: {
    fontFamilies: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    scale: {
      display: "text-3xl md:text-4xl lg:text-5xl font-black tracking-tight",
      h1: "text-2xl md:text-3xl font-extrabold tracking-tight",
      h2: "text-xl md:text-2xl font-bold tracking-normal",
      h3: "text-base md:text-lg font-semibold tracking-wide",
      body: "text-sm leading-relaxed text-slate-300",
      telemetry: "font-mono text-xs uppercase tracking-widest text-cyan-400/90",
      telemetryTiny: "font-mono text-[10px] uppercase tracking-wider text-slate-400",
    }
  },

  // Glassmorphism System
  glass: {
    surfaceSubtle: "bg-slate-900/40 backdrop-blur-md border border-white/5",
    surfaceStandard: "bg-slate-900/60 backdrop-blur-xl border border-cyan-500/15 shadow-xl shadow-black/40",
    surfaceElevated: "bg-slate-850/80 backdrop-blur-2xl border border-cyan-400/25 shadow-2xl shadow-black/60",
    surfaceActive: "bg-cyan-950/40 backdrop-blur-xl border border-cyan-400/40 shadow-[0_0_20px_-3px_rgba(6,182,212,0.25)]",
  },

  // Motion Transitions
  transitions: {
    subtle: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
    smooth: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    spring: { type: "spring", stiffness: 350, damping: 25 },
  }
};
