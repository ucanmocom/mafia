import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function VoteSummaryScreen({ state }) {
  const { t } = useLanguage()
  const { voteDisplay, voteTally } = state
  const [timeLeft, setTimeLeft] = useState(10)

  useEffect(() => {
    setTimeLeft(10)
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const voteEntries = Object.entries(voteDisplay).map(([voter, target]) => ({ voter, target }))

  const tallyEntries = Object.entries(voteTally).map(([id, count]) => ({
    id,
    target: id === 'skip' ? t.voteSummary.skip : id,
    count,
  })).sort((a, b) => b.count - a.count)

  const totalVotes = Object.values(voteTally).reduce((a, b) => a + b, 0)
  const timerColor = timeLeft <= 3 ? 'var(--red-bright)' : 'var(--text)'

  return (
    <div className="screen">
      <div className="card">
        {/* Header stats strip */}
        <div className="stats-strip" style={{ marginBottom: '20px' }}>
          <div className="stat-col">
            <span className="stat-label">{t.voteSummary.time}</span>
            <span className="stat-value" style={{ color: timerColor }}>{timeLeft}s</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.voteSummary.votes}</span>
            <span className="stat-value">{totalVotes}</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.voteSummary.candidates}</span>
            <span className="stat-value">{tallyEntries.length}</span>
          </div>
        </div>

        <h2 style={{ marginBottom: '20px' }}>{t.voteSummary.title}</h2>

        {/* Tally bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {tallyEntries.map(({ id, target, count }, idx) => {
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const isLeading = idx === 0
            return (
              <div key={id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                  <span style={{
                    fontWeight: isLeading ? 700 : 500,
                    color: isLeading ? 'var(--text)' : 'var(--text-dim)',
                    fontSize: '0.9rem',
                  }}>
                    {target}
                  </span>
                  <span style={{
                    fontWeight: 700,
                    color: isLeading ? 'var(--red-bright)' : 'var(--text-muted)',
                    fontSize: '0.9rem',
                  }}>
                    {count}
                  </span>
                </div>
                <div className="vote-bar-wrap">
                  <div className="vote-bar-fill" style={{
                    width: `${pct}%`,
                    background: id === 'skip' ? 'var(--surface2)' : (isLeading ? 'var(--red-bright)' : 'rgba(122,24,18,0.5)'),
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Individual votes */}
        <div className="divider" style={{ marginBottom: '12px' }}>{t.voteSummary.whoVoted}</div>
        <div className="scroll-list" style={{ maxHeight: '180px' }}>
          {voteEntries.map((entry, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem', minWidth: '90px', fontWeight: 500 }}>
                {entry.voter}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.82rem' }}>{entry.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
