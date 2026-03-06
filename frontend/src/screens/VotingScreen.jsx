import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

function DetectiveResultDisplay({ detectiveResult }) {
  const { t } = useLanguage()
  const [resultTimer, setResultTimer] = useState(10)
  const [showResult, setShowResult]   = useState(false)

  useEffect(() => {
    if (detectiveResult) {
      setShowResult(true)
      setResultTimer(10)
    }
  }, [detectiveResult])

  useEffect(() => {
    if (!showResult) return
    const id = setInterval(() => {
      setResultTimer(t => {
        if (t <= 1) { setShowResult(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
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
        {isMafia ? 'MAFIA' : t.voting.innocent}
      </span>
      <p className="label-cap">{t.voting.disappears} {resultTimer}s</p>
    </div>
  )
}

function CannotVoteLoverError({ errorNick, onClose }) {
  const { t } = useLanguage()
  const [timer, setTimer] = useState(10)

  useEffect(() => {
    if (!errorNick) return
    setTimer(10)
    const id = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { onClose?.(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [errorNick, onClose])

  if (!errorNick) return null

  return (
    <div className="detective-popup" style={{ borderColor: 'var(--red-bright)' }}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px' }}
        onClick={() => onClose?.()}
        title="Zamknij"
      >
        ✕
      </button>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>❌</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
        Nie możesz głosować na {errorNick}
      </p>
      <span className="badge" style={{ background: 'var(--red-bright)', marginBottom: '12px' }}>
        Zakochany/a
      </span>
      <p className="label-cap" style={{ marginTop: '12px' }}>Zamknięcie za {timer}s</p>
    </div>
  )
}

export default function VotingScreen({ state, actions }) {
  const { t } = useLanguage()
  const { players, votes, hasVoted, votedCount, playerId, round, detectiveResult, cannotVoteLoverError } = state
  const totalTime = 60
  const [showLoverError, setShowLoverError] = useState(!!cannotVoteLoverError)
  const [timeLeft, setTimeLeft] = useState(totalTime)

  useEffect(() => {
    setTimeLeft(totalTime)
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [round])

  useEffect(() => {
    if (cannotVoteLoverError) {
      setShowLoverError(true)
    }
  }, [cannotVoteLoverError])

  const myPlayer     = players.find(p => p.id === playerId)
  const isAlive      = myPlayer ? myPlayer.isAlive !== false : true
  const alivePlayers = players.filter(p => p.isAlive !== false)
  const totalVotes   = Object.values(votes).reduce((a, b) => a + b, 0)
  const timerColor   = timeLeft <= 10 ? 'var(--red-bright)' : 'var(--text)'

  const handleVote = (targetId) => {
    if (!hasVoted) actions.vote(targetId)
  }

  const tallyEntries = Object.entries(votes).map(([id, count]) => ({
    id,
    nick: id === 'skip' ? 'Abstain' : (players.find(p => p.id === id)?.nick ?? id),
    count,
    isSkip: id === 'skip',
  })).sort((a, b) => b.count - a.count)

  const renderTally = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {tallyEntries.map(({ id, nick, count, isSkip }) => {
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
        return (
          <div key={id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.88rem', color: isSkip ? 'var(--text-muted)' : 'var(--text)', fontWeight: 500 }}>{nick}</span>
              <span className="label-cap">{count}</span>
            </div>
            <div className="vote-bar-wrap">
              <div className="vote-bar-fill" style={{ width: `${pct}%`, background: isSkip ? 'var(--border)' : 'var(--red-bright)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="screen">
      <div className="card">
        {/* Header stats strip */}
        <div className="stats-strip" style={{ marginBottom: '20px' }}>
          <div className="stat-col">
            <span className="stat-label">{t.voting.time}</span>
            <span className="stat-value" style={{ color: timerColor }}>{timeLeft}s</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.voting.voted}</span>
            <span className="stat-value">{votedCount}/{alivePlayers.length}</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.voting.round}</span>
            <span className="stat-value">#{round}</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h2>{t.voting.title}</h2>
        </div>

        {!isAlive ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ marginBottom: '16px', fontSize: '0.88rem' }}>{t.voting.spectating}</p>
            {renderTally()}
          </div>
        ) : hasVoted ? (
          <>
            <p style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>
              {t.voting.voteCast}
            </p>
            {renderTally()}
          </>
        ) : (
          <>
            <p className="label-cap" style={{ marginBottom: '12px' }}>{t.voting.selectTarget}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              {alivePlayers
                .filter(p => p.id !== playerId)
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleVote(p.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'var(--surface2)',
                      border: '2px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)',
                      transition: 'border-color .12s, background .12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red-bright)'; e.currentTarget.style.background = 'var(--surface3)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}
                    >
                      {p.nick[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', maxWidth: 56, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>
                      {p.nick}
                    </span>
                  </button>
                ))}
            </div>
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
              onClick={() => handleVote('skip')}
            >
              {t.voting.skipElim}
            </button>
          </>
        )}
      </div>

      <DetectiveResultDisplay detectiveResult={detectiveResult} />
      <CannotVoteLoverError errorNick={showLoverError ? cannotVoteLoverError : null} onClose={() => setShowLoverError(false)} />
    </div>
  )
}
