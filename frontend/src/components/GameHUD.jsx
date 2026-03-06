import { useLanguage } from '../contexts/LanguageContext'

const ROLE_EMOJI  = { mafia: '🔪', doctor: '💊', detective: '🔍', villager: '🏘️' }
const ROLE_CLASS  = { mafia: 'role-mafia', doctor: 'role-doctor', detective: 'role-detective', villager: 'role-villager' }
const PHASE_KEYS  = ['night', 'night_result', 'day', 'voting', 'vote_summary', 'vote_result']

export default function GameHUD({ state }) {
  const { t } = useLanguage()
  const { phase, role, players, playerId, round, loverNick, mafiaAllies } = state
  if (!PHASE_KEYS.includes(phase)) return null

  const label = t.phases[phase] || phase
  const ROLE_LABEL = t.roles
  const aliveCount = players.filter(p => p.isAlive !== false).length
  const totalCount = players.length
  const myPlayer   = players.find(p => p.id === playerId)
  const isAlive    = myPlayer ? myPlayer.isAlive !== false : true

  const sep = (
    <span style={{ color: 'var(--border2)', fontSize: '0.8rem', userSelect: 'none', fontWeight: 300 }}>│</span>
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(12,8,8,0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border2)',
      padding: '8px 16px 8px 52px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
      minHeight: '44px',
    }}>

      {/* Phase label */}
      <span style={{
        fontWeight: 700,
        fontSize: '0.72rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text)',
      }}>
        {label}
      </span>

      {round > 0 && (
        <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          R{round}
        </span>
      )}

      {sep}

      {/* Alive count */}
      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
        <span style={{ fontWeight: 700, color: aliveCount <= 4 ? 'var(--red-bright)' : 'var(--text)' }}>{aliveCount}</span>
        /{totalCount} {t.hud.alive}
      </span>

      {sep}

      {/* Role */}
      {role && (
        <span className={`role-badge ${ROLE_CLASS[role] || 'role-villager'}`} style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
          {ROLE_EMOJI[role]} {ROLE_LABEL[role] || role}
        </span>
      )}

      {/* Mafia allies count */}
      {role === 'mafia' && mafiaAllies && mafiaAllies.length > 0 && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          +<span style={{ color: 'var(--red-bright)', fontWeight: 700 }}>{mafiaAllies.length}</span>
        </span>
      )}

      {/* Lover */}
      {loverNick && (
        <>
          {sep}
          <span style={{ fontSize: '0.75rem', color: '#e06080', fontWeight: 600 }}>
            💕 {loverNick}
          </span>
        </>
      )}

      {/* Dead indicator */}
      {!isAlive && (
        <>
          {sep}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.05em' }}>
            {t.hud.spectating}
          </span>
        </>
      )}
    </div>
  )
}
