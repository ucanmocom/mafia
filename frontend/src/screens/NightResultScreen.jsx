import { useLanguage } from '../contexts/LanguageContext'

export default function NightResultScreen({ state }) {
  const { t } = useLanguage()
  const { nightResult } = state

  if (!nightResult) {
    return (
      <div className="screen">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌅</div>
          <h2>{t.nightResult.dawnApproaches}</h2>
        </div>
      </div>
    )
  }

  const noKill = !nightResult.killedNick
  const { loverKilledNick } = nightResult

  return (
    <div className="screen">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {noKill ? '🌅' : '💀'}
        </div>
        <h2 style={{ marginBottom: '0.75rem' }}>
          {noKill ? t.nightResult.noDead : t.nightResult.victim}
        </h2>
        {noKill ? (
          <p style={{ color: 'var(--green)', fontSize: '1.1rem', fontWeight: 600 }}>
            {t.nightResult.doctorSaved}
          </p>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {t.nightResult.diedLastNight}
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--red-bright)' }}>
              {nightResult.killedNick}
            </p>
          </>
        )}

        {loverKilledNick && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            background: 'rgba(69,12,10,0.35)',
            border: '1px solid rgba(122,24,18,0.5)',
          }}>
            <p style={{ color: '#ff6090', fontWeight: 700, marginBottom: '0.25rem' }}>
              {t.nightResult.deathFromLove}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong style={{ color: 'var(--text)' }}>{loverKilledNick}</strong> {t.nightResult.diedOfGrief}
            </p>
          </div>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1.5rem' }}>
          {t.nightResult.discussionSoon}
        </p>
      </div>
    </div>
  )
}

