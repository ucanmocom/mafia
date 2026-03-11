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
        title={t.close}
      >
        ✕
      </button>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>❌</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
        {t.voting.cannotVoteLover} {errorNick}
      </p>
      <span className="badge" style={{ background: 'var(--red-bright)', marginBottom: '12px' }}>
        {t.voting.loverBadge}
      </span>
      <p className="label-cap" style={{ marginTop: '12px' }}>{t.voting.closesIn} {timer}s</p>
    </div>
  )
}

export default function VotingScreen({ state, actions }) {
  const { t } = useLanguage()
  const { players, votes, hasVoted, votedCount, playerId, round, detectiveResult, cannotVoteLoverError, role } = state
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
  const myRoleLabel  = role ? (t.roles?.[role] || role) : '-'
  const alivePlayers = players.filter(p => p.isAlive !== false)
  const eligibleVoters = players.filter(p => p.isAlive !== false && p.isConnected !== false)
  const totalVotes   = Object.values(votes).reduce((a, b) => a + b, 0)
  const votedCountDisplay = Math.max(Number(votedCount) || 0, totalVotes)
  const timerColor   = timeLeft <= 10 ? 'var(--red-bright)' : 'var(--text)'
  const skipLabel    = (t.voting.skipElim || '').replace(/^⏭\s*/, '')

  const handleVote = (targetId) => {
    if (!hasVoted) actions.vote(targetId)
  }

  const tallyEntries = Object.entries(votes).map(([id, count]) => ({
    id,
    nick: id === 'skip' ? t.voting.abstain : (players.find(p => p.id === id)?.nick ?? id),
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
      <div style={{ width: '100%', maxWidth: '720px', padding: '0 8px', marginTop: '-8px' }}>
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '0.03em', marginBottom: '6px', textAlign: 'center' }}>
            {t.voting.title}
          </h2>
          <div style={{
            padding: '0 0 6px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              {t.voting.playerLabel} <span style={{ color: 'var(--text)', fontWeight: 800 }}>{myPlayer?.nick || '-'}</span>
              <span style={{ color: 'var(--border2)', margin: '0 8px' }}>·</span>
              {t.voting.roleLabel} <span style={{ color: 'var(--text)', fontWeight: 800 }}>{myRoleLabel}</span>
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <style>{`
            @keyframes voteOptionPulse {
              0%, 100% {
                transform: translateY(0) scale(1);
                filter: brightness(1);
              }
              50% {
                transform: translateY(-2px) scale(1.07);
                filter: brightness(1.14);
              }
            }

            @keyframes voteCastBloodGlow {
              0%, 100% {
                color: #d92c2c;
                text-shadow: 0 0 6px rgba(217, 44, 44, 0.35);
                transform: scale(1);
              }
              50% {
                color: #ee3b3b;
                text-shadow: 0 0 10px rgba(217, 44, 44, 0.55), 0 0 18px rgba(139, 0, 0, 0.45);
                transform: scale(1.03);
              }
            }
          `}</style>
          <p style={{
            marginBottom: '10px',
            textAlign: 'center',
            fontSize: '1.45rem',
            fontWeight: 900,
            letterSpacing: '0.03em',
            color: '#f7f1f1',
            textShadow: '0 0 10px rgba(255,255,255,0.18), 0 0 20px rgba(139, 0, 0, 0.4)',
          }}>
            {t.voting.whoEliminate}
          </p>
          {!isAlive ? (
            <p style={{ marginBottom: '4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.voting.spectating}</p>
          ) : hasVoted ? (
            <p style={{
              color: '#d92c2c',
              fontSize: '1.18rem',
              margin: '2px 0 6px',
              fontWeight: 800,
              textAlign: 'center',
              letterSpacing: '0.02em',
              animation: 'voteCastBloodGlow 1.8s ease-in-out infinite',
            }}>
              {t.voting.voteCast}
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '14px', justifyContent: 'center' }}>
                {alivePlayers
                  .filter(p => p.id !== playerId)
                  .map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => handleVote(p.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px', width: '98px',
                      }}
                    >
                      <div style={{
                        width: 82, height: 82, borderRadius: '50%',
                        background: 'var(--surface2)',
                        border: '3px solid var(--red-bright)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem', fontWeight: 900, color: 'var(--text)',
                        transition: 'border-color .12s, background .12s, transform .12s',
                        animation: 'voteOptionPulse 1.45s ease-in-out infinite',
                        animationDelay: idx % 2 === 0 ? '0s' : '0.72s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.background = 'var(--surface3)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--red-bright)'; e.currentTarget.style.background = 'var(--surface2)' }}
                      >
                        {p.nick[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-dim)', maxWidth: 96, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>
                        {p.nick}
                      </span>
                    </button>
                  ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => handleVote('skip')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    width: '98px',
                  }}
                >
                  <div style={{
                    width: 82,
                    height: 82,
                    borderRadius: '50%',
                    background: 'var(--surface2)',
                    border: '3px solid var(--red-bright)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.82rem',
                    color: 'var(--text-dim)',
                    fontWeight: 800,
                    textAlign: 'center',
                    lineHeight: 1.15,
                    padding: '0 10px',
                    animation: 'voteOptionPulse 1.45s ease-in-out infinite',
                    animationDelay: '0.36s',
                  }}>
                    {skipLabel}
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0 14px' }} />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div className="stats-strip" style={{ marginBottom: 0 }}>
            <div className="stat-col">
              <span className="stat-label">{t.voting.time}</span>
              <span className="stat-value" style={{ color: timerColor }}>{timeLeft}s</span>
            </div>
            <div className="stat-col">
              <span className="stat-label">{t.voting.voted}</span>
              <span className="stat-value">{votedCountDisplay}/{eligibleVoters.length}</span>
            </div>
            <div className="stat-col">
              <span className="stat-label">{t.voting.round}</span>
              <span className="stat-value">#{round}</span>
            </div>
          </div>
        </div>

        {!isAlive ? (
          <div style={{ textAlign: 'center', padding: '4px 0 12px' }}>
            {renderTally()}
          </div>
        ) : hasVoted ? (
          <>
            {renderTally()}
          </>
        ) : (
          null
        )}
      </div>

      <DetectiveResultDisplay detectiveResult={detectiveResult} />
      <CannotVoteLoverError errorNick={showLoverError ? cannotVoteLoverError : null} onClose={() => setShowLoverError(false)} />
    </div>
  )
}
