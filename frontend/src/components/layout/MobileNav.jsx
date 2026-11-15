import React from 'react'
import { Globe2, Thermometer, Satellite, Sliders, History, Accessibility, Split, Compass } from 'lucide-react'

/**
 * Mobile Bottom Quick Bar for Smartphones & Compact Tablets
 */
export default function MobileNav({
  activeTab = 'explore',
  onTabChange,
  onToggleInspector,
  isInspectorOpen,
}) {
  const tabs = [
    { id: 'explore', label: 'Explorer', icon: Globe2 },
    { id: 'studio', label: 'Studio', icon: Sliders },
    { id: 'datasets', label: 'Datasets', icon: Satellite },
    { id: 'journey', label: 'Journey', icon: Compass },
    { id: 'climate', label: 'Climate', icon: Thermometer },
    { id: 'accessibility', label: 'A11y', icon: Accessibility },
  ]

  return (
    <nav
      role="navigation"
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-panel-elevated border-t border-cyan-500/30 bg-slate-950/95 backdrop-blur-2xl px-1 py-1 flex justify-around items-center h-14 shadow-2xl"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`${tab.label} View`}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[9px] font-mono transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none ${
              isActive
                ? 'text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 mb-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="truncate">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
