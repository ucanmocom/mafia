import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

function DetectiveResultDisplay({ detectiveResult }) {
  const { t } = useLanguage()
  const [resultTimer, setResultTimer] = useState(10)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (detectiveResult) {
      setShowResult(true)
      setResultTimer(10)
    }
  }, [detectiveResult])

  useEffect(() => {
    if (!showResult) return
    
    const interval = setInterval(() => {
      setResultTimer(t => {
        if (t <= 1) {
          setShowResult(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [showResult])

  if (!showResult || !detectiveResult) return null

  const { targetNick, isMafia } = detectiveResult

  return (
    <div className={`detective-popup${isMafia ? '' : ' safe'}`}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
        {isMafia ? '🔪' : '✅'}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
        {targetNick}
      </div>
      <span className="badge" style={{ background: isMafia ? 'var(--red-bright)' : 'var(--green)', marginBottom: '16px' }}>
        {isMafia ? 'MAFIA' : t.day.innocent}
      </span>
      <p className="label-cap">{t.day.disappears} {resultTimer}s</p>
    </div>
  )
}

export default function DayScreen({ state, actions }) {
  const { t } = useLanguage()
  const { players, round, skipDay, detectiveResult } = state
  const totalTime = Math.round((state.dayDuration || 120000) / 1000)
  const [timeLeft, setTimeLeft] = useState(totalTime)

  useEffect(() => {
    const total = Math.round((state.dayDuration || 120000) / 1000)
    setTimeLeft(total)
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [round, state.dayDuration])

  const myPlayer      = players.find(p => p.id === state.playerId)
  const isAlive        = myPlayer ? myPlayer.isAlive !== false : true
  const alivePlayers  = players.filter(p => p.isAlive !== false)
  const timerColor    = timeLeft <= Math.ceil(totalTime / 5) ? 'var(--red-bright)' : 'var(--text-dim)'
  const skipPct = skipDay.needed > 0 ? Math.round((skipDay.count / skipDay.needed) * 100) : 0

  return (
    <div className="screen">
      <div className="card">
        {/* Stats strip */}
        <div className="stats-strip" style={{ marginBottom: '16px' }}>
          <div className="stat-col">
            <span className="stat-label">{t.day.time}</span>
            <span className="stat-value" style={{ color: timerColor }}>{timeLeft}s</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.day.round}</span>
            <span className="stat-value">#{round}</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.day.alive}</span>
            <span className="stat-value">{alivePlayers.length}</span>
          </div>
        </div>

        <h2 style={{ marginBottom: '12px' }}>{t.day.discussion}</h2>

        {/* Skip discussion */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            className={`btn ${(skipDay.hasVoted || !isAlive) ? 'btn-ghost' : 'btn-warning'}`}
            disabled={skipDay.hasVoted || !isAlive}
            onClick={actions.skipDay}
            title={!isAlive ? t.day.eliminated : undefined}
          >
            {skipDay.hasVoted ? t.day.skipVoted : t.day.skipDiscussion}
          </button>
          {skipDay.needed > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>{t.day.skipVotes}</span>
                <span>{skipDay.count} / {skipDay.needed} (60%)</span>
              </div>
              <div style={{ height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, skipPct)}%`, background: 'var(--yellow)', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>

        <div className="divider">{t.day.alivePlayers} ({alivePlayers.length})</div>
        <div className="scroll-list" style={{ marginTop: '0.75rem' }}>
          {alivePlayers.map(p => (
            <div key={p.id} className="player-row">
              <div className="avatar">{p.nick[0].toUpperCase()}</div>
              <span>{p.nick}</span>
            </div>
          ))}
        </div>
      </div>
      
      <DetectiveResultDisplay detectiveResult={detectiveResult} />
    </div>
  )
}
