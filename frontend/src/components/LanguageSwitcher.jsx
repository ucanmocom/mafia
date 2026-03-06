import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { LANGUAGES } from '../i18n/translations'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 24,
        left: 24,
        zIndex: 1100,
        userSelect: 'none',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        title="Switch language"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(12,8,8,0.88)',
          border: '1px solid rgba(139,26,22,0.45)',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          color: '#8B1A16',
          fontSize: '0.9rem',
          fontWeight: 700,
          backdropFilter: 'blur(6px)',
          transition: 'border-color .15s, color .15s, background .15s',
          letterSpacing: '0.04em',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B1A16'; e.currentTarget.style.background = 'rgba(139,26,22,0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,26,22,0.45)'; e.currentTarget.style.background = 'rgba(12,8,8,0.88)' }}
      >
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="6" stroke="#8B1A16" strokeWidth="1.2"/>
          <ellipse cx="7" cy="7" rx="2.6" ry="6" stroke="#8B1A16" strokeWidth="1.2"/>
          <line x1="1" y1="7" x2="13" y2="7" stroke="#8B1A16" strokeWidth="1.2"/>
          <path d="M2 4h10M2 10h10" stroke="#8B1A16" strokeWidth="1.2"/>
        </svg>
        <span>{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          minWidth: '120px',
          boxShadow: '0 8px 24px #00000055',
          animation: 'slideUp .12s ease',
        }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                background: l.code === lang ? 'var(--surface2)' : 'none',
                border: 'none',
                padding: '10px 14px',
                cursor: 'pointer',
                color: l.code === lang ? 'var(--text)' : 'var(--text-muted)',
                fontSize: '0.95rem',
                fontWeight: l.code === lang ? 700 : 500,
                textAlign: 'left',
                transition: 'background .1s',
              }}
              onMouseEnter={e => { if (l.code !== lang) e.currentTarget.style.background = 'var(--surface2)' }}
              onMouseLeave={e => { if (l.code !== lang) e.currentTarget.style.background = 'none' }}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{l.label}</span>
              {l.code === lang && (
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.7rem' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
