import { useLanguage } from '../contexts/LanguageContext'

export default function VoteResultScreen({ state }) {
  const { t } = useLanguage()
  const ROLE_LABEL = t.roles
  const { voteResult } = state

  if (!voteResult) {
    return (
      <div className="screen">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>{t.voteResult.counting}</h2>
        </div>
      </div>
    )
  }

  const { eliminatedNick, eliminatedId, role, tie, tally, loverEliminatedNick, loverEliminatedRole } = voteResult
  const tallyEntries = tally ? Object.entries(tally) : []
  const totalVotes   = tallyEntries.reduce((acc, [, v]) => acc + v, 0)

  return (
    <div className="screen">
      <div className="card" style={{ textAlign: 'center' }}>
        {tie ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
            <h2 style={{ marginBottom: '0.5rem' }}>{t.voteResult.tie}</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {t.voteResult.tieDesc}
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🗳️</div>
            <h2 style={{ marginBottom: '0.5rem' }}>{t.voteResult.eliminated}</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {eliminatedNick}
            </p>
            <span className={`role-badge role-${role}`}>
              {ROLE_LABEL[role] || role}
            </span>

            {loverEliminatedNick && (
              <div style={{
                marginTop: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                background: 'rgba(69,12,10,0.35)',
                border: '1px solid rgba(122,24,18,0.5)',
              }}>
                <p style={{ color: '#ff6090', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {t.voteResult.deathFromLove}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--text)' }}>{loverEliminatedNick}</strong> {t.voteResult.diedOfGrief}
                </p>
                {loverEliminatedRole && (
                  <span className={`role-badge role-${loverEliminatedRole}`} style={{ marginTop: '0.5rem' }}>
                    {ROLE_LABEL[loverEliminatedRole] || loverEliminatedRole}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {tallyEntries.length > 0 && (
          <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
            <div className="divider">{t.voteResult.votingResults}</div>
            {tallyEntries.map(([id, count]) => {
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              return (
                <div key={id} style={{ marginBottom: '0.6rem' }}>
                  <div className="vote-bar-wrap">
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: id === eliminatedId ? 'var(--red-bright)' : 'var(--surface2)',
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1.5rem' }}>
          {t.voteResult.nightSoon}
        </p>
      </div>
    </div>
  )
}
