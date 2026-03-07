import { useLanguage } from '../contexts/LanguageContext'

const PHASE_KEYS  = ['night', 'night_result', 'day', 'voting', 'vote_summary', 'vote_result']

export default function GameHUD({ state }) {
  const { t } = useLanguage()
  const { phase, players } = state
  if (!PHASE_KEYS.includes(phase)) return null

  const aliveCount = players.filter(p => p.isAlive !== false).length
  const totalCount = players.length

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(12,8,8,0.92)',
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid var(--border2)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '44px',
    }}>
      <span style={{ fontSize: '0.95rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
        <span style={{ fontWeight: 800, color: aliveCount <= 4 ? 'var(--red-bright)' : 'var(--text)' }}>{aliveCount}</span>
        /{totalCount} {t.hud.alive}
      </span>
    </div>
  )
}
