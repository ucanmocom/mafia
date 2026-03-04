import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const ROLE_EMOJI = {
  mafia:     '🔪',
  doctor:    '💊',
  detective: '🔍',
  villager:  '🏘️',
}

export default function RoleRevealScreen({ state }) {
  const { t } = useLanguage()
  const ROLE_LABEL = t.roles
  const { role, roleDescription, mafiaAllies, loverNick } = state
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="screen">
      <div className="card" style={{ textAlign: 'center' }}>
        <p className="label-cap" style={{ marginBottom: '20px' }}>{t.roleReveal.yourRole}</p>

        <div style={{
          fontSize: '4rem',
          marginBottom: '16px',
          transition: 'transform 0.4s, opacity 0.4s',
          transform: revealed ? 'scale(1)' : 'scale(0.5)',
          opacity: revealed ? 1 : 0,
        }}>
          {ROLE_EMOJI[role] || '❓'}
        </div>

        <div className={`role-badge role-${role}`} style={{ fontSize: '1.1rem', padding: '6px 18px', marginBottom: '12px' }}>
          {ROLE_LABEL[role] || role}
        </div>

        <p style={{ marginBottom: '20px', lineHeight: 1.6 }}>
          {t.roleDesc[role] || roleDescription}
        </p>

        {mafiaAllies && mafiaAllies.length > 0 && (
          <div style={{ marginTop: '8px', marginBottom: '12px' }}>
            <p className="label-cap" style={{ marginBottom: '10px', color: 'var(--red-bright)' }}>{t.roleReveal.allies}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mafiaAllies.map(a => (
                <div key={a.id} className="player-row">
                  <div className="avatar" style={{ background: 'rgba(122,24,18,0.25)' }}>{a.nick[0].toUpperCase()}</div>
                  <span>{a.nick}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loverNick && (
          <div style={{
            background: 'rgba(69,12,10,0.35)',
            border: '1px solid rgba(122,24,18,0.5)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            marginTop: '8px',
            textAlign: 'left',
          }}>
            <p style={{ color: '#e06080', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              {t.roleReveal.inLove}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '12px', lineHeight: 1.5 }}>
              {t.roleReveal.loverDesc.split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </p>
            <div className="player-row" style={{ borderColor: 'rgba(122,24,18,0.45)' }}>
              <div className="avatar">{loverNick[0].toUpperCase()}</div>
              <span>💖 {loverNick}</span>
            </div>
          </div>
        )}

        <p className="label-cap" style={{ marginTop: '20px' }}>
          {t.roleReveal.remember}
        </p>
      </div>
    </div>
  )
}
